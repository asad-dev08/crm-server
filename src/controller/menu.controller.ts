import { Request, Response } from "express";
import { Menu } from "../interface/menu";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/menu.query";
import { Code } from "../enum/code.enum";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/status.enum";
import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";

import bcrypt from "bcryptjs";
import { generateInsertQuery } from "../query-maker/insert-query-maker";
import { generateUpdateQuery } from "../query-maker/update-query-maker";
const { v4: uuidv4 } = require("uuid");

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];

export const getMenus = async (
  req: Request,
  res: Response
): Promise<Response<Menu[]>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_MENUS);

    return res
      .status(Code.OK)
      .send(new HttpResponse(Code.OK, Status.OK, "Menus retrived", result[0]));
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

export const getMenu = async (
  req: Request,
  res: Response
): Promise<Response<Menu>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_MENU, [
      req.params.menuId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const menu = (result[0] as RowDataPacket[])[0];
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Menu Rtrived", menu));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Menu Not Found")
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

export const createMenu = async (
  req: Request,
  res: Response
): Promise<Response<Menu>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let menu: Menu = { ...req.body };
  try {
    const pool = await connection();
    const loggedMenu = (req as any).user;
    const menuModel = {
      id: uuidv4(),
    };

    const result: ResultSet = await pool.query(
      generateInsertQuery(menuModel, "menus"),
      [...Object.values(menuModel)]
    );
    menu = { id: (result[0] as ResultSetHeader).insertId, ...req.body };

    return res
      .status(Code.CREATED)
      .send(
        new HttpResponse(Code.CREATED, Status.CREATED, "Menu Created", menu)
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

export const updateMenu = async (
  req: Request,
  res: Response
): Promise<Response<Menu>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let menu: Menu = { ...req.body };
  try {
    const loggedMenu = (req as any).user;
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_MENU, [
      req.params.menuId,
    ]);

    const menuModel = {};

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateMenu: ResultSet = await pool.query(
        generateUpdateQuery(menuModel, "menus", "id"),
        [...Object.values(menuModel), req.params.menuId]
      );
      return res.status(Code.OK).send(
        new HttpResponse(Code.OK, Status.OK, "Menu Updated", {
          ...menu,
          id: req.params.menuId,
        })
      );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Menu Not Found")
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

export const deleteMenu = async (
  req: Request,
  res: Response
): Promise<Response<Menu>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  try {
    const pool = await connection();
    const result: ResultSet = await pool.query(QUERY.SELECT_MENU, [
      req.params.menuId,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const updateMenu: ResultSet = await pool.query(QUERY.DELETE_MENU, [
        [req.params.menuId],
      ]);
      return res
        .status(Code.OK)
        .send(new HttpResponse(Code.OK, Status.OK, "Menu Deleted!"));
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "Menu Not Found")
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
