import { Audit } from "./audit";

export interface CustomerBillingAddress extends Audit {
  id: String;
  customer_id: String;
  address: String;
  city: String;
  zipcode: String;
  country: String;
}

export interface CustomerShippingAddress {
  id: String;
  customer_id: String;
  address: String;
  city: String;
  zipcode: String;
  country: String;
}

export interface Customer extends Audit {
  id: String;
  company_name: String;
  company_website: String;
  vat_number: String;
  currency: String;
  customer_type: String;
  city: String;
  country: String;
  zipcode: String;
  email: String;
  phone: String;
  address: String;
  is_active: Boolean;
}
