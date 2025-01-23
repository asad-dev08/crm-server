import { Router } from "express";
import {
  createSecurityRule,
  deleteSecurityRule,
  getSecurityRule,
  getSecurityRules,
  updateSecurityRule,
} from "../controller/security-rule.controller";
import { getDataWithPagination } from "../controller/security-rule-pagination.controller";

const securityRuleRoutes = Router();
securityRuleRoutes.route("/").get(getSecurityRules).post(createSecurityRule);
securityRuleRoutes.route("/pagination").post(getDataWithPagination);

securityRuleRoutes
  .route("/:securityRuleId")
  .get(getSecurityRule)
  .put(updateSecurityRule)
  .delete(deleteSecurityRule);

export default securityRuleRoutes;
