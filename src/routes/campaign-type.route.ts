import { Router } from "express";
import {
  createCampaignType,
  deleteCampaignType,
  getCampaignType,
  getCampaignTypes,
  getDataWithPagination,
  updateCampaignType,
} from "../controller/campaign-type.controller";

const typeRoutes = Router();
typeRoutes.route("/").get(getCampaignTypes).post(createCampaignType);
typeRoutes.route("/pagination").post(getDataWithPagination);

typeRoutes
  .route("/:typeId")
  .get(getCampaignType)
  .put(updateCampaignType)
  .delete(deleteCampaignType);

export default typeRoutes;
