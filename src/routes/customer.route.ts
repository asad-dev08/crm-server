import { Router } from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  getDataWithPagination,
  updateCustomer,
} from "../controller/customer.controller";

const customerRoutes = Router();
customerRoutes.route("/").get(getCustomers).post(createCustomer);
customerRoutes.route("/pagination").post(getDataWithPagination);

customerRoutes
  .route("/:customerId")
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default customerRoutes;
