export const QUERY = {
  SELECT_EMAIL_TEMPLATES: "SELECT * FROM email_template ",
  SELECT_EMAIL_TEMPLATE: `SELECT * FROM email_template WHERE id=?`,

  DELETE_EMAIL_TEMPLATE: "DELETE FROM email_template WHERE id=?",

  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM email_template",
  SELECT_WITH_PAGINATION: "SELECT * FROM email_template LIMIT ? OFFSET ? ",
};
