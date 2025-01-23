import { Audit } from "./audit";

export interface SecurityRule extends Audit {
  id: String;
  name: String;
  description: String;
  SecurityRuleWiseMenuPermissions: SecurityRuleWiseMenuPermission[];
}

export interface SecurityRuleWiseMenuPermission extends Audit {
  id: String;
  rule_id: String;
  menu_id: number;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_report: boolean;
}
