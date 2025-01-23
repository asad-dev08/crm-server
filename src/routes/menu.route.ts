import { Router } from "express";
import {
  createMenu,
  deleteMenu,
  getMenu,
  getMenus,
  updateMenu,
} from "../controller/menu.controller";

const menuRoutes = Router();
menuRoutes.route("/").get(getMenus).post(createMenu);

menuRoutes.route("/:menuId").get(getMenu).put(updateMenu).delete(deleteMenu);

export default menuRoutes;
