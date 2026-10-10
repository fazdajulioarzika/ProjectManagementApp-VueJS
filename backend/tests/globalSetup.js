import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Hanya membaca .env.test (khusus tes), TIDAK membaca .env milik aplikasi
dotenv.config({ path: '.env.test', quiet: true });

let server;

export async function setup({ provide }) {
  // Jalur utama: MongoDB in-memory, tidak menyentuh database mana pun.
  // Jalur cadangan: isi TEST_MONGODB_URI di .env.test (nama database harus mengandung "test").
  let uri = process.env.TEST_MONGODB_URI;

  if (!uri) {
    server = await MongoMemoryServer.create();
    uri = server.getUri('taskflow-test');
  }

  provide('mongoUri', uri);
  provide('dnsServers', process.env.DNS_SERVERS ?? '');
}

export async function teardown() {
  await server?.stop();
}
