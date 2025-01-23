export const QUERY = {
  SELECT_TASK_BOARDS: "SELECT * FROM task_boards ",
  SELECT_TASK_BOARD: `SELECT * FROM task_boards WHERE id=?`,
  SELECT_TASK_BOARD_COLUMNS: `SELECT * FROM task_board_columns WHERE task_board_id=? order by sequence_no asc`,
  SELECT_TASK_BOARD_COLUMN: `SELECT * FROM task_board_columns WHERE id=? and task_board_id=?  order by sequence_no asc`,

  DELETE_TASK_BOARD: "DELETE FROM task_boards WHERE id=?",
  DELETE_TASK_BOARD_COLUMN:
    "DELETE FROM task_board_columns WHERE id=? and task_board_id=?",
  DELETE_TASK_BOARD_COLUMNS:
    "DELETE FROM task_board_columns WHERE  task_board_id=?",

  DELETE_TASK_BOARD_TASKS: "DELETE FROM tasks WHERE  board_id=?",

  SELECT_TASKS: `SELECT *,u.username FROM tasks t
                left join users u on t.user_id=t.id order by t.sequence_no desc`,

  SELECT_TASKS_BY_BOARD_ID: `SELECT t.*, tbc.column_name as column_name FROM tasks t 
                left join task_board_columns tbc on t.column_id = tbc.id where t.board_id=? order by t.sequence_no desc`,
  GET_MAX_BY_BOARD_ID: `SELECT count(t.id) as total FROM tasks t where t.board_id=? `,

  SELECT_TASK: `SELECT * FROM tasks  WHERE id=?`,
  SELECT_TASK_WITH_BOARD: `SELECT * FROM tasks  WHERE id=? and board_id=?`,

  DELETE_TASK: "DELETE FROM tasks WHERE id=? and board_id=?",
  DELETE_TASK_USERS: "DELETE FROM task_users WHERE task_id=?",

  SELECT_TASK_USERS: `SELECT tu.*, u.full_name as username FROM task_users tu
                    left join users u on tu.user_id = u.id WHERE task_id=? `,

  SELECT_SUB_TASKS: `SELECT * FROM sub_tasks`,
  SELECT_SUB_TASK: `SELECT * FROM sub_tasks  WHERE id=? `,
  SELECT_SUB_TASK_WITH_TASK: `SELECT * FROM sub_tasks  WHERE id=? and and task_id=?  order by sequence_no desc`,

  DELETE_SUB_TASK: "DELETE FROM sub_tasks WHERE id=? and task_id=?",

  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM task_boards",
  SELECT_WITH_PAGINATION: "SELECT * FROM task_boards LIMIT ? OFFSET ? ",
};
