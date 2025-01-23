export const QUERY = {
  //for admin get
  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM security_group",
  SELECT_WITH_PAGINATION:
    "SELECT * FROM security_group ORDER BY created_at DESC LIMIT ? OFFSET ? ",
};
