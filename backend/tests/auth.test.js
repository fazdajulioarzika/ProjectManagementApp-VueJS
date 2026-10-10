import { describe, it, expect } from 'vitest';
import { api, createUser } from './helpers.js';
import User from '../src/models/User.js';

const valid = { name: 'Fazda', email: 'fazda@mail.com', password: '123456' };

describe('POST /api/auth/register', () => {
  it('membuat akun baru, mengembalikan token, dan tidak membocorkan password', async () => {
    const res = await api().post('/api/auth/register').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('fazda@mail.com');
    expect(res.body.data.user.role).toBe('member');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('mengabaikan role dari body agar tidak ada yang mendaftar sebagai admin', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('member');
  });

  it('menyimpan password dalam bentuk hash', async () => {
    await api().post('/api/auth/register').send(valid);
    const stored = await User.findOne({ email: valid.email }).select('+password');

    expect(stored.password).not.toBe(valid.password);
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('menolak email yang sudah terdaftar dengan 409', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/register').send(valid);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email sudah terdaftar');
  });

  it('menormalkan email: huruf besar dan spasi tidak membuat akun ganda', async () => {
    await api().post('/api/auth/register').send({ ...valid, email: '  Fazda@Mail.COM ' });
    const res = await api().post('/api/auth/login').send({ email: 'fazda@mail.com', password: '123456' });

    expect(res.status).toBe(200);
  });

  it.each([
    ['nama kosong', { name: '' }, 'Nama wajib diisi'],
    ['email tidak valid', { email: 'bukan-email' }, 'Email tidak valid'],
    ['password terlalu pendek', { password: '123' }, 'Password minimal 6 karakter'],
  ])('menolak %s dengan 400', async (_label, override, message) => {
    const res = await api().post('/api/auth/register').send({ ...valid, ...override });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
  });
});

describe('POST /api/auth/login', () => {
  it('berhasil dengan kredensial yang benar', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/login').send({ email: valid.email, password: valid.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('menolak password salah dengan 401', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/login').send({ email: valid.email, password: 'salah-total' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });

  it('memberi pesan yang sama untuk email tidak terdaftar (tidak membocorkan keberadaan akun)', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'hantu@mail.com', password: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });
});

describe('GET /api/auth/me', () => {
  it('mengembalikan data user yang login', async () => {
    const u = await createUser({ name: 'Andi' });
    const res = await api().get('/api/auth/me').set(u.headers);

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Andi');
  });

  it('menolak request tanpa token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('menolak token palsu', async () => {
    const res = await api().get('/api/auth/me').set('Authorization', 'Bearer token.palsu.sekali');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/tidak valid/i);
  });

  it('menolak header tanpa kata Bearer', async () => {
    const u = await createUser();
    const res = await api().get('/api/auth/me').set('Authorization', u.headers.Authorization.replace('Bearer ', ''));

    expect(res.status).toBe(401);
  });

  it('menolak token milik user yang sudah dihapus', async () => {
    const u = await createUser();
    await User.deleteOne({ _id: u.id });
    const res = await api().get('/api/auth/me').set(u.headers);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('berhasil untuk user yang login', async () => {
    const u = await createUser();
    const res = await api().post('/api/auth/logout').set(u.headers);
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/auth/profile', () => {
  it('mengubah nama', async () => {
    const u = await createUser();
    const res = await api().put('/api/auth/profile').set(u.headers).send({ name: 'Nama Baru' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Nama Baru');
  });

  it('tidak dapat menaikkan role sendiri lewat body', async () => {
    const u = await createUser();
    const res = await api().put('/api/auth/profile').set(u.headers).send({ name: 'Nama', role: 'admin' });

    expect(res.status).toBe(200);
    expect((await User.findById(u.id)).role).toBe('member');
  });

  it('tidak dapat mengubah email lewat body', async () => {
    const u = await createUser({ email: 'asli@test.com' });
    await api().put('/api/auth/profile').set(u.headers).send({ email: 'baru@test.com' });

    expect((await User.findById(u.id)).email).toBe('asli@test.com');
  });

  it('menerima avatar berupa data URL gambar dan dapat menghapusnya', async () => {
    const u = await createUser();
    const avatar = 'data:image/png;base64,iVBORw0KGgo=';

    const set = await api().put('/api/auth/profile').set(u.headers).send({ avatar });
    expect(set.status).toBe(200);
    expect(set.body.data.user.avatar).toBe(avatar);

    const clear = await api().put('/api/auth/profile').set(u.headers).send({ avatar: '' });
    expect(clear.body.data.user.avatar).toBe('');
  });

  it('menolak avatar dengan format berbahaya', async () => {
    const u = await createUser();
    const res = await api()
      .put('/api/auth/profile')
      .set(u.headers)
      .send({ avatar: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
  });

  it('menolak nama kosong', async () => {
    const u = await createUser();
    const res = await api().put('/api/auth/profile').set(u.headers).send({ name: '   ' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/auth/password', () => {
  it('mengganti password: yang baru berlaku, yang lama tidak', async () => {
    await api().post('/api/auth/register').send(valid);
    const login = await api().post('/api/auth/login').send({ email: valid.email, password: valid.password });
    const headers = { Authorization: `Bearer ${login.body.data.token}` };

    const change = await api()
      .put('/api/auth/password')
      .set(headers)
      .send({ currentPassword: '123456', newPassword: 'passwordBaru1' });
    expect(change.status).toBe(200);

    const withNew = await api().post('/api/auth/login').send({ email: valid.email, password: 'passwordBaru1' });
    const withOld = await api().post('/api/auth/login').send({ email: valid.email, password: '123456' });
    expect(withNew.status).toBe(200);
    expect(withOld.status).toBe(401);
  });

  it('password saat ini salah mengembalikan 400, bukan 401 (agar frontend tidak logout)', async () => {
    const u = await createUser();
    const res = await api()
      .put('/api/auth/password')
      .set(u.headers)
      .send({ currentPassword: 'bukan-ini', newPassword: 'passwordBaru1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password saat ini salah');
  });

  it('menolak password baru yang sama dengan yang lama', async () => {
    const u = await createUser();
    const res = await api()
      .put('/api/auth/password')
      .set(u.headers)
      .send({ currentPassword: 'secret123', newPassword: 'secret123' });

    expect(res.status).toBe(400);
  });

  it('menolak password baru yang terlalu pendek', async () => {
    const u = await createUser();
    const res = await api()
      .put('/api/auth/password')
      .set(u.headers)
      .send({ currentPassword: 'secret123', newPassword: '123' });

    expect(res.status).toBe(400);
  });
});
