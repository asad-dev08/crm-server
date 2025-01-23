export const QUERY = {
  //for admin get
  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM users",
  SELECT_WITH_PAGINATION: "SELECT * FROM users LIMIT ? OFFSET ? ",
};
