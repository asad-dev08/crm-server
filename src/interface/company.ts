export interface Company {
  id: String;
  company_name: String;
  company_short_name: String;
  company_code: String;
  registration_number: String;
  tax_id: String;
  address: String;
  city: String;
  state: String;
  country: String;
  postal_code: String;
  phone: String;
  email: String;
  website: String;
  founded_date: Date;
  industry: String;
  number_of_employees: Number;
  annual_revenue: Number;
  description: String;
  is_active: Boolean;

  created_at: Date;
  created_by: String;
  created_ip: String;
  updated_at: Date | null;
  updated_by: String | null;
  updated_ip: string | null;
}
