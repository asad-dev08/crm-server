import { Router } from "express";
import {
  createTaskboard,
  deleteTaskboard,
  getTaskboard,
  getTaskboards,
  getDataWithPagination,
  updateTaskboard,
} from "../controller/task-board-controller";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  getTasksByBoard,
  updateTask,
} from "../controller/task-controller ";

const boardRoutes = Router();
boardRoutes.route("/board").get(getTaskboards).post(createTaskboard);
boardRoutes.route("/task").get(getTasks).post(createTask);
boardRoutes.route("/taskByBoard").post(getTasksByBoard);
// boardRoutes.route("/pagination").post(getDataWithPagination);

boardRoutes
  .route("/board/:boardId")
  .get(getTaskboard)
  .put(updateTaskboard)
  .delete(deleteTaskboard);

boardRoutes.route("/task/:taskId").get(getTask).put(updateTask);
boardRoutes
  .route("/task/:taskId/:boardId")

  .delete(deleteTask);

export default boardRoutes;
