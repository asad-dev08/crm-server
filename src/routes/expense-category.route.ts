import { Router } from "express";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategory,
  getExpenseCategorys,
  getDataWithPagination,
  updateExpenseCategory,
} from "../controller/expense-category.controller";

const expenseCategoryRoutes = Router();
expenseCategoryRoutes
  .route("/")
  .get(getExpenseCategorys)
  .post(createExpenseCategory);
expenseCategoryRoutes.route("/pagination").post(getDataWithPagination);

expenseCategoryRoutes
  .route("/:expCatId")
  .get(getExpenseCategory)
  .put(updateExpenseCategory)
  .delete(deleteExpenseCategory);

export default expenseCategoryRoutes;
