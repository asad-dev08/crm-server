import { Router } from "express";
import {
  createCompany,
  deleteCompany,
  getCompany,
  getCompanys,
  getDataWithPagination,
  updateCompany,
} from "../controller/company.controller";

const companyRoutes = Router();
companyRoutes.route("/").get(getCompanys).post(createCompany);
companyRoutes.route("/pagination").post(getDataWithPagination);

companyRoutes
  .route("/:companyId")
  .get(getCompany)
  .put(updateCompany)
  .delete(deleteCompany);

export default companyRoutes;
