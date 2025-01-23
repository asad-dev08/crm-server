import { Request, Response, NextFunction } from "express";
import { connection } from "../config/mysql.config";
import AuditLogger from "./audit-log";

import { FieldPacket, ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";

type ResultSet = [
  RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader,
  FieldPacket[]
];
const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const pool = await connection();
  const auditLogger = new AuditLogger(pool);

  if (["PUT", "POST", "DELETE"].includes(req.method)) {
    const tableName = req.baseUrl.split("/")[1]; // assuming the base URL indicates the table
    const recordId = req.params.id; // assuming the record ID is in the params
    const newData = req.body;

    if (recordId) {
      try {
        const result = await pool.query(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [recordId]
        );
        const rows = (result[0] as RowDataPacket[])[0] || null;
        const previousData = rows;

        // Log the action after the response is sent
        res.on("finish", async () => {
          await auditLogger.logAction(
            tableName,
            recordId,
            req.method.toLowerCase(),
            previousData,
            newData
          );
        });
      } catch (err) {
        console.error("Error fetching data for audit:", err);
      }
    }
  }

  next();
};

export default auditMiddleware;
