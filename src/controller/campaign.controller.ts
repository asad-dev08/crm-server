import { Request, Response } from "express";
import { Campaign } from "../interface/campaign";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/campaign-query";
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
): Promise<Response<Campaign>> => {
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
      `SELECT c.* FROM 
      campaign c 
      order by c.created_at desc LIMIT ? OFFSET ? `,
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

export const getCampaigns = async (
  req: Request,
  res: Response
): Promise<Response<Campaign[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_CAMPAIGNS);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(Code.OK, Status.OK, "Campaigns retrived", result[0])
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

export const getCampaign = async (
  req: Request,
  res: Response
): Promise<Response<Campaign>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_CAMPAIGN, [
      req.params.campaignId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const lead = (result[0] as RowDataPacket[])[0];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Campaign Rtrived", {
          ...lead,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Campaign Not Found"
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

export const createCampaign = async (
  req: Request,
  res: Response
): Promise<Response<Campaign>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let lead: Campaign = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const campaignId = uuidv4();
    const leadModel = {
      id: campaignId,
      name: lead.name,
      type: lead.type,
      value: lead.value,
      currency: lead.currency,
      from_date: lead.from_date,
      to_date: lead.to_date,
      status: lead.status,
      target_audience: lead.target_audience,
      description: lead.description,
      form_id: lead.form_id,
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
      generateInsertQuery(leadModel, "campaign"),
      [...Object.values(leadModel)]
    );

    await auditLogger.logAction(
      "campaign",
      campaignId,
      "insert",
      {},
      leadModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(Code.CREATED, Status.CREATED, "Campaign Created", lead)
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

export const updateCampaign = async (
  req: Request,
  res: Response
): Promise<Response<Campaign>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let lead: Campaign = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_CAMPAIGN, [
      req.params.campaignId,
    ]);

    const leadModel = {
      name: lead.name,
      type: lead.type,
      value: lead.value,
      currency: lead.currency,
      from_date: lead.from_date,
      to_date: lead.to_date,
      status: lead.status,
      target_audience: lead.target_audience,
      description: lead.description,
      form_id: lead.form_id,
      is_active: lead.is_active || false,

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateCampaign: ResultSet = await pool.query(
        generateUpdateQuery(leadModel, "campaign", "id"),
        [...Object.values(leadModel), req.params.campaignId]
      );

      await auditLogger.logAction(
        "campaign",
        req.params.campaignId,
        "update",
        result[0],
        leadModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Campaign Updated", {
          ...lead,
          id: req.params.campaignId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Campaign Not Found"
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

export const deleteCampaign = async (
  req: Request,
  res: Response
): Promise<Response<Campaign>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_CAMPAIGN, [
      req.params.campaignId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateCampaign: ResultSet = await pool.query(
        QUERY.DELETE_CAMPAIGN,
        [[req.params.campaignId]]
      );
      await auditLogger.logAction(
        "campaign",
        req.params.campaignId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Campaign Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Campaign Not Found"
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
