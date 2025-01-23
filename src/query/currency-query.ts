export const QUERY = {
  SELECT_CURRENCYS: "SELECT * FROM currency order by  created_at desc",
  SELECT_CURRENCY: `SELECT * FROM currency WHERE id=?`,

  DELETE_CURRENCY: "DELETE FROM currency WHERE id=?",

  GET_TOTAL_COUNT_SOURCE: "SELECT COUNT(*) AS total FROM currency",
  SELECT_WITH_PAGINATION_SOURCE: "SELECT * FROM currency LIMIT ? OFFSET ? ",
};
