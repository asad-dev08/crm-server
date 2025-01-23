export interface Audit {
  created_at: Date;
  created_by: String;
  created_ip: String;
  updated_at: Date | null;
  updated_by: String | null;
  updated_ip: string | null;
  company_id: String;
}
