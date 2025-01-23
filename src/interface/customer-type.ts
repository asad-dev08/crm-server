import { Audit } from "./audit";

export interface CustomerType extends Audit {
  id: String;
  name: String;
  is_active: Boolean;
}
