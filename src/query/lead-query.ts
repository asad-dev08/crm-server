export const QUERY = {
  SELECT_LEAD_SOURCES: "SELECT * FROM lead_source order by  created_at desc",
  SELECT_LEAD_SOURCE: `SELECT * FROM lead_source WHERE id=?`,

  DELETE_LEAD_SOURCE: "DELETE FROM lead_source WHERE id=?",

  GET_TOTAL_COUNT_SOURCE: "SELECT COUNT(*) AS total FROM lead_source",
  SELECT_WITH_PAGINATION_SOURCE: "SELECT * FROM lead_source LIMIT ? OFFSET ? ",

  SELECT_LEAD_STATUSS: "SELECT * FROM lead_status order by  created_at desc",
  SELECT_LEAD_STATUS: `SELECT * FROM lead_status WHERE id=?`,

  DELETE_LEAD_STATUS: "DELETE FROM lead_status WHERE id=?",

  GET_TOTAL_COUNT_STATUS: "SELECT COUNT(*) AS total FROM lead_status",
  SELECT_WITH_PAGINATION_STATUS: "SELECT * FROM lead_status LIMIT ? OFFSET ? ",

  SELECT_LEADS: "SELECT * FROM leads order by created_at desc",
  SELECT_LEAD: `SELECT * FROM leads WHERE id=?`,

  DELETE_LEAD: "DELETE FROM leads WHERE id=?",

  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM leads",
  SELECT_WITH_PAGINATION: "SELECT * FROM leads LIMIT ? OFFSET ? ",
};
