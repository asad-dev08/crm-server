import { Request, Response } from "express";
import { PaymentMedium } from "../interface/payment-medium";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/payment-medium.query";
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
): Promise<Response<PaymentMedium>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let { tableName = "", page = 0, pageSize = 0 } = { ...req.body };

  try {
    const pool = await connection();

    const countResult: ResultSet = await pool.query(
      QUERY.GET_TOTAL_COUNT_SOURCE,
      [tableName]
    );

    const result: ResultSet = await pool.query(
      `SELECT *  FROM payment_medium order by created_at desc LIMIT ? OFFSET ? `,
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

export const getPaymentMediums = async (
  req: Request,
  res: Response
): Promise<Response<PaymentMedium[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_PAYMENT_MEDIUMS);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(
          Code.OK,
          Status.OK,
          "Payment Medium retrived",
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

export const getPaymentMedium = async (
  req: Request,
  res: Response
): Promise<Response<PaymentMedium>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_PAYMENT_MEDIUM, [
      req.params.mediumId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const payment_medium = (result[0] as RowDataPacket[])[0];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Payment Medium Rtrived", {
          ...payment_medium,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Payment Medium Not Found"
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

export const createPaymentMedium = async (
  req: Request,
  res: Response
): Promise<Response<PaymentMedium>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let payment_medium: PaymentMedium = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const mediumId = uuidv4();
    const payment_mediumModel = {
      id: mediumId,

      name: payment_medium.name,
      description: payment_medium.description,
      is_active: payment_medium.is_active || false,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(payment_mediumModel, "payment_medium"),
      [...Object.values(payment_mediumModel)]
    );

    await auditLogger.logAction(
      "payment_medium",
      mediumId,
      "insert",
      {},
      payment_mediumModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "Payment Medium Created",
          payment_medium
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

export const updatePaymentMedium = async (
  req: Request,
  res: Response
): Promise<Response<PaymentMedium>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let payment_medium: PaymentMedium = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_PAYMENT_MEDIUM, [
      req.params.mediumId,
    ]);

    const payment_mediumModel = {
      name: payment_medium.name,
      description: payment_medium.description,
      is_active: payment_medium.is_active || false,

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updatePaymentMedium: ResultSet = await pool.query(
        generateUpdateQuery(payment_mediumModel, "payment_medium", "id"),
        [...Object.values(payment_mediumModel), req.params.mediumId]
      );

      await auditLogger.logAction(
        "payment_medium",
        req.params.mediumId,
        "update",
        result[0],
        payment_mediumModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Payment Medium Updated", {
          ...payment_medium,
          id: req.params.mediumId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Payment Medium Not Found"
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

export const deletePaymentMedium = async (
  req: Request,
  res: Response
): Promise<Response<PaymentMedium>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_PAYMENT_MEDIUM, [
      req.params.mediumId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updatePaymentMedium: ResultSet = await pool.query(
        QUERY.DELETE_PAYMENT_MEDIUM,
        [[req.params.mediumId]]
      );
      await auditLogger.logAction(
        "payment_medium",
        req.params.mediumId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Payment Medium Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Payment Medium Not Found"
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
