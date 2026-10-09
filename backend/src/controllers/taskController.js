import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { canManageProject, sameId } from "../utils/access.js";
import { getProjectOrFail } from "../services/projectService.js";
import { logActivity } from "../services/activityService.js";
import { notifyAssigned } from "../services/notificationService.js";

const POPULATE = [
  { path: "assignee", select: "name email avatar" },
  { path: "createdBy", select: "name" },
];

const assertAssigneeIsMember = (project, assignee) => {
  if (assignee && !project.members.some((m) => sameId(m.user, assignee))) {
    throw new AppError("Assignee harus anggota project", 400);
  }
};

const loadTaskWithAccess = async (req) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task tidak ditemukan", 404);

  const project = await getProjectOrFail(task.project, req.user);
  const manager = canManageProject(project, req.user);
  const isAssignee = !!task.assignee && sameId(task.assignee, req.user._id);

  return { task, project, manager, isAssignee };
};

const logStatusChange = (user, task, from) =>
  logActivity({
    project: task.project,
    user: user._id,
    action: task.status === "done" ? "task.completed" : "task.moved",
    target: task.title,
    metadata: { from, to: task.status },
  });

// Semua task dari project yang diikuti user (admin: semua project)
export const listTasks = asyncHandler(async (req, res) => {
  const projectFilter =
    req.user.role === "admin"
      ? {}
      : { $or: [{ owner: req.user._id }, { "members.user": req.user._id }] };
  const projectIds = await Project.distinct("_id", projectFilter);

  const tasks = await Task.find({ project: { $in: projectIds } })
    .populate([...POPULATE, { path: "project", select: "name" }])
    .sort("-updatedAt")
    .limit(500);

  res.json({ success: true, count: tasks.length, data: { tasks } });
});

export const getTasks = asyncHandler(async (req, res) => {
  const project = await getProjectOrFail(req.params.projectId, req.user);

  const filter = { project: project._id };
  ["status", "priority", "assignee"].forEach((key) => {
    if (req.query[key]) filter[key] = String(req.query[key]);
  });

  const tasks = await Task.find(filter).populate(POPULATE).sort("-createdAt");
  res.json({ success: true, count: tasks.length, data: { tasks } });
});

export const createTask = asyncHandler(async (req, res) => {
  const project = await getProjectOrFail(req.params.projectId, req.user);
  if (!canManageProject(project, req.user)) {
    throw new AppError("Anda tidak boleh membuat task di project ini", 403);
  }

  const { title, description, status, priority, assignee, dueDate } = req.body;
  assertAssigneeIsMember(project, assignee);

  const task = await Task.create({
    project: project._id,
    title,
    description,
    status,
    priority,
    assignee: assignee || null,
    dueDate: dueDate || null,
    createdBy: req.user._id,
  });
  await task.populate(POPULATE);

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "task.created",
    target: task.title,
  });
  if (task.assignee) {
    await logActivity({
      project: project._id,
      user: req.user._id,
      action: "task.assigned",
      target: task.title,
      metadata: { assignee: task.assignee.name },
    });
    await notifyAssigned({ task, actor: req.user });
  }

  res.status(201).json({ success: true, data: { task } });
});

export const getTask = asyncHandler(async (req, res) => {
  const { task } = await loadTaskWithAccess(req);
  await task.populate([
    ...POPULATE,
    { path: "project", select: "name status" },
  ]);
  res.json({ success: true, data: { task } });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { task, project, manager, isAssignee } = await loadTaskWithAccess(req);
  if (!manager && !isAssignee) {
    throw new AppError(
      "Anda hanya dapat mengubah task yang ditugaskan kepada Anda",
      403
    );
  }

  const allowed = manager
    ? ["title", "description", "priority", "status", "assignee", "dueDate"]
    : ["description", "status"];

  if (manager && req.body.assignee)
    assertAssigneeIsMember(project, req.body.assignee);

  const prevStatus = task.status;
  const prevAssignee = String(task.assignee ?? "");

  allowed.forEach((key) => {
    if (req.body[key] !== undefined) task[key] = req.body[key];
  });
  await task.save();

  const assigneeChanged = String(task.assignee ?? "") !== prevAssignee;
  await task.populate(POPULATE);

  if (task.status !== prevStatus)
    await logStatusChange(req.user, task, prevStatus);
  if (assigneeChanged && task.assignee) {
    await logActivity({
      project: task.project,
      user: req.user._id,
      action: "task.assigned",
      target: task.title,
      metadata: { assignee: task.assignee.name },
    });
    await notifyAssigned({ task, actor: req.user });
  }

  res.json({ success: true, data: { task } });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { task, manager, isAssignee } = await loadTaskWithAccess(req);
  if (!manager && !isAssignee) {
    throw new AppError(
      "Anda hanya dapat mengubah status task yang ditugaskan kepada Anda",
      403
    );
  }

  const prevStatus = task.status;
  task.status = req.body.status;
  await task.save();
  await task.populate(POPULATE);

  if (task.status !== prevStatus)
    await logStatusChange(req.user, task, prevStatus);

  res.json({ success: true, data: { task } });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { task, manager } = await loadTaskWithAccess(req);
  if (!manager) throw new AppError("Anda tidak boleh menghapus task ini", 403);

  await Comment.deleteMany({ task: task._id });
  await Notification.deleteMany({ task: task._id });
  await task.deleteOne();

  await logActivity({
    project: task.project,
    user: req.user._id,
    action: "task.deleted",
    target: task.title,
  });

  res.json({ success: true, message: "Task berhasil dihapus" });
});
