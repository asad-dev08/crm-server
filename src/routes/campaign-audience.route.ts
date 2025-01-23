import { Router } from "express";
import {
  createCampaignAudience,
  deleteCampaignAudience,
  getCampaignAudience,
  getCampaignAudiences,
  getDataWithPagination,
  updateCampaignAudience,
} from "../controller/campaign-audience.controller";

const audienceRoutes = Router();
audienceRoutes
  .route("/")
  .get(getCampaignAudiences)
  .post(createCampaignAudience);
audienceRoutes.route("/pagination").post(getDataWithPagination);

audienceRoutes
  .route("/:audienceId")
  .get(getCampaignAudience)
  .put(updateCampaignAudience)
  .delete(deleteCampaignAudience);

export default audienceRoutes;
