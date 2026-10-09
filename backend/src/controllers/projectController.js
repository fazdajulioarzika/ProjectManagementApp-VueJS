import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Activity from "../models/Activity.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { canManageProject, sameId } from "../utils/access.js";
import {
  getProjectOrFail,
  getProgressMap,
  withProgress,
  normalizeMembers,
} from "../services/projectService.js";
import { logActivity } from "../services/activityService.js";
import Notification from "../models/Notification.js";

const USER_FIELDS = "name email avatar";

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, startDate, endDate, members } = req.body;

  const project = await Project.create({
    name,
    description,
    status,
    startDate,
    endDate,
    owner: req.user._id,
    members: await normalizeMembers(req.user._id, members),
  });

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "project.created",
    target: project.name,
  });

  res
    .status(201)
    .json({ success: true, data: { project: withProgress(project, {}) } });
});

export const getProjects = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "admin"
      ? {}
      : { $or: [{ owner: req.user._id }, { "members.user": req.user._id }] };

  const projects = await Project.find(filter)
    .populate("owner", USER_FIELDS)
    .sort("-createdAt");
  const map = await getProgressMap(projects.map((p) => p._id));

  res.json({
    success: true,
    count: projects.length,
    data: { projects: projects.map((p) => withProgress(p, map)) },
  });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectOrFail(req.params.id, req.user);
  await project.populate([
    { path: "owner", select: USER_FIELDS },
    { path: "members.user", select: USER_FIELDS },
  ]);
  const map = await getProgressMap([project._id]);

  res.json({ success: true, data: { project: withProgress(project, map) } });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await getProjectOrFail(req.params.id, req.user);
  if (!canManageProject(project, req.user)) {
    throw new AppError("Anda tidak boleh mengubah project ini", 403);
  }

  ["name", "description", "status", "startDate", "endDate"].forEach((key) => {
    if (req.body[key] !== undefined) project[key] = req.body[key];
  });

  const changed = project.isModified();
  await project.save();

  if (changed) {
    await logActivity({
      project: project._id,
      user: req.user._id,
      action: "project.updated",
      target: project.name,
    });
  }

  const map = await getProgressMap([project._id]);
  res.json({ success: true, data: { project: withProgress(project, map) } });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError("Project tidak ditemukan", 404);

  const taskIds = await Task.distinct("_id", { project: project._id });
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await Notification.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true, message: "Project berhasil dihapus" });
});

export const addMember = asyncHandler(async (req, res) => {
  const project = await getProjectOrFail(req.params.id, req.user);
  if (!canManageProject(project, req.user)) {
    throw new AppError("Anda tidak boleh mengelola anggota project ini", 403);
  }

  const { user, title } = req.body;
  const newUser = await User.findById(user).select("name");
  if (!newUser) throw new AppError("User tidak ditemukan", 404);
  if (project.members.some((m) => sameId(m.user, user))) {
    throw new AppError("User sudah menjadi anggota project", 409);
  }

  project.members.push({ user, title: title || "Member" });
  await project.save();
  await project.populate("members.user", USER_FIELDS);

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "member.added",
    target: newUser.name,
  });

  res.status(201).json({ success: true, data: { members: project.members } });
});

export const removeMember = asyncHandler(async (req, res) => {
  const project = await getProjectOrFail(req.params.id, req.user);
  if (!canManageProject(project, req.user)) {
    throw new AppError("Anda tidak boleh mengelola anggota project ini", 403);
  }

  const { userId } = req.params;
  if (sameId(project.owner, userId)) {
    throw new AppError("Owner project tidak dapat dikeluarkan", 400);
  }

  const removed = await User.findById(userId).select("name");

  const before = project.members.length;
  project.members = project.members.filter((m) => !sameId(m.user, userId));
  if (project.members.length === before)
    throw new AppError("User bukan anggota project", 404);
  await project.save();

  await Task.updateMany(
    { project: project._id, assignee: userId },
    { assignee: null }
  );

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: "member.removed",
    target: removed?.name ?? "user",
  });

  res.json({ success: true, message: "Anggota berhasil dikeluarkan" });
});
