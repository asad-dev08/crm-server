import { Router } from "express";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  getEmailTemplates,
  getDataWithPagination,
  updateEmailTemplate,
} from "../controller/email-template.controller";

const emailTemplateRoutes = Router();
emailTemplateRoutes.route("/").get(getEmailTemplates).post(createEmailTemplate);
emailTemplateRoutes.route("/pagination").post(getDataWithPagination);

emailTemplateRoutes
  .route("/:templateId")
  .get(getEmailTemplate)
  .put(updateEmailTemplate)
  .delete(deleteEmailTemplate);

export default emailTemplateRoutes;
