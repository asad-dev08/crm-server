export const QUERY = {
  SELECT_COMPANYS: "SELECT * FROM companies ",
  SELECT_COMPANY: `SELECT * FROM companies WHERE id=?`,

  DELETE_COMPANY: "DELETE FROM companies WHERE id=?",

  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM companies",
  SELECT_WITH_PAGINATION: "SELECT * FROM companies LIMIT ? OFFSET ? ",
};
