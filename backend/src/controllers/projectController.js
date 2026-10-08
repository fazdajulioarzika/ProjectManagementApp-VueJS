import Project from "../models/Project.js";
import Task from "../models/Task.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { canManageProject } from "../utils/access.js";
import {
  getProjectOrFail,
  getProgressMap,
  withProgress,
  normalizeMembers,
} from "../services/projectService.js";

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

  res
    .status(201)
    .json({ success: true, data: { project: withProgress(project, {}) } });
});

export const getProjects = asyncHandler(async (req, res) => {
  // admin lihat semua, user lain hanya project yang diikuti
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
  await project.save();

  const map = await getProgressMap([project._id]);
  res.json({ success: true, data: { project: withProgress(project, map) } });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError("Project tidak ditemukan", 404);

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true, message: "Project berhasil dihapus" });
});
