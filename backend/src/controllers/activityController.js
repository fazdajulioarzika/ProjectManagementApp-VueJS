import Activity from "../models/Activity.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getProjectOrFail } from "../services/projectService.js";

export const getProjectActivities = asyncHandler(async (req, res) => {
  const project = await getProjectOrFail(req.params.id, req.user);

  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter = { project: project._id };

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("user", "name avatar")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Activity.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { activities, page, hasMore: page * limit < total },
  });
});
