import { Audit } from "./audit";

export interface CampaignForm extends Audit {
  id: String;
  campaign_id: String;
  name: String;
  formJSON: String;
  form_data: String;
  is_active: Boolean;
}

export interface CampaignStatus extends Audit {
  id: String;
  name: String;
  is_active: Boolean;
}

export interface CampaignAudience extends Audit {
  id: String;
  name: String;
  is_active: Boolean;
}
export interface CampaignType extends Audit {
  id: String;
  name: String;
  is_active: Boolean;
}

export interface Campaign extends Audit {
  id: String;
  name: String;
  type: String;
  value: Number;
  currency: String;
  from_date: Date;
  to_date: Date;

  status: String;
  target_audience: String;
  description: String;
  form_id: String;
  is_active: Boolean;
}
