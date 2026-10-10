import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import dns from 'dns';
import mongoose from 'mongoose';

const uri = inject('mongoUri');

// Untuk jaringan yang DNS-nya bermasalah (hanya relevan jika memakai mongodb+srv)
const dnsServers = inject('dnsServers');
if (dnsServers) dns.setServers(dnsServers.split(',').map((s) => s.trim()));

// PENGAMAN: tes menghapus seluruh data sebelum tiap kasus.
// Jadi hanya boleh berjalan di database yang namanya mengandung "test".
const dbName = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).pathname.slice(1);
if (!/test/i.test(dbName)) {
  throw new Error(
    `Tes ditolak: nama database "${dbName}" tidak mengandung "test". ` +
      'Tes tidak boleh dijalankan pada database aplikasi.'
  );
}

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.MONGODB_URI = uri;

beforeAll(async () => {
  const { default: connectDB } = await import('../src/config/db.js');
  await connectDB();
  // Pastikan index unik (mis. email) sudah terbentuk sebelum tes pertama berjalan
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
});

beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
