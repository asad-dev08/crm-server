import { Router } from "express";
import { getDataWithPagination } from "../controller/user-pagination.controller";

const userPaginationRoutes = Router();
userPaginationRoutes.route("/").post(getDataWithPagination);

export default userPaginationRoutes;
