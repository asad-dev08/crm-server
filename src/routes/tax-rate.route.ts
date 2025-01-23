import { Router } from "express";
import {
  createTaxRate,
  deleteTaxRate,
  getTaxRate,
  getTaxRates,
  getDataWithPagination,
  updateTaxRate,
} from "../controller/tax-rate.controller";

const taxRateRoutes = Router();
taxRateRoutes.route("/").get(getTaxRates).post(createTaxRate);
taxRateRoutes.route("/pagination").post(getDataWithPagination);

taxRateRoutes
  .route("/:taxRateId")
  .get(getTaxRate)
  .put(updateTaxRate)
  .delete(deleteTaxRate);

export default taxRateRoutes;
