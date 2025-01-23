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
import { Taskboard, Taskboardcolumn } from "../interface/task-board";
const { v4: uuidv4 } = require("uuid");

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];

export const getDataWithPagination = async (
  req: Request,
  res: Response
): Promise<Response<Taskboard>> => {
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
      "SELECT * FROM task_boards LIMIT ? OFFSET ? ",
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

export const getTaskboards = async (
  req: Request,
  res: Response
): Promise<Response<Taskboard[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_TASK_BOARDS);

    let boardList =
      (result[0] as Array<ResultSet>).length > 0
        ? (result[0] as Taskboard[])
        : [];

    for (const board of boardList) {
      const columnRes = await pool.query(QUERY.SELECT_TASK_BOARD_COLUMNS, [
        board.id,
      ]);
      board.columns = columnRes[0] as Taskboardcolumn[];
    }

    return res
      .status(Code.OK)
      .send(
        new HttpResponse(Code.OK, Status.OK, "Taskboards retrived", boardList)
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

export const getTaskboard = async (
  req: Request,
  res: Response
): Promise<Response<Taskboard>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_TASK_BOARD, [
      req.params.boardId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const board = (result[0] as RowDataPacket[])[0] as Taskboard;

      const columnRes = await pool.query(QUERY.SELECT_TASK_BOARD_COLUMNS, [
        board.id,
      ]);
      board.columns = columnRes[0] as Taskboardcolumn[];

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Taskboard Rtrived", {
          ...board,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Taskboard Not Found"
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

export const createTaskboard = async (
  req: Request,
  res: Response
): Promise<Response<Taskboard>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let board: Taskboard = { ...req.body };
  let columns = req.body.columns || [];

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const loggedUser = (req as any).user;
    const boardId = uuidv4();
    const boardModel = {
      id: boardId,
      title: board.title,
      description: board.description,
      is_active: board.is_active || false,

      created_at: new Date(),
      created_by: loggedUser.id,
      created_ip: req.ip,
      updated_at: null,
      updated_by: null,
      updated_ip: null,
      company_id: loggedUser.company_id,
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(boardModel, "task_boards"),
      [...Object.values(boardModel)]
    );
    for (const col of columns) {
      const id = uuidv4();
      const model = {
        id: id,
        task_board_id: boardId,
        column_name: col.column_name,
        sequence_no: col.sequence_no,

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
          generateInsertQuery(model, "task_board_columns"),
          Object.values(model)
        );
        await auditLogger.logAction(
          "task_board_columns",
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
      "task_boards",
      boardId,
      "insert",
      {},
      boardModel
    );

    await conn.commit();
    conn.release();

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(
          Code.CREATED,
          Status.CREATED,
          "Taskboard Created",
          board
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

export const updateTaskboard = async (
  req: Request,
  res: Response
): Promise<Response<Taskboard>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let board: Taskboard = { ...req.body };
  let columns = req.body.columns || [];

  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const loggedUser = (req as any).user;
    const result: ResultSet = await pool.query(QUERY.SELECT_TASK_BOARD, [
      req.params.boardId,
    ]);

    const boardModel = {
      title: board.title,
      description: board.description,
      is_active: board.is_active,
    };

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateTaskboard: ResultSet = await pool.query(
        generateUpdateQuery(boardModel, "task_boards", "id"),
        [...Object.values(boardModel), req.params.boardId]
      );

      // update task board column
      const existingColumnsQueryResult: ResultSet = await pool.query(
        "SELECT * FROM task_board_columns where task_board_id=?",
        [req.params.boardId]
      );
      const existingGroupRuleList =
        (existingColumnsQueryResult[0] as Taskboardcolumn[]) || [];
      const existingColumns = existingGroupRuleList.map((row: any) => row.id);

      // Compare existingColumns with column_ids received from frontend
      const columnIdsFromFrontend = columns.map((col: any) => col.id);

      // Identify the column_ids that are present in the database but not in the frontend list
      const columnIdsToDelete = existingColumns.filter(
        (id: string) => !columnIdsFromFrontend.includes(id)
      );

      // Delete the corresponding records from the database
      for (const columnIdToDelete of columnIdsToDelete) {
        const groupRes: ResultSet = await pool.query(
          "select * from task_board_columns where id=?",
          [columnIdToDelete]
        );
        // Perform deletion query for columnIdToDelete
        await pool.query("DELETE FROM task_board_columns where id=?", [
          columnIdToDelete,
        ]);
        await auditLogger.logAction(
          "task_board_columns",
          columnIdToDelete,
          "delete",
          (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
          {}
        );
      }
      // end

      for (const col of columns) {
        const groupRes: ResultSet = await pool.query(
          "select * from task_board_columns where id=?",
          [col.id]
        );
        const model = {
          task_board_id: req.params.boardId,
          column_name: col.column_name,
          sequence_no: col.sequence_no,

          updated_by: loggedUser.id,
          updated_at: new Date(),
          updated_ip: req.ip,
          company_id: loggedUser.company_id,
        };

        if (col.id) {
          const updateSecurityGroup: ResultSet = await pool.query(
            generateUpdateQuery(model, "task_board_columns", "id"),
            [...Object.values(model), col.id]
          );

          await auditLogger.logAction(
            "task_board_columns",
            col.id,
            "update",
            (groupRes[0] as Array<ResultSet>).length > 0 ? groupRes[0] : [],
            model
          );
        } else {
          const id = uuidv4();
          const model = {
            id: id,
            task_board_id: req.params.boardId,
            column_name: col.column_name,
            sequence_no: col.sequence_no,

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
              generateInsertQuery(model, "task_board_columns"),
              Object.values(model)
            );
            await auditLogger.logAction(
              "task_board_columns",
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
        "task_boards",
        req.params.boardId,
        "update",
        result[0],
        boardModel
      );

      await conn.commit();
      conn.release();

      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Taskboard Updated", {
          ...board,
          id: req.params.boardId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Taskboard Not Found"
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

export const deleteTaskboard = async (
  req: Request,
  res: Response
): Promise<Response<Taskboard>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const auditLogger = new AuditLogger(pool);
    const result: ResultSet = await pool.query(QUERY.SELECT_TASK_BOARD, [
      req.params.boardId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const deleteTaskboard: ResultSet = await pool.query(
        QUERY.DELETE_TASK_BOARD,
        [[req.params.boardId]]
      );

      const deleteTaskboardcolumns: ResultSet = await pool.query(
        QUERY.DELETE_TASK_BOARD_COLUMNS,
        [[req.params.boardId]]
      );
      const deleteTaskboardtasks: ResultSet = await pool.query(
        QUERY.DELETE_TASK_BOARD_TASKS,
        [[req.params.boardId]]
      );
      await auditLogger.logAction(
        "task_boards",
        req.params.boardId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      await auditLogger.logAction(
        "tasks",
        req.params.boardId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      await auditLogger.logAction(
        "task_board_columns",
        req.params.boardId,
        "delete",
        (result[0] as Array<ResultSet>).length > 0 ? result[0] : [],
        {}
      );
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Taskboard Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(
            Code.NOT_FOUND,
            Status.NOT_FOUND,
            "Taskboard Not Found"
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
