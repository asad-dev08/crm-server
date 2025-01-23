import { Request, Response } from "express";
import { EmailTemplate } from "../interface/email-template";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/email-template-query";
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

export const getDataWithPagination = async (
  req: Request,
  res: Response
): Promise<Response<EmailTemplate>> => {
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
      `SELECT t.*, ee.event_name event_name FROM 
      email_template t
      left join email_event ee on t.email_event=ee.id
       LIMIT ? OFFSET ? `,
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

export const getEmailTemplates = async (
  req: Request,
  res: Response
): Promise<Response<EmailTemplate[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_EMAIL_TEMPLATES);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(
          Code.OK,
          Status.OK,
          "EmailTemplates retrived",
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

export const getEmailTemplate = async (
  req: Request,
  res: Response
): Promise<Response<EmailTemplate>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_EMAIL_TEMPLATE, [
      req.params.templateId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const template = (result[0] as RowDataPacket[])[0];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "EmailTemplate Rtrived", {
          ...template,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "EmailTemplate Not Found"
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

export const createEmailTemplate = async (
  req: Request,
  res: Response
): Promise<Response<EmailTemplate>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let template: EmailTemplate = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const templateId = uuidv4();
    const templateModel = {
      id: templateId,
      template_name: template.template_name,
      email_event: template.email_event,
      email_subject: template.email_subject,
      email_body: template.email_body,
      email_to: template.email_to,
      email_cc: template.email_cc,
      is_active: template.is_active,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(templateModel, "email_template"),
      [...Object.values(templateModel)]
    );

    await auditLogger.logAction(
      "email_template",
      templateId,
      "insert",
      {},
      templateModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "Email Template Created",
          template
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

export const updateEmailTemplate = async (
  req: Request,
  res: Response
): Promise<Response<EmailTemplate>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let template: EmailTemplate = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_EMAIL_TEMPLATE, [
      req.params.templateId,
    ]);

    const templateModel = {
      template_name: template.template_name,
      email_event: template.email_event,
      email_subject: template.email_subject,
      email_body: template.email_body,
      email_to: template.email_to,
      email_cc: template.email_cc,
      is_active: template.is_active,

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateEmailTemplate: ResultSet = await pool.query(
        generateUpdateQuery(templateModel, "email_template", "id"),
        [...Object.values(templateModel), req.params.templateId]
      );

      await auditLogger.logAction(
        "email_template",
        req.params.templateId,
        "update",
        result[0],
        templateModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Email Template Updated", {
          ...template,
          id: req.params.templateId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Email Template Not Found"
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

export const deleteEmailTemplate = async (
  req: Request,
  res: Response
): Promise<Response<EmailTemplate>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_EMAIL_TEMPLATE, [
      req.params.templateId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateEmailTemplate: ResultSet = await pool.query(
        QUERY.DELETE_EMAIL_TEMPLATE,
        [[req.params.templateId]]
      );
      await auditLogger.logAction(
        "email_template",
        req.params.templateId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Email Template Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Email Template Not Found"
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
