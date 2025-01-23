import { Audit } from "./audit";

export interface EventCalendar extends Audit {
  id: String;
  title: String;
  description: String;
  start_date: Date;
  end_date: Date;
  color: String;
}
