import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

const DAY = 24 * 60 * 60 * 1000;
const TZ = "Asia/Jakarta"; // zona waktu untuk mengelompokkan tren per hari
const ALLOWED_DAYS = [7, 14, 30];
const STATUSES = ["todo", "in_progress", "review", "done"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // hasil: YYYY-MM-DD

// Ubah hasil $group menjadi objek { key: jumlah } dengan semua key terisi (default 0)
const toCounts = (rows, keys) => {
  const out = Object.fromEntries(keys.map((k) => [k, 0]));
  rows.forEach((r) => {
    if (r._id in out) out[r._id] = r.count;
  });
  return out;
};

const groupCount = (field) => [
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
];

export const getAnalytics = asyncHandler(async (req, res) => {
  const days = ALLOWED_DAYS.includes(Number(req.query.days))
    ? Number(req.query.days)
    : 14;

  // Admin melihat semua project, user lain hanya project yang diikuti
  const accessFilter =
    req.user.role === "admin"
      ? {}
      : { $or: [{ owner: req.user._id }, { "members.user": req.user._id }] };
  const projects = await Project.find(accessFilter).select("name").sort("name");

  let scope = projects;
  if (req.query.project) {
    const selected = projects.find(
      (p) => String(p._id) === String(req.query.project)
    );
    if (!selected)
      throw new AppError(
        "Project tidak ditemukan atau tidak dapat diakses",
        404
      );
    scope = [selected];
  }

  const projectIds = scope.map((p) => p._id);
  const taskMatch = { project: { $in: projectIds } };
  const since = new Date(Date.now() - days * DAY);

  const [statusRows, priorityRows, assigneeRows, overdue, completedRows] =
    await Promise.all([
      Task.aggregate([{ $match: taskMatch }, ...groupCount("status")]),
      Task.aggregate([{ $match: taskMatch }, ...groupCount("priority")]),
      Task.aggregate([
        { $match: taskMatch },
        {
          $group: {
            _id: "$assignee",
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            total: 1,
            done: 1,
            name: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, null] },
          },
        },
      ]),
      Task.countDocuments({
        ...taskMatch,
        status: { $ne: "done" },
        dueDate: { $lt: new Date() },
      }),
      Activity.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            action: "task.completed",
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: TZ,
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const byStatus = toCounts(statusRows, STATUSES);
  const byPriority = toCounts(priorityRows, PRIORITIES);
  const totalTasks = Object.values(byStatus).reduce((a, b) => a + b, 0);

  // Isi hari yang tidak ada penyelesaian dengan 0 agar garis grafik utuh
  const counts = new Map(completedRows.map((r) => [r._id, r.count]));
  const completedPerDay = Array.from({ length: days }, (_, i) => {
    const date = dateKey.format(new Date(Date.now() - (days - 1 - i) * DAY));
    return { date, count: counts.get(date) ?? 0 };
  });

  res.json({
    success: true,
    data: {
      projects: projects.map((p) => ({ _id: p._id, name: p.name })),
      summary: {
        totalTasks,
        completed: byStatus.done,
        overdue,
        completionRate: totalTasks
          ? Math.round((byStatus.done / totalTasks) * 100)
          : 0,
      },
      byStatus,
      byPriority,
      byAssignee: assigneeRows.map((r) => ({
        name: r.name,
        total: r.total,
        done: r.done,
      })),
      completedPerDay,
    },
  });
});
