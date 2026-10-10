import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers.js';
import User from '../src/models/User.js';

describe('GET /api/users', () => {
  it('member biasa tidak boleh melihat daftar user (403)', async () => {
    const member = await createUser();
    const res = await api().get('/api/users').set(member.headers);

    expect(res.status).toBe(403);
  });

  it('manager dan admin dapat melihat daftar tanpa data sensitif', async () => {
    const manager = await createUser({ role: 'manager' });
    const admin = await createUser({ role: 'admin' });

    for (const actor of [manager, admin]) {
      const res = await api().get('/api/users').set(actor.headers);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data.users[0]).not.toHaveProperty('password');
    }
  });

  it('mencari berdasarkan nama atau email tanpa peduli huruf besar', async () => {
    const admin = await createUser({ role: 'admin', name: 'Admin' });
    await createUser({ name: 'Budi Santoso', email: 'budi@mail.com' });
    await createUser({ name: 'Citra Dewi', email: 'citra@kantor.com' });

    const byName = await api().get('/api/users?search=BUDI').set(admin.headers);
    const byEmail = await api().get('/api/users?search=kantor').set(admin.headers);

    expect(byName.body.data.users.map((u) => u.name)).toEqual(['Budi Santoso']);
    expect(byEmail.body.data.users.map((u) => u.name)).toEqual(['Citra Dewi']);
  });

  it('karakter khusus regex diperlakukan sebagai teks biasa, bukan pola', async () => {
    const admin = await createUser({ role: 'admin' });
    await createUser({ name: 'Budi' });

    const res = await api().get('/api/users').query({ search: '.*' }).set(admin.headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

describe('PATCH /api/users/:id/role', () => {
  it('admin mengubah role: user langsung mendapat hak baru', async () => {
    const admin = await createUser({ role: 'admin' });
    const budi = await createUser({ name: 'Budi' });

    const before = await api().post('/api/projects').set(budi.headers).send({ name: 'X' });
    expect(before.status).toBe(403);

    const res = await api().patch(`/api/users/${budi.id}/role`).set(admin.headers).send({ role: 'manager' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('manager');

    const after = await api().post('/api/projects').set(budi.headers).send({ name: 'X' });
    expect(after.status).toBe(201);
  });

  it('manager dan member tidak boleh mengubah role siapa pun (403)', async () => {
    const manager = await createUser({ role: 'manager' });
    const member = await createUser();
    const target = await createUser();

    for (const actor of [manager, member]) {
      const res = await api().patch(`/api/users/${target.id}/role`).set(actor.headers).send({ role: 'admin' });
      expect(res.status).toBe(403);
    }
    expect((await User.findById(target.id)).role).toBe('member');
  });

  it('admin tidak dapat mengubah rolenya sendiri (mencegah terkunci dari aplikasi)', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api().patch(`/api/users/${admin.id}/role`).set(admin.headers).send({ role: 'member' });

    expect(res.status).toBe(400);
    expect((await User.findById(admin.id)).role).toBe('admin');
  });

  it('menolak role yang tidak dikenal (400)', async () => {
    const admin = await createUser({ role: 'admin' });
    const target = await createUser();
    const res = await api().patch(`/api/users/${target.id}/role`).set(admin.headers).send({ role: 'superadmin' });

    expect(res.status).toBe(400);
  });

  it('menolak user yang tidak ada (404) dan id yang formatnya salah (400)', async () => {
    const admin = await createUser({ role: 'admin' });

    const missing = await api().patch('/api/users/64b7f0f5e1b2c3a4d5e6f708/role').set(admin.headers).send({ role: 'manager' });
    const malformed = await api().patch('/api/users/bukan-id/role').set(admin.headers).send({ role: 'manager' });

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(400);
  });
});
