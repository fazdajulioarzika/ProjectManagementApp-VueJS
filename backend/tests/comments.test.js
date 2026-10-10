import { describe, it, expect } from 'vitest';
import { api, createTask, createComment, createScenario, findActivities } from './helpers.js';
import Comment from '../src/models/Comment.js';

async function withTask() {
  const s = await createScenario();
  const task = await createTask(s.manager, s.projectId, { title: 'Dashboard UI', assignee: s.budi.id });
  return { ...s, task };
}

describe('POST /api/tasks/:id/comments', () => {
  it('anggota project (termasuk member biasa) dapat berkomentar', async () => {
    const { citra, task } = await withTask(); // citra bukan assignee, tetap boleh
    const res = await api().post(`/api/tasks/${task._id}/comments`).set(citra.headers).send({ content: 'Sudah dicek ya' });

    expect(res.status).toBe(201);
    expect(res.body.data.comment).toMatchObject({ content: 'Sudah dicek ya' });
    expect(res.body.data.comment.user.name).toBe('Citra');
  });

  it('mencatat activity comment.added dengan judul task', async () => {
    const { budi, task, projectId } = await withTask();
    await createComment(budi, task._id);

    const logs = await findActivities(projectId, 'comment.added');
    expect(logs).toHaveLength(1);
    expect(logs[0].target).toBe('Dashboard UI');
  });

  it('orang di luar project ditolak (403) dan tidak ada komentar tersimpan', async () => {
    const { outsider, otherManager, task } = await withTask();

    for (const actor of [outsider, otherManager]) {
      const res = await api().post(`/api/tasks/${task._id}/comments`).set(actor.headers).send({ content: 'Nyelonong' });
      expect(res.status).toBe(403);
    }
    expect(await Comment.countDocuments()).toBe(0);
  });

  it('admin dapat berkomentar di task mana pun', async () => {
    const { admin, task } = await withTask();
    const res = await api().post(`/api/tasks/${task._id}/comments`).set(admin.headers).send({ content: 'Dari admin' });

    expect(res.status).toBe(201);
  });

  it.each([
    ['kosong', ''],
    ['hanya spasi', '     '],
    ['lebih dari 1000 karakter', 'x'.repeat(1001)],
  ])('menolak komentar %s (400)', async (_label, content) => {
    const { budi, task } = await withTask();
    const res = await api().post(`/api/tasks/${task._id}/comments`).set(budi.headers).send({ content });

    expect(res.status).toBe(400);
  });

  it('menerima komentar tepat 1000 karakter', async () => {
    const { budi, task } = await withTask();
    const res = await api().post(`/api/tasks/${task._id}/comments`).set(budi.headers).send({ content: 'x'.repeat(1000) });

    expect(res.status).toBe(201);
  });

  it('mengembalikan 404 untuk task yang tidak ada', async () => {
    const { budi } = await withTask();
    const res = await api().post('/api/tasks/64b7f0f5e1b2c3a4d5e6f708/comments').set(budi.headers).send({ content: 'Halo' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/tasks/:id/comments', () => {
  it('menampilkan komentar dari yang terlama ke terbaru, lengkap dengan nama penulis', async () => {
    const { manager, budi, task } = await withTask();
    await createComment(budi, task._id, 'Pertama');
    await createComment(manager, task._id, 'Kedua');

    const res = await api().get(`/api/tasks/${task._id}/comments`).set(budi.headers);

    expect(res.status).toBe(200);
    expect(res.body.data.comments.map((c) => c.content)).toEqual(['Pertama', 'Kedua']);
    expect(res.body.data.comments[1].user.name).toBe('Manager');
  });

  it('orang di luar project tidak dapat membaca komentar (403)', async () => {
    const { outsider, task } = await withTask();
    const res = await api().get(`/api/tasks/${task._id}/comments`).set(outsider.headers);

    expect(res.status).toBe(403);
  });

  it('anggota yang sudah dikeluarkan kehilangan akses ke komentar', async () => {
    const { manager, budi, task, projectId } = await withTask();
    await createComment(budi, task._id);
    await api().delete(`/api/projects/${projectId}/members/${budi.id}`).set(manager.headers);

    const res = await api().get(`/api/tasks/${task._id}/comments`).set(budi.headers);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/comments/:id', () => {
  it('penulis dapat mengedit komentarnya sendiri', async () => {
    const { budi, task } = await withTask();
    const comment = await createComment(budi, task._id, 'Typo');
    const res = await api().put(`/api/comments/${comment._id}`).set(budi.headers).send({ content: 'Sudah diperbaiki' });

    expect(res.status).toBe(200);
    expect((await Comment.findById(comment._id)).content).toBe('Sudah diperbaiki');
  });

  it('komentar orang lain tidak dapat diedit, bahkan oleh manager maupun admin (403)', async () => {
    const { manager, admin, budi, task } = await withTask();
    const comment = await createComment(budi, task._id, 'Asli');

    for (const actor of [manager, admin]) {
      const res = await api().put(`/api/comments/${comment._id}`).set(actor.headers).send({ content: 'Dipalsukan' });
      expect(res.status).toBe(403);
    }
    expect((await Comment.findById(comment._id)).content).toBe('Asli');
  });

  it('menolak isi kosong (400) dan id yang tidak ada (404)', async () => {
    const { budi, task } = await withTask();
    const comment = await createComment(budi, task._id);

    expect((await api().put(`/api/comments/${comment._id}`).set(budi.headers).send({ content: '' })).status).toBe(400);
    expect((await api().put('/api/comments/64b7f0f5e1b2c3a4d5e6f708').set(budi.headers).send({ content: 'x' })).status).toBe(404);
  });
});

describe('DELETE /api/comments/:id', () => {
  it('penulis dapat menghapus komentarnya sendiri', async () => {
    const { budi, task } = await withTask();
    const comment = await createComment(budi, task._id);
    const res = await api().delete(`/api/comments/${comment._id}`).set(budi.headers);

    expect(res.status).toBe(200);
    expect(await Comment.countDocuments()).toBe(0);
  });

  it('member lain tidak dapat menghapus komentar orang lain (403)', async () => {
    const { budi, citra, task } = await withTask();
    const comment = await createComment(budi, task._id);
    const res = await api().delete(`/api/comments/${comment._id}`).set(citra.headers);

    expect(res.status).toBe(403);
    expect(await Comment.countDocuments()).toBe(1);
  });

  it('manager project pun tidak dapat menghapus komentar orang lain (hanya penulis dan admin)', async () => {
    const { manager, budi, task } = await withTask();
    const comment = await createComment(budi, task._id);
    const res = await api().delete(`/api/comments/${comment._id}`).set(manager.headers);

    expect(res.status).toBe(403);
  });

  it('admin dapat menghapus komentar siapa pun (moderasi)', async () => {
    const { admin, budi, task } = await withTask();
    const comment = await createComment(budi, task._id);
    const res = await api().delete(`/api/comments/${comment._id}`).set(admin.headers);

    expect(res.status).toBe(200);
    expect(await Comment.countDocuments()).toBe(0);
  });

  it('orang di luar project tidak dapat menghapus (403)', async () => {
    const { outsider, budi, task } = await withTask();
    const comment = await createComment(budi, task._id);
    const res = await api().delete(`/api/comments/${comment._id}`).set(outsider.headers);

    expect(res.status).toBe(403);
  });
});
