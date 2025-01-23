export const QUERY = {
  SELECT_PAYMENT_MEDIUMS:
    "SELECT * FROM payment_medium order by  created_at desc",
  SELECT_PAYMENT_MEDIUM: `SELECT * FROM payment_medium WHERE id=?`,

  DELETE_PAYMENT_MEDIUM: "DELETE FROM payment_medium WHERE id=?",

  GET_TOTAL_COUNT_SOURCE: "SELECT COUNT(*) AS total FROM payment_medium",
  SELECT_WITH_PAGINATION_SOURCE:
    "SELECT * FROM payment_medium LIMIT ? OFFSET ? ",
};
