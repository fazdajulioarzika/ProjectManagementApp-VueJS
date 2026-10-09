import mongoose from "mongoose";

// Disimpan di global agar dipakai ulang antar request pada instance yang sama
const cache =
  global.__mongooseCache ||
  (global.__mongooseCache = { conn: null, promise: null });

const connectDB = async () => {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // izinkan percobaan ulang pada request berikutnya
    throw err;
  }
  return cache.conn;
};

export default connectDB;
