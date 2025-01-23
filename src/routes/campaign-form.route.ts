import { Router } from "express";
import {
  createCampaignForm,
  deleteCampaignForm,
  getCampaignForm,
  getCampaignForms,
  getDataWithPagination,
  saveSubmittedCampaignFormData,
  updateCampaignForm,
} from "../controller/campaign-form.controller";

const formRoutes = Router();
formRoutes.route("/").get(getCampaignForms).post(createCampaignForm);
formRoutes.route("/pagination").post(getDataWithPagination);
formRoutes.route("/save-form").post(saveSubmittedCampaignFormData);

formRoutes
  .route("/:formId")
  .get(getCampaignForm)
  .put(updateCampaignForm)
  .delete(deleteCampaignForm);

export default formRoutes;
