import { Router } from "express";
import { verifyLogin, verifyToken } from "../controller/user.login.controller";

const userLoginRoutes = Router();
userLoginRoutes.route("/").post(verifyLogin);
userLoginRoutes.route("/verifyToken").get(verifyToken);

export default userLoginRoutes;
