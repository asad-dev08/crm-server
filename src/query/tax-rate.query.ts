export const QUERY = {
  SELECT_TAX_RATES: "SELECT * FROM tax_rate order by  created_at desc",
  SELECT_TAX_RATE: `SELECT * FROM tax_rate WHERE id=?`,

  DELETE_TAX_RATE: "DELETE FROM tax_rate WHERE id=?",

  GET_TOTAL_COUNT_SOURCE: "SELECT COUNT(*) AS total FROM tax_rate",
  SELECT_WITH_PAGINATION_SOURCE: "SELECT * FROM tax_rate LIMIT ? OFFSET ? ",
};
