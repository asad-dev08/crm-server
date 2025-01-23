import { Router } from "express";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  getCampaigns,
  getDataWithPagination,
  updateCampaign,
} from "../controller/campaign.controller";

const campaignRoutes = Router();
campaignRoutes.route("/").get(getCampaigns).post(createCampaign);
campaignRoutes.route("/pagination").post(getDataWithPagination);

campaignRoutes
  .route("/:campaignId")
  .get(getCampaign)
  .put(updateCampaign)
  .delete(deleteCampaign);

export default campaignRoutes;
