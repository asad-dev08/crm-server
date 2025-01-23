export const QUERY = {
  SELECT_CUSTOMER_BILLING_ADDRESSS:
    "SELECT * FROM customer_billing_address order by  created_at desc",
  SELECT_CUSTOMER_BILLING_ADDRESS: `SELECT * FROM customer_billing_address WHERE id=?`,
  SELECT_CUSTOMER_BILLING_ADDRESS_BY_CUSTOMER: `SELECT * FROM customer_billing_address WHERE customer_id=?`,

  DELETE_CUSTOMER_BILLING_ADDRESS:
    "DELETE FROM customer_billing_address WHERE id=?",

  GET_TOTAL_COUNT_SOURCE:
    "SELECT COUNT(*) AS total FROM customer_billing_address",
  SELECT_WITH_PAGINATION_SOURCE:
    "SELECT * FROM customer_billing_address LIMIT ? OFFSET ? ",

  SELECT_CUSTOMER_SHIPPING_ADDRESSS:
    "SELECT * FROM customer_shipping_address order by  created_at desc",
  SELECT_CUSTOMER_SHIPPING_ADDRESS: `SELECT * FROM customer_shipping_address WHERE id=?`,
  SELECT_CUSTOMER_SHIPPING_ADDRESS_BY_CUSTOMER: `SELECT * FROM customer_shipping_address WHERE customer_id=?`,

  DELETE_CUSTOMER_SHIPPING_ADDRESS:
    "DELETE FROM customer_shipping_address WHERE id=?",

  GET_TOTAL_COUNT_STATUS:
    "SELECT COUNT(*) AS total FROM customer_shipping_address",
  SELECT_WITH_PAGINATION_STATUS:
    "SELECT * FROM customer_shipping_address LIMIT ? OFFSET ? ",

  SELECT_CUSTOMERS: "SELECT * FROM customers order by created_at desc",
  SELECT_CUSTOMER: `SELECT * FROM customers WHERE id=?`,

  DELETE_CUSTOMER: "DELETE FROM customers WHERE id=?",

  GET_TOTAL_COUNT: "SELECT COUNT(*) AS total FROM customers",
  SELECT_WITH_PAGINATION: "SELECT * FROM customers LIMIT ? OFFSET ? ",
};
