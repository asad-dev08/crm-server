import { Audit } from "./audit";

export interface Currency extends Audit {
  id: String;
  name: String;
  conversion_rate: Number;
  is_active: Boolean;
}
