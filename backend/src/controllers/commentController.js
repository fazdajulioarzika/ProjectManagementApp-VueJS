import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sameId } from "../utils/access.js";
import { getProjectOrFail } from "../services/projectService.js";
import { logActivity } from "../services/activityService.js";

const USER_FIELDS = "name avatar";

// Pastikan task ada dan user punya akses ke project-nya
const loadTask = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError("Task tidak ditemukan", 404);
  await getProjectOrFail(task.project, user);
  return task;
};

export const getComments = asyncHandler(async (req, res) => {
  const task = await loadTask(req.params.taskId, req.user);
  const comments = await Comment.find({ task: task._id })
    .populate("user", USER_FIELDS)
    .sort("createdAt");
  res.json({ success: true, count: comments.length, data: { comments } });
});

export const createComment = asyncHandler(async (req, res) => {
  const task = await loadTask(req.params.taskId, req.user);

  const comment = await Comment.create({
    task: task._id,
    user: req.user._id,
    content: req.body.content,
  });
  await comment.populate("user", USER_FIELDS);

  await logActivity({
    project: task.project,
    user: req.user._id,
    action: "comment.added",
    target: task.title,
  });

  res.status(201).json({ success: true, data: { comment } });
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError("Komentar tidak ditemukan", 404);
  await loadTask(comment.task, req.user);

  // Hanya penulisnya yang boleh mengedit (admin pun tidak)
  if (!sameId(comment.user, req.user._id)) {
    throw new AppError("Anda hanya dapat mengedit komentar sendiri", 403);
  }

  comment.content = req.body.content;
  await comment.save();
  await comment.populate("user", USER_FIELDS);

  res.json({ success: true, data: { comment } });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError("Komentar tidak ditemukan", 404);
  await loadTask(comment.task, req.user);

  // Penulis boleh menghapus komentarnya; admin boleh menghapus komentar siapa pun
  if (!sameId(comment.user, req.user._id) && req.user.role !== "admin") {
    throw new AppError("Anda hanya dapat menghapus komentar sendiri", 403);
  }

  await comment.deleteOne();
  res.json({ success: true, message: "Komentar berhasil dihapus" });
});
