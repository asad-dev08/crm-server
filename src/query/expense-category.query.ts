export const QUERY = {
  SELECT_EXPENSE_CATEGORYS:
    "SELECT * FROM expense_category order by  created_at desc",
  SELECT_EXPENSE_CATEGORY: `SELECT * FROM expense_category WHERE id=?`,

  DELETE_EXPENSE_CATEGORY: "DELETE FROM expense_category WHERE id=?",

  GET_TOTAL_COUNT_SOURCE: "SELECT COUNT(*) AS total FROM expense_category",
  SELECT_WITH_PAGINATION_SOURCE:
    "SELECT * FROM expense_category LIMIT ? OFFSET ? ",
};
