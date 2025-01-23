import { Audit } from "./audit";

export interface Taskboard extends Audit {
  id: String;
  title: String;
  description: String;
  is_active: Boolean;

  columns: Taskboardcolumn[];
}
export interface Taskboardcolumn extends Audit {
  id: String;
  task_board_id: String;
  column_name: String;
  sequence_no: Number;
}
