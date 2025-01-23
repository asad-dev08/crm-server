import { Router } from "express";
import {
  createLead,
  deleteLead,
  getLead,
  getLeads,
  getDataWithPagination,
  updateLead,
} from "../controller/lead.controller";

const leadRoutes = Router();
leadRoutes.route("/").get(getLeads).post(createLead);
leadRoutes.route("/pagination").post(getDataWithPagination);

leadRoutes.route("/:leadId").get(getLead).put(updateLead).delete(deleteLead);

export default leadRoutes;
