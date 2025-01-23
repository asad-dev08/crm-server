import { Router } from "express";
import {
  createLeadStatus,
  deleteLeadStatus,
  getLeadStatus,
  getLeadStatuss,
  getDataWithPagination,
  updateLeadStatus,
} from "../controller/lead-status.controller";

const leadStatusRoutes = Router();
leadStatusRoutes.route("/").get(getLeadStatuss).post(createLeadStatus);
leadStatusRoutes.route("/pagination").post(getDataWithPagination);

leadStatusRoutes
  .route("/:statusId")
  .get(getLeadStatus)
  .put(updateLeadStatus)
  .delete(deleteLeadStatus);

export default leadStatusRoutes;
