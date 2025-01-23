import { Request, Response } from "express";
import { Company } from "../interface/company";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/company-query";
import { Code } from "../enum/code.enum";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/status.enum";
import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";

import bcrypt from "bcryptjs";
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
): Promise<Response<Company>> => {
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
      "SELECT * FROM companies LIMIT ? OFFSET ? ",
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

export const getCompanys = async (
  req: Request,
  res: Response
): Promise<Response<Company[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_COMPANYS);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(Code.OK, Status.OK, "Companys retrived", result[0])
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

export const getCompany = async (
  req: Request,
  res: Response
): Promise<Response<Company>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_COMPANY, [
      req.params.companyId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const company = (result[0] as RowDataPacket[])[0];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Company Rtrived", {
          ...company,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Company Not Found"
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

export const createCompany = async (
  req: Request,
  res: Response
): Promise<Response<Company>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let company: Company = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const companyId = uuidv4();
    const companyModel = {
      id: companyId,
      company_name: company.company_name,
      company_short_name: company.company_short_name,
      company_code: company.company_code,
      registration_number: company.registration_number,
      tax_id: company.tax_id,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postal_code: company.postal_code,
      phone: company.phone,
      email: company.email,
      website: company.website,
      founded_date: company.founded_date,
      industry: company.industry,
      number_of_employees: company.number_of_employees,
      annual_revenue: company.annual_revenue,
      description: company.description,
      is_active: company.is_active || false,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(companyModel, "companies"),
      [...Object.values(companyModel)]
    );

    await auditLogger.logAction(
      "companies",
      companyId,
      "insert",
      {},
      companyModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "Company Created",
          company
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

export const updateCompany = async (
  req: Request,
  res: Response
): Promise<Response<Company>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let company: Company = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result: ResultSet = await pool.query(QUERY.SELECT_COMPANY, [
      req.params.companyId,
    ]);

    const companyModel = {
      company_name: company.company_name,
      company_short_name: company.company_short_name,
      company_code: company.company_code,
      registration_number: company.registration_number,
      tax_id: company.tax_id,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postal_code: company.postal_code,
      phone: company.phone,
      email: company.email,
      website: company.website,
      founded_date: company.founded_date,
      industry: company.industry,
      number_of_employees: company.number_of_employees,
      annual_revenue: company.annual_revenue,
      description: company.description,
      is_active: company.is_active,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateCompany: ResultSet = await pool.query(
        generateUpdateQuery(companyModel, "companies", "id"),
        [...Object.values(companyModel), req.params.companyId]
      );

      await auditLogger.logAction(
        "companies",
        req.params.companyId,
        "update",
        result[0],
        companyModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Company Updated", {
          ...company,
          id: req.params.companyId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Company Not Found"
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

export const deleteCompany = async (
  req: Request,
  res: Response
): Promise<Response<Company>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_COMPANY, [
      req.params.companyId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateCompany: ResultSet = await pool.query(QUERY.DELETE_COMPANY, [
        [req.params.companyId],
      ]);
      await auditLogger.logAction(
        "companies",
        req.params.companyId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Company Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Company Not Found"
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
