import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controller/user.controller";

const userRoutes = Router();
userRoutes.route("/").get(getUsers).post(createUser);

userRoutes.route("/:userId").get(getUser).put(updateUser).delete(deleteUser);

export default userRoutes;
