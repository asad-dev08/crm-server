export const LOGIN_QUERY = {
  GET_USER: "SELECT * FROM users WHERE username = ?",
  GET_USER_BY_ID: "SELECT * FROM users WHERE id = ?",
  GET_PERMITTED_MENU_FROM_RULE: `select distinct m.id ,m.title,m.url, m.icon,m.icon_library,m.parent_id,m.sequence_no,m.is_active, per.can_view, per.can_create, per.can_update, per.can_delete, per.can_report, per.rule_id,per.menu_id FROM security_rule_wise_menu_permission per
  inner join menus m on m.id=per.menu_id
  inner join security_group_rule sgr on sgr.rule_id=per.rule_id
  inner join user_group ug on ug.group_id = sgr.group_id
  WHERE ug.user_id=? and (per.can_view = 1 OR per.can_create = 1 OR per.can_update = 1 OR per.can_delete = 1 OR per.can_report = 1) 
  order by m.sequence_no`,

  GET_ALL_MENU_FOR_ADMIN: `select distinct m.id ,m.title,m.url, m.icon,m.icon_library,m.parent_id,m.sequence_no,m.is_active, 1 can_view, 1 can_create, 1 can_update, 1 can_delete,1 can_report, m.id menu_id from menus m order by m.sequence_no`,
};
