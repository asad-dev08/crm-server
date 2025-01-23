import { Router } from "express";
import {
  createCampaignStatus,
  deleteCampaignStatus,
  getCampaignStatus,
  getCampaignStatuss,
  getDataWithPagination,
  updateCampaignStatus,
} from "../controller/campaign-status.controller";

const statusRoutes = Router();
statusRoutes.route("/").get(getCampaignStatuss).post(createCampaignStatus);
statusRoutes.route("/pagination").post(getDataWithPagination);

statusRoutes
  .route("/:statusId")
  .get(getCampaignStatus)
  .put(updateCampaignStatus)
  .delete(deleteCampaignStatus);

export default statusRoutes;
