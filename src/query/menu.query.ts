export const QUERY = {
  SELECT_MENUS:
    "SELECT m.* , 0 as can_view, 0 as can_create, 0 as can_update, 0 as can_delete, 0 as can_report FROM menus m",
  SELECT_MENU: `SELECT m.*, 0 as can_view, 0 as can_create, 0 as can_update, 0 as can_delete, 0 as can_report FROM menus m WHERE id=?`,

  UPDATE_MENU: "UPDATE menus SET title=? WHERE id=?",
  DELETE_MENU: "DELETE FROM menus WHERE id=?",
};
