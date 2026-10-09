import AppError from "../utils/AppError.js";

export const notFound = (req, res, next) =>
  next(new AppError(`Route ${req.originalUrl} tidak ditemukan`, 404));

export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Terjadi kesalahan pada server";

  if (err.code === 11000) {
    status = 409;
    message = "Email sudah terdaftar";
  }
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }
  if (err.name === "CastError") {
    status = 400;
    message = "ID tidak valid";
  }
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Token tidak valid atau sudah kedaluwarsa";
  }
  if (status === 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production")
      message = "Terjadi kesalahan pada server";
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
