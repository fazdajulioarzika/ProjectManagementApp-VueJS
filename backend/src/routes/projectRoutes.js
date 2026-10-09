import { Router } from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from "../controllers/projectController.js";
import { getTasks, createTask } from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  projectCreateRules,
  projectUpdateRules,
  taskCreateRules,
  memberAddRules,
  memberRemoveRules,
} from "../utils/validators.js";
import { getProjectActivities } from "../controllers/activityController.js";

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

router.post("/:id/members", memberAddRules, validate, addMember);
router.delete(
  "/:id/members/:userId",
  memberRemoveRules,
  validate,
  removeMember
);

router.get("/:id/activities", getProjectActivities);

export default router;
