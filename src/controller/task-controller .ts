import { Request, Response } from "express";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/task-management-query";
import { Code } from "../enum/code.enum";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/status.enum";
import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";

import bcrypt from "bcryptjs";
import { generateInsertQuery } from "../query-maker/insert-query-maker";
import { generateUpdateQuery } from "../query-maker/update-query-maker";
import AuditLogger from "../middleware/audit-log";
import { Task, Taskuser, Subtask } from "../interface/task";
import { EmailTemplateEvent } from "../enum/email-template-event.enum";
import { replacePlaceholders, sendEmail } from "./sent-email";
import { EmailTemplate } from "../interface/email-template";
const { v4: uuidv4 } = require("uuid");

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];

export const getDataWithPagination = async (
  req: Request,
  res: Response
): Promise<Response<Task>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let { tableName = "", page = 0, pageSize = 0 } = { ...req.body };

  try {
    const pool = await connection();

    const countResult: ResultSet = await pool.query(QUERY.GET_TOTAL_COUNT, [
      tableName,
    ]);

    const result: ResultSet = await pool.query(
      "SELECT * FROM tasks LIMIT ? OFFSET ? ",
      [pageSize, (parseInt(page) - 1) * parseInt(pageSize)]
    );
    const rows = (result[0] as Array<ResultSet>).length > 0 ? result[0] : [];
    // console.log(rows);

    const total = (countResult[0] as RowDataPacket[])[0];

    const data = {
      total,
      rows,
    };

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(Code.CREATED, Status.CREATED, "Data Fetched", data)
      );
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

export const getTasks = async (
  req: Request,
  res: Response
): Promise<Response<Task[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_TASKS);

    let taskList =
      (result[0] as Array<ResultSet>).length > 0 ? (result[0] as Task[]) : [];

    for (const task of taskList) {
      const userRes = await pool.query(QUERY.SELECT_TASK_USERS, [task.id]);
      task.users = userRes[0] as Taskuser[];
    }

    return res
      .status(Code.OK)
      .send(new HttpResponse(Code.OK, Status.OK, "Tasks retrived", taskList));
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

export const getTasksByBoard = async (
  req: Request,
  res: Response
): Promise<Response<Task[]>> => {
  let { board_id = "" } = { ...req.body };
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_TASKS_BY_BOARD_ID, [
      board_id,
    ]);

    let taskList =
      (result[0] as Array<ResultSet>).length > 0 ? (result[0] as Task[]) : [];

    for (const task of taskList) {
      const userRes = await pool.query(QUERY.SELECT_TASK_USERS, [task.id]);
      task.users = userRes[0] as Taskuser[];
    }

    return res
      .status(Code.OK)
      .send(new HttpResponse(Code.OK, Status.OK, "Tasks retrived", taskList));
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

