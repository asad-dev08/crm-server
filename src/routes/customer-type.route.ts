import { Router } from "express";
import {
  createCustomerType,
  deleteCustomerType,
  getCustomerType,
  getCustomerTypes,
  getDataWithPagination,
  updateCustomerType,
} from "../controller/customer-type.controller";

const customerTypeRoutes = Router();
customerTypeRoutes.route("/").get(getCustomerTypes).post(createCustomerType);
customerTypeRoutes.route("/pagination").post(getDataWithPagination);

customerTypeRoutes
  .route("/:typeId")
  .get(getCustomerType)
  .put(updateCustomerType)
  .delete(deleteCustomerType);

export default customerTypeRoutes;
