import { Router } from "express";
import {
  createEventCalendar,
  deleteEventCalendar,
  getEventCalendar,
  getEventCalendars,
  getDataWithPagination,
  updateEventCalendar,
} from "../controller/event-calendar.controller";

const eventCalendarRoutes = Router();
eventCalendarRoutes.route("/").get(getEventCalendars).post(createEventCalendar);
eventCalendarRoutes.route("/pagination").post(getDataWithPagination);

eventCalendarRoutes
  .route("/:eventId")
  .get(getEventCalendar)
  .put(updateEventCalendar)
  .delete(deleteEventCalendar);

export default eventCalendarRoutes;
