interface Model {
  [key: string]: any;
}

export const generateUpdateQuery = (
  model: Model,
  tableName: string,
  conditionField: string
): string => {
  const fields = Object.keys(model).filter((key) => key !== conditionField);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const conditionValue = model[conditionField];

  const query = `UPDATE ${tableName} SET ${setClause} WHERE ${conditionField} = ?`;

  return query;
};
