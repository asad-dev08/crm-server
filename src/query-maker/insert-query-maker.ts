interface Model {
  [key: string]: any;
}

export const generateInsertQuery = (
  model: Model,
  tableName: string
): string => {
  //   const fields = Object.keys(model).filter((key) => model[key] !== null);
  const fields = Object.keys(model);
  const placeholders = fields.map(() => "?").join(", ");

  const query = `INSERT INTO ${tableName} (${fields.join(
    ", "
  )}) VALUES (${placeholders})`;

  return query;
};
