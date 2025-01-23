import { Request, Response } from "express";
import { User, UserGroup } from "../interface/user";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/user.query";
import { Code } from "../enum/code.enum";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/status.enum";
import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";

import bcrypt from "bcryptjs";
import { generateInsertQuery } from "../query-maker/insert-query-maker";
import { generateUpdateQuery } from "../query-maker/update-query-maker";
import AuditLogger from "../middleware/audit-log";
import { EmailTemplateEvent } from "../enum/email-template-event.enum";
import { EmailTemplate } from "../interface/email-template";
import { replacePlaceholders, sendEmail } from "./sent-email";
const { v4: uuidv4 } = require("uuid");

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];

export const getUsers = async (
  req: Request,
  res: Response
): Promise<Response<User[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_USERS);

    return res
      .status(Code.OK)
      .send(new HttpResponse(Code.OK, Status.OK, "Users retrived", result[0]));
  } catch (error: unknown) {
    console.log(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  }
};

export const getUser = async (
  req: Request,
  res: Response
): Promise<Response<User>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_USER, [
      req.params.userId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const user = (result[0] as RowDataPacket[])[0];
      const groupResult: ResultSet = await pool.query(
        `SELECT u.*, g.name as group_name FROM user_group u
        left join security_group g on u.group_id = g.id
        where user_id=?`,
        [req.params.userId]
      );

      const groupList = (groupResult[0] as UserGroup[]) || [];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "User Rtrived", {
          ...user,
          groupList,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "User Not Found")
        );
    }
  } catch (error: unknown) {
    console.log(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<Response<User>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let user: User = { ...req.body };

  let groupList = req.body.groupList || [];

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password.trim(), salt);
    const userId = uuidv4();
    const userModel = {
      id: userId,
      username: user.username.trim(),
      email: user.email.trim(),
      full_name: user.full_name.trim(),
      is_active: user.is_active ?? false,
      is_admin: user.is_admin ?? false,
      phone: user.phone.trim(),
      address: user.address.trim(),
      user_type: user.user_type,
      isPasswordReset: user.isPasswordReset ?? false, // Default to false if not provided
      password: hashedPassword,
      company_id: user.company_id,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(userModel, "users"),
      [...Object.values(userModel)]
    );

    for (const group of groupList) {
      const id = uuidv4();
      const model = {
        id: id,
        user_id: userId,
        group_id: group.group_id,

        created_at: new Date(),
        created_by: loggedUser.id,
        created_ip: req.ip,
        updated_at: null,
        updated_by: null,
        updated_ip: null,
        company_id: loggedUser.company_id,
      };
      try {
        await pool.query(
          generateInsertQuery(model, "user_group"),
          Object.values(model)
        );
        await auditLogger.logAction("user_group", id, "insert", {}, model);
      } catch (error) {
        console.error("Error inserting child item:", error);
        // Rollback the transaction if there is an error during child insertion
        console.log("Attempting rollback...");
        await conn.rollback();
        console.log("Rollback completed.");
        conn.release();
        throw error;
      }
    }

    await auditLogger.logAction("users", userId, "insert", {}, userModel);

    const checkTemplateRes: ResultSet = await pool.query(
      "SELECT * FROM email_template et where et.email_event=? and et.is_active=1",
      [EmailTemplateEvent.WHEN_NEW_UESR_CREATES]
    );
    const emailTemplate =
      (checkTemplateRes[0] as Array<ResultSet>).length > 0
        ? (checkTemplateRes[0] as EmailTemplate[])
        : [];

    if (emailTemplate.length > 0) {
      const to = replacePlaceholders(emailTemplate[0].email_to.toString(), {
        user_email: user.email,
      });
      const body = replacePlaceholders(emailTemplate[0].email_body.toString(), {
        website_base_url: process.env.WEBSITE_BASE_URL,
        full_name: user.full_name,
        username: user.username,
        password: user.password,
      });

      await sendEmail({
        from: process.env.EMAIL_USER || "",
        to: to,
        cc: emailTemplate[0].email_cc.toString(),
        subject: emailTemplate[0].email_subject.toString(),
        body: body,
      });
    }

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(Code.CREATED, Status.CREATED, "User Created", user)
      );
  } catch (error) {
    console.log(error);
    if (conn) {
      console.log("Attempting rollback...");
      await conn.rollback();
      console.log("Rollback completed.");
      await conn.release();
    }

    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occurred!!!"
        )
      );
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response<User>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let user: User = { ...req.body };
  let groupList = req.body.groupList || [];

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;

    const result: ResultSet = await pool.query(QUERY.SELECT_USER, [
      req.params.userId,
    ]);

    const userModel = {
      username: user.username.trim(),
      email: user.email.trim(),
      full_name: user.full_name.trim(),
      is_active: user.is_active,
      is_admin: user.is_admin,
      phone: user.phone.trim(),
      address: user.address.trim(),
      user_type: user.user_type,
      isPasswordReset: user.isPasswordReset,
      company_id: user.company_id,

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateUser: ResultSet = await pool.query(
        generateUpdateQuery(userModel, "users", "id"),
        [...Object.values(userModel), req.params.userId]
      );

      // start delete the missmatched id
      const existingGroupIdsQueryResult: ResultSet = await pool.query(
        "SELECT * FROM user_group where user_id=?",
        [req.params.userId]
      );
      const existingGroupGroupList =
        (existingGroupIdsQueryResult[0] as UserGroup[]) || [];
      const existingGroupIds = existingGroupGroupList.map((row: any) => row.id);

      // Compare existingGroupIds with rule_ids received from frontend
      const groupIdsFromFrontend = groupList.map((group: any) => group.id);

      // Identify the group_ids that are present in the database but not in the frontend list
      const groupIdsToDelete = existingGroupIds.filter(
        (id: string) => !groupIdsFromFrontend.includes(id)
      );

      // Delete the corresponding records from the database
      for (const groupIdToDelete of groupIdsToDelete) {
        // Perform deletion query for groupIdToDelete
        await pool.query("DELETE FROM user_group where id=?", [
          groupIdToDelete,
        ]);
      }
      // end

      for (const group of groupList) {
        const groupRes: ResultSet = await pool.query(
          "select * from user_group where id=?",
          [group.id]
        );
        const model = {
          user_id: req.params.userId,
          group_id: group.group_id,

          updated_by: loggedUser.id,
          updated_at: new Date(),
          updated_ip: req.ip,
          company_id: loggedUser.company_id,
        };

        if (group.id) {
          const updateSecurityGroup: ResultSet = await pool.query(
            generateUpdateQuery(model, "user_group", "id"),
            [...Object.values(model), group.id]
          );

          await auditLogger.logAction(
            "user_group",
            group.id,
            "update",
            (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
            model
          );
        } else {
          const id = uuidv4();
          const model = {
            id: id,
            user_id: req.params.userId,
            group_id: group.group_id,

            created_at: new Date(),
            created_by: loggedUser.id,
            created_ip: req.ip,
            updated_at: null,
            updated_by: null,
            updated_ip: null,
            company_id: loggedUser.company_id,
          };
          try {
            await pool.query(
              generateInsertQuery(model, "user_group"),
              Object.values(model)
            );

            await auditLogger.logAction("user_group", id, "insert", {}, model);
          } catch (error) {
            console.error("Error inserting child item:", error);
            // Rollback the transaction if there is an error during child insertion
            console.log("Attempting rollback...");
            await conn.rollback();
            console.log("Rollback completed.");
            conn.release();
            throw error;
          }
        }
      }

      await auditLogger.logAction(
        "users",
        req.params.userId,
        "update",
        result[0],
        userModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "User Updated", {
          ...user,
          id: req.params.userId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "User Not Found")
        );
    }
  } catch (error: unknown) {
    console.log(error);
    if (conn) {
      console.log("Attempting rollback...");
      await conn.rollback();
      console.log("Rollback completed.");
    }
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  } finally {
    await conn!.commit();
    await conn!.release();
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<Response<User>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_USER, [
      req.params.userId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateUser: ResultSet = await pool.query(QUERY.DELETE_USER, [
        [req.params.userId],
      ]);
      await auditLogger.logAction(
        "users",
        req.params.userId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "User Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "User Not Found")
        );
    }
  } catch (error: unknown) {
    console.log(error);
    return res
      .status(Code.INTERNAL_SERVER_ERROR)
      .send(
        new HttpResponse(
          Code.INTERNAL_SERVER_ERROR,
          Status.INTERNAL_SERVER_ERROR,
          "An error occured!!!"
        )
      );
  }
};
