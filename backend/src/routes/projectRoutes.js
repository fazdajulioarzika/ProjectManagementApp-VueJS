import { Router } from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { getTasks, createTask } from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  projectCreateRules,
  projectUpdateRules,
  taskCreateRules,
} from "../utils/validators.js";

const router = Router();
router.use(protect);

router
  .route("/")
  .get(getProjects)
  .post(
    authorize("admin", "manager"),
    projectCreateRules,
    validate,
    createProject
  );

router
  .route("/:id")
  .get(getProject)
  .put(projectUpdateRules, validate, updateProject)
  .delete(authorize("admin"), deleteProject);

router
  .route("/:projectId/tasks")
  .get(getTasks)
  .post(taskCreateRules, validate, createTask);

export default router;
