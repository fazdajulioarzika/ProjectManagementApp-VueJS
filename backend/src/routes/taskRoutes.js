import { Router } from "express";
import {
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { taskUpdateRules, taskStatusRules } from "../utils/validators.js";

const router = Router();
router.use(protect);

router
  .route("/:id")
  .get(getTask)
  .put(taskUpdateRules, validate, updateTask)
  .delete(deleteTask);

router.patch("/:id/status", taskStatusRules, validate, updateTaskStatus);

export default router;
