import { Audit } from "./audit";

export interface User {
  id: String;
  full_name: String;
  username: String;
  email: String;
  password: String;
  address: String;
  phone: String;
  is_active: boolean;
  is_admin: boolean;
  isPasswordReset: Boolean;
  user_type: number;
  company_id: String;
}

export interface UserGroup extends Audit {
  id: String;
  user_id: String;
  group_id: String;
  group_name: String;
}
