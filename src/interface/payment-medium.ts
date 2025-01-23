import { Audit } from "./audit";

export interface PaymentMedium extends Audit {
  id: String;
  name: String;
  description: String;
  is_active: Boolean;
}
