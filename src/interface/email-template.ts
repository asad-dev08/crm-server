import { Audit } from "./audit";

export interface EmailTemplate extends Audit {
  id: String;
  template_name: String;
  email_event: String;
  email_subject: String;
  email_body: String;
  email_to: String;
  email_cc: String;
  is_active: Boolean;
}

export interface EmailEvent extends Audit {
  id: String;
  event_name: String;
}
