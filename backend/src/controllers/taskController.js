import Task from "../models/Task.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { canManageProject, sameId } from "../utils/access.js";
import { getProjectOrFail } from "../services/projectService.js";

const POPULATE = [
  { path: "assignee", select: "name email avatar" },
  { path: "createdBy", select: "name" },
];

const assertAssigneeIsMember = (project, assignee) => {
  if (assignee && !project.members.some((m) => sameId(m.user, assignee))) {
    throw new AppError("Assignee harus anggota project", 400);
  }
};

// Ambil task + project + hak akses user terhadap task tersebut
const loadTaskWithAccess = async (req) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError("Task tidak ditemukan", 404);

  const project = await getProjectOrFail(task.project, req.user);
  const manager = canManageProject(project, req.user);
  const isAssignee = !!task.assignee && sameId(task.assignee, req.user._id);

  return { task, project, manager, isAssignee };
};

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

  // manager: semua field, assignee biasa: hanya description & status
  const allowed = manager
    ? ["title", "description", "priority", "status", "assignee", "dueDate"]
    : ["description", "status"];

  if (manager && req.body.assignee)
    assertAssigneeIsMember(project, req.body.assignee);

  allowed.forEach((key) => {
    if (req.body[key] !== undefined) task[key] = req.body[key];
  });
  await task.save();
  await task.populate(POPULATE);

  res.json({ success: true, data: { task } });
});

// Dipakai Kanban saat drag & drop
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { task, manager, isAssignee } = await loadTaskWithAccess(req);
  if (!manager && !isAssignee) {
    throw new AppError(
      "Anda hanya dapat mengubah status task yang ditugaskan kepada Anda",
      403
    );
  }

  task.status = req.body.status;
  await task.save();
  await task.populate(POPULATE);

  res.json({ success: true, data: { task } });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { task, manager } = await loadTaskWithAccess(req);
  if (!manager) throw new AppError("Anda tidak boleh menghapus task ini", 403);

  await task.deleteOne();
  res.json({ success: true, message: "Task berhasil dihapus" });
});
