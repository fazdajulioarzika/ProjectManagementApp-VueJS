import dns from "dns";
import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

// Hanya untuk lokal: pakai DNS publik jika DNS Wi-Fi bermasalah
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const required = ["MONGODB_URI", "JWT_SECRET", "CLIENT_URL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Environment variable belum diisi: ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((err) => {
    console.error("MongoDB error:", err.message);
    process.exit(1);
  });
