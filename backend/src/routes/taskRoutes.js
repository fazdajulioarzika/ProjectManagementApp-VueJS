import { Router } from "express";
import {
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/taskController.js";
import {
  getComments,
  createComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  taskUpdateRules,
  taskStatusRules,
  commentRules,
} from "../utils/validators.js";
import { listTasks } from "../controllers/taskController.js";

const router = Router();
router.use(protect);

router.get("/", listTasks);

router
  .route("/:id")
  .get(getTask)
  .put(taskUpdateRules, validate, updateTask)
  .delete(deleteTask);

router.patch("/:id/status", taskStatusRules, validate, updateTaskStatus);

router
  .route("/:taskId/comments")
  .get(getComments)
  .post(commentRules, validate, createComment);

export default router;
