import { describe, it, expect } from 'vitest';
import { api } from './helpers.js';

describe('aplikasi dasar', () => {
  it('health check mengembalikan status ok', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('route yang tidak ada mengembalikan 404 berformat JSON', async () => {
    const res = await api().get('/api/tidak-ada');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('JSON yang rusak ditolak dengan 400, bukan 500', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ rusak');
    expect(res.status).toBe(400);
  });

  it('CORS mengizinkan origin frontend yang terdaftar', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('CORS tidak mengizinkan origin yang tidak terdaftar', async () => {
    const res = await api().get('/api/health').set('Origin', 'https://situs-jahat.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('endpoint terproteksi menolak request tanpa token', async () => {
    for (const path of ['/api/projects', '/api/tasks', '/api/dashboard', '/api/analytics', '/api/notifications']) {
      const res = await api().get(path);
      expect(res.status, path).toBe(401);
    }
  });
});
