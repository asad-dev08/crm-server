import moment from "moment";
import { Pool } from "mysql2/promise";

class AuditLogger {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async logAction(
    tableName: string,
    recordId: string,
    action: string,
    previousData: any,
    newData: any
  ) {
    const query = `INSERT INTO audit_logs (table_name, record_id, action, previous_data, new_data, timestamp) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [
      tableName,
      recordId,
      action,
      JSON.stringify(previousData),
      JSON.stringify(newData),
      moment(new Date()).format("YYYY-MM-DD HH:mm:ss A"),
    ];

    try {
      await this.pool.query(query, values);
    } catch (err) {
      console.error("Error logging to audit_logs:", err);
    }
  }
}

export default AuditLogger;
