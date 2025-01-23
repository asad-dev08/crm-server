import { Audit } from "./audit";

export interface LeadSource extends Audit {
  id: String;
  name: String;
  is_active: Boolean;
}

export interface LeadStatus {
  id: String;
  name: String;
  is_active: Boolean;
}

export interface Lead extends Audit {
  id: String;
  source_id: String;
  status_id: String;
  user_id: String;
  name: String;
  address: String;
  city: String;
  country: String;
  zipcode: String;
  email: String;
  phone: String;
  website: String;
  lead_value: Number;
  description: String;
  contact_date: Date;

  is_active: Boolean;
}
