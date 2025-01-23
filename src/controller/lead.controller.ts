import { Request, Response } from "express";
import { Lead } from "../interface/lead";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/lead-query";
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
): Promise<Response<Lead>> => {
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
      `SELECT l.*, ls.name source_name, lss.name status_name, u.full_name assigned_user FROM 
      leads l 
      left join lead_source ls on l.source_id=ls.id
      left join lead_status lss on l.status_id=lss.id
      left join users u on l.user_id=u.id
      order by l.created_at desc LIMIT ? OFFSET ? `,
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

export const getLeads = async (
  req: Request,
  res: Response
): Promise<Response<Lead[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_LEADS);

    return res
      .status(Code.OK)
      .send(new HttpResponse(Code.OK, Status.OK, "Leads retrived", result[0]));
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

export const getLead = async (
  req: Request,
  res: Response
): Promise<Response<Lead>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_LEAD, [
      req.params.leadId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const lead = (result[0] as RowDataPacket[])[0];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Lead Rtrived", {
          ...lead,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Lead Not Found")
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

export const createLead = async (
  req: Request,
  res: Response
): Promise<Response<Lead>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let lead: Lead = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const leadId = uuidv4();
    const leadModel = {
      id: leadId,
      source_id: lead.source_id,
      status_id: lead.status_id,
      user_id: lead.user_id,
      name: lead.name,
      address: lead.address,
      city: lead.city,
      country: lead.country,
      zipcode: lead.zipcode,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      lead_value: lead.lead_value,
      description: lead.description,
      contact_date: lead.contact_date,
      is_active: lead.is_active || false,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(leadModel, "leads"),
      [...Object.values(leadModel)]
    );

    await auditLogger.logAction("leads", leadId, "insert", {}, leadModel);

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(Code.CREATED, Status.CREATED, "Lead Created", lead)
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

export const updateLead = async (
  req: Request,
  res: Response
): Promise<Response<Lead>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let lead: Lead = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_LEAD, [
      req.params.leadId,
    ]);

    const leadModel = {
      source_id: lead.source_id,
      status_id: lead.status_id,
      user_id: lead.user_id,
      name: lead.name,
      address: lead.address,
      city: lead.city,
      country: lead.country,
      zipcode: lead.zipcode,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      lead_value: lead.lead_value,
      description: lead.description,
      contact_date: lead.contact_date,
      is_active: lead.is_active || false,

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateLead: ResultSet = await pool.query(
        generateUpdateQuery(leadModel, "leads", "id"),
        [...Object.values(leadModel), req.params.leadId]
      );

      await auditLogger.logAction(
        "leads",
        req.params.leadId,
        "update",
        result[0],
        leadModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Lead Updated", {
          ...lead,
          id: req.params.leadId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Lead Not Found")
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

export const deleteLead = async (
  req: Request,
  res: Response
): Promise<Response<Lead>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_LEAD, [
      req.params.leadId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateLead: ResultSet = await pool.query(QUERY.DELETE_LEAD, [
        [req.params.leadId],
      ]);
      await auditLogger.logAction(
        "leads",
        req.params.leadId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Lead Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Lead Not Found")
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
