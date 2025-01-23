import { Request, Response } from "express";
import {
  SecurityRule,
  SecurityRuleWiseMenuPermission,
} from "../interface/security-rule";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/security-rule.query";
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

export const getSecurityRules = async (
  req: Request,
  res: Response
): Promise<Response<SecurityRule[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_RULES);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(
          Code.OK,
          Status.OK,
          "SecurityRules retrived",
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

export const getSecurityRule = async (
  req: Request,
  res: Response
): Promise<Response<SecurityRule>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_RULE, [
      req.params.securityRuleId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const rule = (result[0] as RowDataPacket[])[0];

      const permissionResult: ResultSet = await pool.query(
        "SELECT * FROM security_rule_wise_menu_permission where rule_id=?",
        [req.params.securityRuleId]
      );

      const permissionList =
        (permissionResult[0] as SecurityRuleWiseMenuPermission[]) || [];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "SecurityRule Fetched", {
          ...rule,
          permissionList,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "SecurityRule Not Found"
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

export const createSecurityRule = async (
  req: Request,
  res: Response
): Promise<Response<SecurityRule>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let rule = { ...req.body };
  let menuPermissionList = req.body.menuPermissionList || [];

  let SecurityRuleWiseMenuPermissions = [];
  for (const id in menuPermissionList) {
    const obj = {
      menu_id: id,
      can_view: menuPermissionList[id]["can_view"] || false,
      can_create: menuPermissionList[id]["can_create"] || false,
      can_update: menuPermissionList[id]["can_update"] || false,
      can_delete: menuPermissionList[id]["can_delete"] || false,
      can_report: menuPermissionList[id]["can_report"] || false,
    };
    SecurityRuleWiseMenuPermissions.push(obj);
  }

  const pool = await connection();

  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;

    const securityRuleId = uuidv4();
    const ruleModel = {
      id: securityRuleId,
      name: rule.name.trim(),
      description: rule.description.trim(),

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result = await pool.query(
      generateInsertQuery(ruleModel, "security_rule"),
      Object.values(ruleModel)
    );

    for (const per of SecurityRuleWiseMenuPermissions) {
      const id = uuidv4();
      const model = {
        id: id,
        rule_id: securityRuleId,
        menu_id: per.menu_id,
        can_view: per.can_view,
        can_create: per.can_create,
        can_update: per.can_update,
        can_delete: per.can_delete,
        can_report: per.can_report,

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
          generateInsertQuery(model, "security_rule_wise_menu_permission"),
          Object.values(model)
        );

        await auditLogger.logAction(
          "security_rule_wise_menu_permission",
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
      "security_rule",
      securityRuleId,
      "insert",
      {},
      ruleModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "SecurityRule Created",
          rule
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

export const updateSecurityRule = async (
  req: Request,
  res: Response
): Promise<Response<SecurityRule>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let rule: SecurityRule = { ...req.body };
  let menuPermissionList = req.body.menuPermissionList || [];

  let SecurityRuleWiseMenuPermissions = [];
  for (const id in menuPermissionList) {
    const obj = {
      pId: menuPermissionList[id]["permission_id"] || false,
      menu_id: id,
      can_view: menuPermissionList[id]["can_view"] || false,
      can_create: menuPermissionList[id]["can_create"] || false,
      can_update: menuPermissionList[id]["can_update"] || false,
      can_delete: menuPermissionList[id]["can_delete"] || false,
      can_report: menuPermissionList[id]["can_report"] || false,
    };
    SecurityRuleWiseMenuPermissions.push(obj);
  }

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;

    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_RULE, [
      req.params.securityRuleId,
    ]);

    const ruleModel = {
      name: rule.name.trim(),
      description: rule.description.trim(),

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateSecurityRule: ResultSet = await pool.query(
        generateUpdateQuery(ruleModel, "security_rule", "id"),
        [...Object.values(ruleModel), req.params.securityRuleId]
      );

      // TODO update permission

      for (const per of SecurityRuleWiseMenuPermissions) {
        const groupRes: ResultSet = await pool.query(
          "select * from security_rule_wise_menu_permission where id=?",
          [per.pId]
        );
        const model = {
          rule_id: req.params.securityRuleId,
          menu_id: per.menu_id,
          can_view: per.can_view,
          can_create: per.can_create,
          can_update: per.can_update,
          can_delete: per.can_delete,
          can_report: per.can_report,

          updated_by: loggedUser.id,
          updated_at: new Date(),
          updated_ip: req.ip,
          company_id: loggedUser.company_id,
        };

        if (per.pId) {
          const updateSecurityRule: ResultSet = await pool.query(
            generateUpdateQuery(
              model,
              "security_rule_wise_menu_permission",
              "id"
            ),
            [...Object.values(model), per.pId]
          );
          await auditLogger.logAction(
            "security_rule_wise_menu_permission",
            per.pId,
            "update",
            (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
            model
          );
        } else {
          const id = uuidv4();
          const model = {
            id: id,
            rule_id: req.params.securityRuleId,
            menu_id: per.menu_id,
            can_view: per.can_view,
            can_create: per.can_create,
            can_update: per.can_update,
            can_delete: per.can_delete,
            can_report: per.can_report,

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
              generateInsertQuery(model, "security_rule_wise_menu_permission"),
              Object.values(model)
            );
            await auditLogger.logAction(
              "security_rule_wise_menu_permission",
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
      }
      await auditLogger.logAction(
        "security_rule",
        req.params.securityRuleId,
        "update",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        ruleModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "SecurityRule Updated", {
          ...rule,
          id: req.params.securityRuleId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "SecurityRule Not Found"
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

export const deleteSecurityRule = async (
  req: Request,
  res: Response
): Promise<Response<SecurityRule>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);

    const result: ResultSet = await pool.query(QUERY.SELECT_SECURITY_RULE, [
      req.params.securityRuleId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateSecurityRule: ResultSet = await pool.query(
        QUERY.DELETE_SECURITY_RULE,
        [[req.params.securityRuleId]]
      );

      await auditLogger.logAction(
        "security_rule",
        req.params.securityRuleId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "SecurityRule Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "SecurityRule Not Found"
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