export const getTask = async (
  req: Request,
  res: Response
): Promise<Response<Task>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_TASK, [
      req.params.taskId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const task = (result[0] as RowDataPacket[])[0] as Task;

      const userRes = await pool.query(QUERY.SELECT_TASK_USERS, [task.id]);
      task.users = userRes[0] as Taskuser[];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Task Rtrived", {
          ...task,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Task Not Found")
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

export const createTask = async (
  req: Request,
  res: Response
): Promise<Response<Task>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let task: Task = { ...req.body };
  let users = req.body.users || [];

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const maxRes: ResultSet = await pool.query(QUERY.GET_MAX_BY_BOARD_ID, [
      task.board_id,
    ]);
    const total = (maxRes[0] as RowDataPacket[])[0];

    const loggedUser = (req as any).user;
    const taskId = uuidv4();
    const taskModel = {
      id: taskId,
      board_id: task.board_id,
      title: task.title,
      description: task.description,
      is_active: task.is_active || false,
      column_id: task.column_id,
      sequence_no: parseInt(total!.total + 1),
      start_date: task.start_date,
      target_date: task.target_date,
      priority: task.priority,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(taskModel, "tasks"),
      [...Object.values(taskModel)]
    );
    for (const user of users) {
      const id = uuidv4();
      const model = {
        id: id,
        task_id: taskId,
        user_id: user.user_id,

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
          generateInsertQuery(model, "task_users"),
          Object.values(model)
        );
        await auditLogger.logAction("task_users", id, "insert", {}, model);
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

    await auditLogger.logAction("tasks", taskId, "insert", {}, taskModel);

    const checkTemplateRes: ResultSet = await pool.query(
      "SELECT * FROM email_template et where et.email_event=? and et.is_active=1",
      [EmailTemplateEvent.WHEN_NEW_TASK_ASSIGNED]
    );
    const emailTemplate =
      (checkTemplateRes[0] as Array<ResultSet>).length > 0
        ? (checkTemplateRes[0] as EmailTemplate[])
        : [];

    if (emailTemplate.length > 0) {
      const subject = replacePlaceholders(
        emailTemplate[0].email_subject.toString(),
        { task_id: emailTemplate[0].id }
      );
      const body = replacePlaceholders(emailTemplate[0].email_body.toString(), {
        task_url:
          process.env.WEBSITE_BASE_URL +
          "/task-management/task-manipulation/" +
          task.board_id,
      });
      await sendEmail({
        from: process.env.EMAIL_USER || "",
        to: emailTemplate[0].email_to.toString(),
        cc: emailTemplate[0].email_cc.toString(),
        subject: subject,
        body: body,
      });
    }

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(Code.CREATED, Status.CREATED, "Task Created", task)
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

export const updateTask = async (
  req: Request,
  res: Response
): Promise<Response<Task>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let task: Task = { ...req.body };
  let users = req.body.users || [];

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_TASK, [
      req.params.taskId,
    ]);

    const taskModel = {
      board_id: task.board_id,
      title: task.title,
      description: task.description,
      is_active: task.is_active,
      column_id: task.column_id,
      sequence_no: task.sequence_no,
      start_date: task.start_date,
      target_date: task.target_date,
      priority: task.priority,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateTask: ResultSet = await pool.query(
        generateUpdateQuery(taskModel, "tasks", "id"),
        [...Object.values(taskModel), req.params.taskId]
      );

      // update task task column
      const existingUsersQueryResult: ResultSet = await pool.query(
        "SELECT * FROM task_users where task_id=?",
        [req.params.taskId]
      );
      const existingGroupRuleList =
        (existingUsersQueryResult[0] as Taskuser[]) || [];
      const existingUsers = existingGroupRuleList.map((row: any) => row.id);

      // Compare existingUsers with column_ids received from frontend
      const userIdsFromFrontend = users.map((col: any) => col.id);

      // Identify the user_ids that are present in the database but not in the frontend list
      const userIdsToDelete = existingUsers.filter(
        (id: string) => !userIdsFromFrontend.includes(id)
      );

      // Delete the corresponding records from the database
      for (const userIdToDelete of userIdsToDelete) {
        const groupRes: ResultSet = await pool.query(
          "select * from task_users where id=?",
          [userIdToDelete]
        );
        // Perform deletion query for userIdToDelete
        await pool.query("DELETE FROM task_users where id=?", [userIdToDelete]);
        await auditLogger.logAction(
          "task_users",
          userIdToDelete,
          "delete",
          (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
          {}
        );
      }
      // end

      for (const user of users) {
        const groupRes: ResultSet = await pool.query(
          "select * from task_users where id=?",
          [user.id]
        );
        const model = {
          task_id: req.params.taskId,
          user_id: user.user_id,

          updated_by: loggedUser.id,
          updated_at: new Date(),
          updated_ip: req.ip,
          company_id: loggedUser.company_id,
        };

        if (user.id) {
          const updateSecurityGroup: ResultSet = await pool.query(
            generateUpdateQuery(model, "task_users", "id"),
            [...Object.values(model), user.id]
          );

          await auditLogger.logAction(
            "task_users",
            user.id,
            "update",
            (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
            model
          );
        } else {
          const id = uuidv4();
          const model = {
            id: id,
            task_id: req.params.taskId,
            user_id: user.user_id,

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
              generateInsertQuery(model, "task_users"),
              Object.values(model)
            );
            await auditLogger.logAction("task_users", id, "insert", model, {});
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
        "tasks",
        req.params.taskId,
        "update",
        result[0],
        taskModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Task Updated", {
          ...task,
          id: req.params.taskId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Task Not Found")
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

export const deleteTask = async (
  req: Request,
  res: Response
): Promise<Response<Task>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_TASK, [
      req.params.taskId,
    ]);
    console.log(req.params);
    if ((result[0] as Array<ResultSet>).length > 0) {
      const deleteTask: ResultSet = await pool.query(
        "DELETE FROM tasks WHERE id=? and board_id=?",
        [req.params.taskId, req.params.boardId]
      );

      const deleteTaskusers: ResultSet = await pool.query(
        QUERY.DELETE_TASK_USERS,
        [req.params.taskId]
      );
      await auditLogger.logAction(
        "tasks",
        req.params.taskId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      await auditLogger.logAction(
        "task_users",
        req.params.taskId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Task Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Task Not Found")
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
