import { Request, Response } from "express";
import { SecurityGroup, SecurityGroupRule } from "../interface/security-group";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/security-group.query";
import { Code } from "../enum/code.enum";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/status.enum";
import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";

import { generateInsertQuery } from "../query-maker/insert-query-maker";
import { generateUpdateQuery } from "../query-maker/update-query-maker";
import AuditLogger from "../middleware/audit-log";
const { v4: uuidv4 } = require("uuid");

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];

export const getSecurityGroups = async (
  req: Request,
  res: Response
): Promise<Response<SecurityGroup[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_GROUPS);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(
          Code.OK,
          Status.OK,
          "SecurityGroups retrived",
          result[0]
        )
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

export const getSecurityGroup = async (
  req: Request,
  res: Response
): Promise<Response<SecurityGroup>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_GROUP, [
      req.params.securityGroupId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const group = (result[0] as RowDataPacket[])[0];

      const ruleResult: ResultSet = await pool.query(
        `SELECT g.*, r.name as rule_name FROM security_group_rule g
        left join security_rule r on g.rule_id = r.id
        where group_id=?`,
        [req.params.securityGroupId]
      );

      const ruleList = (ruleResult[0] as SecurityGroupRule[]) || [];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "SecurityGroup Fetched", {
          ...group,
          ruleList,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "SecurityGroup Not Found"
          )
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

export const createSecurityGroup = async (
  req: Request,
  res: Response
): Promise<Response<SecurityGroup>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let group = { ...req.body };
  let ruleList = req.body.ruleList || [];

  const pool = await connection();

  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;

    const securityGroupId = uuidv4();
    const groupModel = {
      id: securityGroupId,
      name: group.name.trim(),
      description: group.description.trim(),

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result = await pool.query(
      generateInsertQuery(groupModel, "security_group"),
      Object.values(groupModel)
    );

    for (const rule of ruleList) {
      const id = uuidv4();
      const model = {
        id: id,
        group_id: securityGroupId,
        rule_id: rule.rule_id,

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
          generateInsertQuery(model, "security_group_rule"),
          Object.values(model)
        );
        await auditLogger.logAction(
          "security_group_rule",
          id,
          "insert",
          {},
          model
        );
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

    await auditLogger.logAction(
      "security_group",
      securityGroupId,
      "insert",
      {},
      groupModel
    );
    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "SecurityGroup Created",
          group
        )
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

export const updateSecurityGroup = async (
  req: Request,
  res: Response
): Promise<Response<SecurityGroup>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let group: SecurityGroup = { ...req.body };
  let ruleList = req.body.ruleList || [];

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;

    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_GROUP, [
      req.params.securityGroupId,
    ]);

    const groupModel = {
      name: group.name.trim(),
      description: group.description.trim(),

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateSecurityGroup: ResultSet = await pool.query(
        generateUpdateQuery(groupModel, "security_group", "id"),
        [...Object.values(groupModel), req.params.securityGroupId]
      );

      // TODO update permission
      // start delete the missmatched id
      const existingRuleIdsQueryResult: ResultSet = await pool.query(
        "SELECT * FROM security_group_rule where group_id=?",
        [req.params.securityGroupId]
      );
      const existingGroupRuleList =
        (existingRuleIdsQueryResult[0] as SecurityGroupRule[]) || [];
      const existingRuleIds = existingGroupRuleList.map((row: any) => row.id);

      // Compare existingRuleIds with rule_ids received from frontend
      const ruleIdsFromFrontend = ruleList.map((rule: any) => rule.id);

      // Identify the rule_ids that are present in the database but not in the frontend list
      const ruleIdsToDelete = existingRuleIds.filter(
        (id: string) => !ruleIdsFromFrontend.includes(id)
      );

      // Delete the corresponding records from the database
      for (const ruleIdToDelete of ruleIdsToDelete) {
        const groupRes: ResultSet = await pool.query(
          "select * from security_group_rule where id=?",
          [ruleIdToDelete]
        );
        // Perform deletion query for ruleIdToDelete
        await pool.query("DELETE FROM security_group_rule where id=?", [
          ruleIdToDelete,
        ]);
        await auditLogger.logAction(
          "security_group_rule",
          ruleIdToDelete,
          "delete",
          (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
          {}
        );
      }
      // end

      for (const rule of ruleList) {
        const groupRes: ResultSet = await pool.query(
          "select * from security_group_rule where id=?",
          [rule.id]
        );
        const model = {
          group_id: req.params.securityGroupId,
          rule_id: rule.rule_id,

          updated_by: loggedUser.id,
          updated_at: new Date(),
          updated_ip: req.ip,
          company_id: loggedUser.company_id,
        };

        if (rule.id) {
          const updateSecurityGroup: ResultSet = await pool.query(
            generateUpdateQuery(model, "security_group_rule", "id"),
            [...Object.values(model), rule.id]
          );

          await auditLogger.logAction(
            "security_group_rule",
            rule.id,
            "update",
            (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
            model
          );
        } else {
          const id = uuidv4();
          const model = {
            id: id,
            group_id: req.params.securityGroupId,
            rule_id: rule.rule_id,

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
              generateInsertQuery(model, "security_group_rule"),
              Object.values(model)
            );
            await auditLogger.logAction(
              "security_group_rule",
              id,
              "insert",
              model,
              {}
            );
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
        "security_group",
        req.params.securityGroupId,
        "update",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        groupModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "SecurityGroup Updated", {
          ...group,
          id: req.params.securityGroupId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "SecurityGroup Not Found"
          )
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

export const deleteSecurityGroup = async (
  req: Request,
  res: Response
): Promise<Response<SecurityGroup>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_GROUP, [
      req.params.securityGroupId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateSecurityGroup: ResultSet = await pool.query(
        QUERY.DELETE_SECURITY_GROUP,
        [[req.params.securityGroupId]]
      );
      await auditLogger.logAction(
        "security_group",
        req.params.securityGroupId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "SecurityGroup Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "SecurityGroup Not Found"
          )
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
