import { Router } from "express";
import {
  createLeadSource,
  deleteLeadSource,
  getLeadSource,
  getLeadSources,
  getDataWithPagination,
  updateLeadSource,
} from "../controller/lead-source.controller";

const leadSourceRoutes = Router();
leadSourceRoutes.route("/").get(getLeadSources).post(createLeadSource);
leadSourceRoutes.route("/pagination").post(getDataWithPagination);

leadSourceRoutes
  .route("/:sourceId")
  .get(getLeadSource)
  .put(updateLeadSource)
  .delete(deleteLeadSource);

export default leadSourceRoutes;
