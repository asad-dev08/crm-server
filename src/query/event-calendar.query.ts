export const QUERY = {
  SELECT_EVENTS: "SELECT * FROM event_calendar ",
  SELECT_EVENT: `SELECT * FROM event_calendar WHERE id=?`,

  DELETE_EVENT: "DELETE FROM event_calendar WHERE id=?",
};
