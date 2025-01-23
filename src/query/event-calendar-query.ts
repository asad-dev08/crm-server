export const QUERY = {
  SELECT_EVENT_CALENDARS: "SELECT * FROM event_calendar ",
  SELECT_EVENT_CALENDAR: `SELECT * FROM event_calendar WHERE id=?`,

  DELETE_EVENT_CALENDAR: "DELETE FROM event_calendar WHERE id=?",

  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM event_calendar",
  SELECT_WITH_PAGINATION: "SELECT * FROM event_calendar LIMIT ? OFFSET ? ",
};
