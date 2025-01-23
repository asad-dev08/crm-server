import { Audit } from "./audit";

export interface ExpenseCategory extends Audit {
  id: String;
  name: String;
  description: String;
  is_active: Boolean;
}
