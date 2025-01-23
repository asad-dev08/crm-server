import TransportStream from "winston-transport";
import mysql from "mysql2";

interface MySQLTransportOptions extends TransportStream.TransportStreamOptions {
  connection: mysql.ConnectionOptions;
  tableName?: string;
}

export class MySQLTransport extends TransportStream {
  private connection: mysql.Connection;
  private tableName: string;

  constructor(opts: MySQLTransportOptions) {
    super(opts);
    this.connection = mysql.createConnection(opts.connection);
    this.tableName = opts.tableName || "logs";
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { level, message, ...meta } = info;
    const log = {
      level,
      message,
      meta: JSON.stringify(meta), // Ensure meta is stored as JSON
      timestamp: new Date().toISOString(),
    };

    const query = `INSERT INTO ${this.tableName} (level, message, meta, timestamp) VALUES (?, ?, ?, ?)`;
    const values = [log.level, log.message, log.meta, log.timestamp];

    this.connection.query(query, values, (err) => {
      if (err) {
        console.error("Error logging to MySQL:", err);
      }
      callback();
    });
  }
}
