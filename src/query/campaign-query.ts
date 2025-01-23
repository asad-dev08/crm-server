export const QUERY = {
  SELECT_CAMPAIGN_AUDIENCES:
    "SELECT * FROM campaign_audience order by  created_at desc",
  SELECT_CAMPAIGN_AUDIENCE: `SELECT * FROM campaign_audience WHERE id=?`,

  DELETE_CAMPAIGN_AUDIENCE: "DELETE FROM campaign_audience WHERE id=?",

  GET_TOTAL_COUNT_CAMPAIGN_AUDIENCE:
    "SELECT COUNT(*) AS total FROM campaign_audience",
  SELECT_WITH_PAGINATION_CAMPAIGN_AUDIENCE:
    "SELECT * FROM campaign_audience LIMIT ? OFFSET ? ",

  SELECT_CAMPAIGN_FORMS:
    "SELECT * FROM campaign_form order by  created_at desc",
  SELECT_CAMPAIGN_FORM: `SELECT * FROM campaign_form WHERE id=?`,

  DELETE_CAMPAIGN_FORM: "DELETE FROM campaign_form WHERE id=?",

  GET_TOTAL_COUNT_FORM: "SELECT COUNT(*) AS total FROM campaign_form",
  SELECT_WITH_PAGINATION_CAMPAIGN_FORM:
    "SELECT * FROM campaign_form LIMIT ? OFFSET ? ",

  SELECT_CAMPAIGN_STATUSS:
    "SELECT * FROM campaign_status order by  created_at desc",
  SELECT_CAMPAIGN_STATUS: `SELECT * FROM campaign_status WHERE id=?`,

  DELETE_CAMPAIGN_STATUS: "DELETE FROM campaign_status WHERE id=?",

  GET_TOTAL_COUNT_STATUS: "SELECT COUNT(*) AS total FROM campaign_status",
  SELECT_WITH_PAGINATION_STATUS:
    "SELECT * FROM campaign_status LIMIT ? OFFSET ? ",

  SELECT_CAMPAIGN_TYPES:
    "SELECT * FROM campaign_type order by  created_at desc",
  SELECT_CAMPAIGN_TYPE: `SELECT * FROM campaign_type WHERE id=?`,

  DELETE_CAMPAIGN_TYPE: "DELETE FROM campaign_type WHERE id=?",

  GET_TOTAL_COUNT_TYPE: "SELECT COUNT(*) AS total FROM campaign_type",
  SELECT_WITH_PAGINATION_TYPE: "SELECT * FROM campaign_type LIMIT ? OFFSET ? ",

  SELECT_CAMPAIGNS: "SELECT * FROM campaign order by created_at desc",
  SELECT_CAMPAIGN: `SELECT * FROM campaign WHERE id=?`,

  DELETE_CAMPAIGN: "DELETE FROM campaign WHERE id=?",

  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM campaign",
  SELECT_WITH_PAGINATION: "SELECT * FROM campaign LIMIT ? OFFSET ? ",
};
