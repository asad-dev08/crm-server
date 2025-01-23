import { Audit } from "./audit";

export interface TaxRate extends Audit {
  id: String;
  name: String;
  rate: Number;
  description: String;
  is_active: Boolean;
}
