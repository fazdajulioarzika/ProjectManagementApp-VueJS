import Project from "../models/Project.js";
import Task from "../models/Task.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getProgressMap } from "../services/projectService.js";

export const getDashboard = asyncHandler(async (req, res) => {
  // admin melihat semua, user lain hanya project yang diikuti
  const filter =
    req.user.role === "admin"
      ? {}
      : { $or: [{ owner: req.user._id }, { "members.user": req.user._id }] };

  const projects = await Project.find(filter)
    .select("name status")
    .sort("-updatedAt");
  const projectIds = projects.map((p) => p._id);
  const taskFilter = { project: { $in: projectIds } };

  const [totalTasks, completed, overdue, recentTasks, progressMap] =
    await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: "done" }),
      Task.countDocuments({
        ...taskFilter,
        status: { $ne: "done" },
        dueDate: { $lt: new Date() },
      }),
      Task.find(taskFilter)
        .sort("-updatedAt")
        .limit(5)
        .populate("project", "name")
        .populate("assignee", "name"),
      getProgressMap(projectIds),
    ]);

  const projectProgress = projects
    .filter((p) => p.status !== "archived")
    .slice(0, 6)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      status: p.status,
      progress: progressMap[p._id.toString()]?.progress ?? 0,
    }));

  res.json({
    success: true,
    data: {
      stats: { totalProjects: projects.length, totalTasks, completed, overdue },
      projectProgress,
      recentTasks,
    },
  });
});
