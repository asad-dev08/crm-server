import { Router } from "express";
import {
  createSecurityGroup,
  deleteSecurityGroup,
  getSecurityGroup,
  getSecurityGroups,
  updateSecurityGroup,
} from "../controller/security-group.controller";
import { getDataWithPagination } from "../controller/security-group-pagination.controller";

const securityGroupRoutes = Router();
securityGroupRoutes.route("/").get(getSecurityGroups).post(createSecurityGroup);
securityGroupRoutes.route("/pagination").post(getDataWithPagination);

securityGroupRoutes
  .route("/:securityGroupId")
  .get(getSecurityGroup)
  .put(updateSecurityGroup)
  .delete(deleteSecurityGroup);

export default securityGroupRoutes;
