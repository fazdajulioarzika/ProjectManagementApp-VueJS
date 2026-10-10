import { describe, it, expect } from 'vitest';
import { api } from './helpers.js';

describe('pembatasan percobaan login', () => {
  it('percobaan ke-31 dari IP yang sama ditolak dengan 429', async () => {
    const attempt = () => api().post('/api/auth/login').send({ email: 'hantu@mail.com', password: 'salah123' });

    for (let i = 0; i < 30; i++) {
      expect((await attempt()).status, `percobaan ${i + 1}`).toBe(401);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/terlalu banyak/i);
  });
});
