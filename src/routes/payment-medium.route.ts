import { Router } from "express";
import {
  createPaymentMedium,
  deletePaymentMedium,
  getPaymentMedium,
  getPaymentMediums,
  getDataWithPagination,
  updatePaymentMedium,
} from "../controller/payment-medium.controller";

const mediumRoutes = Router();
mediumRoutes.route("/").get(getPaymentMediums).post(createPaymentMedium);
mediumRoutes.route("/pagination").post(getDataWithPagination);

mediumRoutes
  .route("/:mediumId")
  .get(getPaymentMedium)
  .put(updatePaymentMedium)
  .delete(deletePaymentMedium);

export default mediumRoutes;
