export const QUERY = {
  SELECT_SECURITY_RULES: "SELECT * FROM security_rule ",
  SELECT_SECURITY_RULE: `SELECT * FROM security_rule WHERE id=?`,

  DELETE_SECURITY_RULE: "DELETE FROM security_rule WHERE id=?",

  SELECT_SECURITY_RULE_MENU_PERMISSIONS:
    "SELECT * FROM rule_wise_menu_permission where rule_id=?",
  SELECT_SECURITY_RULE_MENU_PERMISSION: `SELECT * FROM rule_wise_menu_permission WHERE id=? and rule_id=?`,

  DELETE_SECURITY_RULE_MENU_PERMISSION:
    "DELETE FROM rule_wise_menu_permission WHERE id=?",
};
