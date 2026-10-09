import { body, param } from "express-validator";

const PROJECT_STATUS = ["planning", "active", "completed", "archived"];
const TASK_STATUS = ["todo", "in_progress", "review", "done"];
const PRIORITY = ["low", "medium", "high", "urgent"];

const oneOf = (list) => `harus salah satu dari: ${list.join(", ")}`;

const projectCommon = [
  body("status")
    .optional()
    .isIn(PROJECT_STATUS)
    .withMessage(`Status ${oneOf(PROJECT_STATUS)}`),
  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Format startDate tidak valid"),
  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Format endDate tidak valid"),
];

export const projectCreateRules = [
  body("name").trim().notEmpty().withMessage("Nama project wajib diisi"),
  ...projectCommon,
];
export const projectUpdateRules = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nama project tidak boleh kosong"),
  ...projectCommon,
];

const taskCommon = [
  body("status")
    .optional()
    .isIn(TASK_STATUS)
    .withMessage(`Status ${oneOf(TASK_STATUS)}`),
  body("priority")
    .optional()
    .isIn(PRIORITY)
    .withMessage(`Priority ${oneOf(PRIORITY)}`),
  body("assignee")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Assignee tidak valid"),
  body("dueDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Format dueDate tidak valid"),
];

export const taskCreateRules = [
  body("title").trim().notEmpty().withMessage("Judul task wajib diisi"),
  ...taskCommon,
];
export const taskUpdateRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Judul task tidak boleh kosong"),
  ...taskCommon,
];

export const taskStatusRules = [
  body("status")
    .isIn(TASK_STATUS)
    .withMessage(`Status ${oneOf(TASK_STATUS)}`),
];
export const memberAddRules = [
  body("user").isMongoId().withMessage("User tidak valid"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Jabatan maksimal 50 karakter"),
];

export const memberRemoveRules = [
  param("userId").isMongoId().withMessage("ID user tidak valid"),
];
export const commentRules = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Komentar tidak boleh kosong")
    .isLength({ max: 1000 })
    .withMessage("Komentar maksimal 1000 karakter"),
];
