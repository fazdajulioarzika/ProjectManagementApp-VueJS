import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { isProjectMember } from "../utils/access.js";

// Ambil project + pastikan user punya akses (dipakai di banyak controller)
export const getProjectOrFail = async (id, user) => {
  const project = await Project.findById(id);
  if (!project) throw new AppError("Project tidak ditemukan", 404);
  if (!isProjectMember(project, user)) {
    throw new AppError("Anda tidak memiliki akses ke project ini", 403);
  }
  return project;
};

// Progress = task done / total task
export const getProgressMap = async (projectIds) => {
  const rows = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: "$project",
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
      },
    },
  ]);
  const map = {};
  rows.forEach((r) => {
    map[r._id.toString()] = {
      totalTasks: r.total,
      doneTasks: r.done,
      progress: Math.round((r.done / r.total) * 100),
    };
  });
  return map;
};

export const withProgress = (project, map) => ({
  ...project.toObject(),
  ...(map[project._id.toString()] || {
    totalTasks: 0,
    doneTasks: 0,
    progress: 0,
  }),
});

// Owner otomatis jadi anggota, hilangkan duplikat, cek user ada di database
export const normalizeMembers = async (ownerId, members = []) => {
  const list = new Map();
  list.set(String(ownerId), { user: ownerId, title: "Project Manager" });
  for (const m of members) {
    const uid = String(m.user);
    if (!list.has(uid))
      list.set(uid, { user: m.user, title: m.title || "Member" });
  }
  const ids = [...list.keys()];
  const count = await User.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length)
    throw new AppError("Ada anggota yang tidak ditemukan", 400);
  return [...list.values()];
};
