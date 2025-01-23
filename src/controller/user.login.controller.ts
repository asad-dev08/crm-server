import { Request, Response } from "express";
import { User } from "../interface/user";
import { connection } from "../config/mysql.config";
import { QUERY } from "../query/user.query";
import { Code } from "../enum/code.enum";
import { HttpResponse } from "../domain/response";
import { Status } from "../enum/status.enum";
import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";
import { LOGIN_QUERY } from "../query/user.login.query";
import bcrypt from "bcryptjs";
import jwt, { decode } from "jsonwebtoken";

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];

export type TokenType = {
  id: string;
  username: string;
  email: string;
  phone: string;
  company_id: string;
  iat: number;
  exp: number;
};
export const verifyLogin = async (
  req: Request,
  res: Response
): Promise<Response<User>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );
  let user: User = { ...req.body };

  try {
    const pool = await connection();

    const result: ResultSet = await pool.query(LOGIN_QUERY.GET_USER, [
      user.username,
    ]);

    if ((result[0] as Array<ResultSet>).length > 0) {
      const userRow = (result[0] as RowDataPacket[])[0] as User;

      const isMatched = await bcrypt.compare(
        user.password.trim(),
        String((userRow as User).password)
      );
      if (!isMatched) {
        return res.status(400).send("username or Password is wrong");
      }

      // Create and assign token
      const token = jwt.sign(
        {
          id: userRow.id,
          username: userRow.username,
          email: userRow.email,
          phone: userRow.phone,
          company_id: userRow.company_id,
        },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: "1d" }
      );
      // const refreshToken = jwt.sign(
      //   {
      //     id: userRow.id,
      //     company_id: userRow.company_id,
      //   },
      //   process.env.JWT_REFRESH_TOKEN_KEY as string,
      //   { expiresIn: "1d" }
      // );

      // res.cookie("accessToken", token, { maxAge: 3600000 });
      // res.cookie("accessToken", refreshToken, {
      //   maxAge: 86400000,
      //   httpOnly: true,
      //   secure: true,
      //   sameSite: "strict",
      // });

      const upUser = {
        id: userRow.id,
        username: userRow.username,
        email: userRow.email,
        phone: userRow.phone,
        company_id: userRow.company_id,
      };

      const resultMenu: ResultSet = await pool.query(
        userRow.is_admin
          ? LOGIN_QUERY.GET_ALL_MENU_FOR_ADMIN
          : LOGIN_QUERY.GET_PERMITTED_MENU_FROM_RULE,
        [userRow.id]
      );
      const menus =
        (resultMenu[0] as Array<ResultSet>).length > 0 ? resultMenu[0] : [];

      return res
        .status(Code.OK)
        .header("auth-token")
        .send(
          new HttpResponse(Code.OK, Status.OK, "User verified", {
            user: upUser,
            token: token,
            // refreshToken: refreshToken,
            menus,
          })
        );
    } else {
      return res
        .status(Code.NOT_FOUND)
        .send(
          new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, "User Not Found")
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

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<Response<User>> => {
  console.info(
    `[${new Date().toLocaleString()}] Incoming ${req.method}${
      req.originalUrl
    } Request from ${(req.rawHeaders[0], req.rawHeaders[1])}`
  );

  try {
    const pool = await connection();
    const authorizationHeader = req.header("Authorization");

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid authorization header" });
    }
    const token = authorizationHeader.replace("Bearer ", "");

    if (!token) {
      return res
        .status(Code.UNAUTHORIZED)
        .send(
          new HttpResponse(
            Code.UNAUTHORIZED,
            Status.UNAUTHORIZED,
            "Access token not found"
          )
        );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY as string
    ) as TokenType;

    if (!decoded) {
      return res
        .status(Code.UNAUTHORIZED)
        .send(
          new HttpResponse(
            Code.UNAUTHORIZED,
            Status.UNAUTHORIZED,
            "Invalid access token"
          )
        );
    }

    // Here you can make a query to your database to get the latest user data based on the user id from the decoded token
    const result: ResultSet = await pool.query(LOGIN_QUERY.GET_USER_BY_ID, [
      decoded.id,
    ]);
    const user = ((result[0] as RowDataPacket[])[0] as User) || null;
    const resultMenu: ResultSet = await pool.query(
      user.is_admin
        ? LOGIN_QUERY.GET_ALL_MENU_FOR_ADMIN
        : LOGIN_QUERY.GET_PERMITTED_MENU_FROM_RULE,
      [decoded.id]
    );
    const menus =
      (resultMenu[0] as Array<ResultSet>).length > 0 ? resultMenu[0] : [];

    return res.status(Code.OK).send(
      new HttpResponse(Code.OK, Status.OK, "Access token verified", {
        user,
        menus,
        token,
      })
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
