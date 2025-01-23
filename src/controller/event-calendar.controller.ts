import { Request, Response } from "express";
import { EventCalendar } from "../interface/event-calendar";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/event-calendar-query";
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
): Promise<Response<EventCalendar>> => {
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
      "SELECT * FROM event_calendar LIMIT ? OFFSET ? ",
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

export const getEventCalendars = async (
  req: Request,
  res: Response
): Promise<Response<EventCalendar[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_EVENT_CALENDARS);

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(
          Code.OK,
          Status.OK,
          "EventCalendars retrived",
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

export const getEventCalendar = async (
  req: Request,
  res: Response
): Promise<Response<EventCalendar>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_EVENT_CALENDAR, [
      req.params.eventId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const event = (result[0] as RowDataPacket[])[0];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "EventCalendar Rtrived", {
          ...event,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "EventCalendar Not Found"
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

export const createEventCalendar = async (
  req: Request,
  res: Response
): Promise<Response<EventCalendar>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let event: EventCalendar = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const eventId = uuidv4();
    const eventModel = {
      id: eventId,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      color: event.color,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(eventModel, "event_calendar"),
      [...Object.values(eventModel)]
    );

    await auditLogger.logAction(
      "event_calendar",
      eventId,
      "insert",
      {},
      eventModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "EventCalendar Created",
          event
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

export const updateEventCalendar = async (
  req: Request,
  res: Response
): Promise<Response<EventCalendar>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let event: EventCalendar = { ...req.body };

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_EVENT_CALENDAR, [
      req.params.eventId,
    ]);

    const eventModel = {
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      color: event.color,

      updated_by: loggedUser.id,
      updated_at: new Date(),
      updated_ip: req.ip,
      company_id: loggedUser.company_id,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateEventCalendar: ResultSet = await pool.query(
        generateUpdateQuery(eventModel, "event_calendar", "id"),
        [...Object.values(eventModel), req.params.eventId]
      );

      await auditLogger.logAction(
        "event_calendar",
        req.params.eventId,
        "update",
        result[0],
        eventModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "EventCalendar Updated", {
          ...event,
          id: req.params.eventId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "EventCalendar Not Found"
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

export const deleteEventCalendar = async (
  req: Request,
  res: Response
): Promise<Response<EventCalendar>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_EVENT_CALENDAR, [
      req.params.eventId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateEventCalendar: ResultSet = await pool.query(
        QUERY.DELETE_EVENT_CALENDAR,
        [[req.params.eventId]]
      );
      await auditLogger.logAction(
        "event_calendar",
        req.params.eventId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "EventCalendar Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "EventCalendar Not Found"
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
