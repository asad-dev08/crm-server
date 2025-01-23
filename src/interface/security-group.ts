import { Audit } from "./audit";

export interface SecurityGroup extends Audit {
  id: String;
  name: String;
  description: String;
  SecurityGroupRules: SecurityGroupRule[];
}

export interface SecurityGroupRule extends Audit {
  id: String;
  group_id: String;
  rule_id: String;
  rule_name: String | null;
}
