import { Router } from "express";
import {
  createCurrency,
  deleteCurrency,
  getCurrency,
  getCurrencys,
  getDataWithPagination,
  updateCurrency,
} from "../controller/currency.controller";

const currencyRoutes = Router();
currencyRoutes.route("/").get(getCurrencys).post(createCurrency);
currencyRoutes.route("/pagination").post(getDataWithPagination);

currencyRoutes
  .route("/:currencyId")
  .get(getCurrency)
  .put(updateCurrency)
  .delete(deleteCurrency);

export default currencyRoutes;
