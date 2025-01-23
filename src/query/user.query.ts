export const QUERY = {
  SELECT_USERS: "SELECT * FROM users ",
  SELECT_USER: `SELECT id,
  full_name,
  username,
  email,
  '' as password,
  address,
  phone,
  is_active,
  is_admin,
  isPasswordReset,
  user_type,
  created_at,
  created_by,
  created_ip,
  updated_at,
  updated_by,
  company_id FROM users WHERE id=?`,

  UPDATE_USER:
    "UPDATE user SET name=?, password=?, role=?,company_id=? WHERE id=?",
  DELETE_USER: "DELETE FROM users WHERE id=?",
};
