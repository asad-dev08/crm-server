import { Audit } from "./audit";

export interface Task extends Audit {
  id: String;
  board_id: String;
  title: String;
  description: String;
  is_active: Boolean;

  start_date: Date;
  priority: String;
  target_date: Date;
  column_id: String;
  sequence_no: Number;

  users: Taskuser[];
  subtasks: [];
}
export interface Taskuser extends Audit {
  id: String;
  task_id: String;
  user_id: String;
}

export interface Subtask extends Audit {
  id: String;
  task_id: String;
  title: String;
  description: String;
  is_active: Boolean;

  target_date: Date;
  user_id: String;
  sequence_no: Number;
}
