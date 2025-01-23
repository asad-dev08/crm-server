export const QUERY = {
  SELECT_CUSTOMER_TYPES:
    "SELECT * FROM customer_type order by  created_at desc",
  SELECT_CUSTOMER_TYPE: `SELECT * FROM customer_type WHERE id=?`,

  DELETE_CUSTOMER_TYPE: "DELETE FROM customer_type WHERE id=?",

  GET_TOTAL_COUNT_SOURCE: "SELECT COUNT(*) AS total FROM customer_type",
  SELECT_WITH_PAGINATION_SOURCE:
    "SELECT * FROM customer_type LIMIT ? OFFSET ? ",
};
