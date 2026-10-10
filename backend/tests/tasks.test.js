import { describe, it, expect } from 'vitest';
import { api, createProject, createTask, createComment, createScenario, findActivities } from './helpers.js';
import User from '../src/models/User.js';
import Task from '../src/models/Task.js';
import Comment from '../src/models/Comment.js';
import Notification from '../src/models/Notification.js';

const patchStatus = (actor, taskId, status) =>
  api().patch(`/api/tasks/${taskId}/status`).set(actor.headers).send({ status });

// Skenario + satu task yang ditugaskan ke Budi
async function withTask() {
  const s = await createScenario();
  const task = await createTask(s.manager, s.projectId, { title: 'Login Page', assignee: s.budi.id });
  return { ...s, task };
}

describe('POST /api/projects/:id/tasks', () => {
  it('manager membuat task dengan nilai default dan activity task.created', async () => {
    const { manager, projectId } = await createScenario();
    const res = await api().post(`/api/projects/${projectId}/tasks`).set(manager.headers).send({ title: 'Setup CI' });

    expect(res.status).toBe(201);
    expect(res.body.data.task).toMatchObject({ title: 'Setup CI', status: 'todo', priority: 'medium', assignee: null, dueDate: null });
    expect(res.body.data.task.createdBy.name).toBe('Manager');

    const logs = await findActivities(projectId, 'task.created');
    expect(logs).toHaveLength(1);
    expect(logs[0].target).toBe('Setup CI');
  });

  it('admin dapat membuat task di project mana pun', async () => {
    const { admin, projectId } = await createScenario();
    const res = await api().post(`/api/projects/${projectId}/tasks`).set(admin.headers).send({ title: 'Oleh Admin' });

    expect(res.status).toBe(201);
  });

  it('member biasa tidak boleh membuat task (403)', async () => {
    const { budi, projectId } = await createScenario();
    const res = await api().post(`/api/projects/${projectId}/tasks`).set(budi.headers).send({ title: 'X' });

    expect(res.status).toBe(403);
    expect(await Task.countDocuments()).toBe(0);
  });

  it('orang di luar project dan manager di luar project ditolak (403)', async () => {
    const { outsider, otherManager, projectId } = await createScenario();

    for (const actor of [outsider, otherManager]) {
      const res = await api().post(`/api/projects/${projectId}/tasks`).set(actor.headers).send({ title: 'X' });
      expect(res.status).toBe(403);
    }
  });

  it('menugaskan ke anggota: assignee ter-populate, tercatat task.assigned, dan anggota diberi notifikasi', async () => {
    const { manager, budi, projectId } = await createScenario();
    const task = await createTask(manager, projectId, { title: 'Tugas Budi', assignee: budi.id });

    expect(task.assignee.name).toBe('Budi');

    const logs = await findActivities(projectId, 'task.assigned');
    expect(logs).toHaveLength(1);
    expect(logs[0].metadata.assignee).toBe('Budi');

    const notes = await Notification.find({ user: budi.id });
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ type: 'task.assigned', read: false });
    expect(notes[0].message).toContain('Tugas Budi');
  });

  it('tidak membuat notifikasi saat manager menugaskan task kepada dirinya sendiri', async () => {
    const { manager, projectId } = await createScenario();
    await createTask(manager, projectId, { assignee: manager.id });

    expect(await Notification.countDocuments()).toBe(0);
  });

  it.each([
    ['judul kosong', { title: '' }],
    ['status tidak valid', { status: 'ngawur' }],
    ['priority tidak valid', { priority: 'super' }],
    ['id assignee tidak valid', { assignee: 'bukan-id' }],
    ['format due date tidak valid', { dueDate: 'kemarin sore' }],
  ])('menolak %s dengan 400', async (_label, override) => {
    const { manager, projectId } = await createScenario();
    const res = await api()
      .post(`/api/projects/${projectId}/tasks`)
      .set(manager.headers)
      .send({ title: 'Valid', ...override });

    expect(res.status).toBe(400);
  });
});

describe('membaca task', () => {
  it('anggota project dapat melihat daftar task, dan dapat menyaring', async () => {
    const { manager, budi, citra, projectId } = await createScenario();
    await createTask(manager, projectId, { title: 'A', status: 'done', priority: 'high', assignee: budi.id });
    await createTask(manager, projectId, { title: 'B', status: 'todo', priority: 'low', assignee: citra.id });
    await createTask(manager, projectId, { title: 'C', status: 'todo', priority: 'high' });

    const all = await api().get(`/api/projects/${projectId}/tasks`).set(budi.headers);
    expect(all.body.count).toBe(3);

    const byStatus = await api().get(`/api/projects/${projectId}/tasks?status=todo`).set(budi.headers);
    expect(byStatus.body.data.tasks.map((t) => t.title).sort()).toEqual(['B', 'C']);

    const byPriority = await api().get(`/api/projects/${projectId}/tasks?priority=high`).set(budi.headers);
    expect(byPriority.body.data.tasks.map((t) => t.title).sort()).toEqual(['A', 'C']);

    const byAssignee = await api().get(`/api/projects/${projectId}/tasks?assignee=${citra.id}`).set(budi.headers);
    expect(byAssignee.body.data.tasks.map((t) => t.title)).toEqual(['B']);
  });

  it('orang di luar project tidak dapat melihat daftar maupun detail task (403)', async () => {
    const { outsider, task, projectId } = await withTask();

    expect((await api().get(`/api/projects/${projectId}/tasks`).set(outsider.headers)).status).toBe(403);
    expect((await api().get(`/api/tasks/${task._id}`).set(outsider.headers)).status).toBe(403);
  });

  it('detail task: anggota 200, id tidak ada 404', async () => {
    const { budi, task } = await withTask();

    const ok = await api().get(`/api/tasks/${task._id}`).set(budi.headers);
    expect(ok.status).toBe(200);
    expect(ok.body.data.task.project.name).toBe('HRIS');

    const missing = await api().get('/api/tasks/64b7f0f5e1b2c3a4d5e6f708').set(budi.headers);
    expect(missing.status).toBe(404);
  });

  it('data assignee tidak membawa avatar, agar respons tetap ringan', async () => {
    const { manager, budi, projectId } = await createScenario();
    await User.updateOne({ _id: budi.id }, { avatar: 'data:image/png;base64,iVBORw0KGgo=' });
    await createTask(manager, projectId, { assignee: budi.id });

    const res = await api().get(`/api/projects/${projectId}/tasks`).set(manager.headers);

    expect(res.body.data.tasks[0].assignee.name).toBe('Budi');
    expect(res.body.data.tasks[0].assignee).not.toHaveProperty('avatar');
  });
});

describe('PATCH /api/tasks/:id/status', () => {
  it('assignee dapat memindahkan task miliknya, dan perpindahan tercatat dengan status asal dan tujuan', async () => {
    const { budi, task, projectId } = await withTask();
    const res = await patchStatus(budi, task._id, 'in_progress');

    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('in_progress');

    const logs = await findActivities(projectId, 'task.moved');
    expect(logs).toHaveLength(1);
    expect(logs[0].metadata).toMatchObject({ from: 'todo', to: 'in_progress' });
    expect(String(logs[0].user)).toBe(budi.id);
  });

  it('menyelesaikan task dicatat sebagai task.completed', async () => {
    const { budi, task, projectId } = await withTask();
    await patchStatus(budi, task._id, 'done');

    expect(await findActivities(projectId, 'task.completed')).toHaveLength(1);
    expect(await findActivities(projectId, 'task.moved')).toHaveLength(0);
  });

  it('anggota lain yang bukan assignee ditolak (403) dan status tidak berubah', async () => {
    const { citra, task } = await withTask();
    const res = await patchStatus(citra, task._id, 'done');

    expect(res.status).toBe(403);
    expect((await Task.findById(task._id)).status).toBe('todo');
  });

  it('member tidak dapat memindahkan task yang belum ditugaskan', async () => {
    const { manager, budi, projectId } = await createScenario();
    const free = await createTask(manager, projectId, { title: 'Belum ada yang pegang' });

    expect((await patchStatus(budi, free._id, 'done')).status).toBe(403);
  });

  it('manager dan admin dapat memindahkan task siapa pun', async () => {
    const { manager, admin, task } = await withTask();

    expect((await patchStatus(manager, task._id, 'review')).status).toBe(200);
    expect((await patchStatus(admin, task._id, 'done')).status).toBe(200);
  });

  it('orang di luar project ditolak (403)', async () => {
    const { outsider, otherManager, task } = await withTask();

    expect((await patchStatus(outsider, task._id, 'done')).status).toBe(403);
    expect((await patchStatus(otherManager, task._id, 'done')).status).toBe(403);
  });

  it('menolak status yang tidak valid (400)', async () => {
    const { budi, task } = await withTask();
    expect((await patchStatus(budi, task._id, 'selesai-banget')).status).toBe(400);
  });

  it('tidak mencatat activity jika status tidak berubah', async () => {
    const { budi, task, projectId } = await withTask();
    await patchStatus(budi, task._id, 'todo');

    expect(await findActivities(projectId, 'task.moved')).toHaveLength(0);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('manager dapat mengubah semua field', async () => {
    const { manager, task } = await withTask();
    const due = '2026-12-31T00:00:00.000Z';
    const res = await api().put(`/api/tasks/${task._id}`).set(manager.headers).send({
      title: 'Judul Baru', description: 'Deskripsi', priority: 'urgent', status: 'review', dueDate: due,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.task).toMatchObject({ title: 'Judul Baru', description: 'Deskripsi', priority: 'urgent', status: 'review' });
    expect(new Date(res.body.data.task.dueDate).toISOString()).toBe(due);
  });

  it('assignee biasa hanya dapat mengubah deskripsi dan status, field lain diabaikan', async () => {
    const { budi, citra, task } = await withTask();
    const res = await api().put(`/api/tasks/${task._id}`).set(budi.headers).send({
      title: 'Diretas', priority: 'urgent', assignee: citra.id, dueDate: '2030-01-01',
      description: 'Catatan Budi', status: 'in_progress',
    });

    expect(res.status).toBe(200);
    const stored = await Task.findById(task._id);
    expect(stored.description).toBe('Catatan Budi');
    expect(stored.status).toBe('in_progress');
    expect(stored.title).toBe('Login Page');
    expect(stored.priority).toBe('medium');
    expect(String(stored.assignee)).toBe(budi.id);
    expect(stored.dueDate).toBeNull();
  });

  it('member yang bukan assignee ditolak (403)', async () => {
    const { citra, task } = await withTask();
    const res = await api().put(`/api/tasks/${task._id}`).set(citra.headers).send({ description: 'X' });

    expect(res.status).toBe(403);
  });

  it('menugaskan ulang: tercatat task.assigned dan assignee baru diberi notifikasi', async () => {
    const { manager, citra, task, projectId } = await withTask();
    await api().put(`/api/tasks/${task._id}`).set(manager.headers).send({ assignee: citra.id });

    expect(await findActivities(projectId, 'task.assigned')).toHaveLength(2); // saat dibuat + saat dialihkan
    const notes = await Notification.find({ user: citra.id });
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toContain('Login Page');
  });

  it('menolak penugasan kepada orang di luar project', async () => {
    const { manager, outsider, task } = await withTask();
    const res = await api().put(`/api/tasks/${task._id}`).set(manager.headers).send({ assignee: outsider.id });

    expect(res.status).toBe(400);
  });

  it('assignee null melepas penugasan', async () => {
    const { manager, task } = await withTask();
    const res = await api().put(`/api/tasks/${task._id}`).set(manager.headers).send({ assignee: null });

    expect(res.status).toBe(200);
    expect(res.body.data.task.assignee).toBeNull();
  });

  it('mengubah field lain tidak membuat notifikasi atau activity penugasan baru', async () => {
    const { manager, budi, task, projectId } = await withTask();
    await api().put(`/api/tasks/${task._id}`).set(manager.headers).send({ title: 'Ganti judul saja' });

    expect(await Notification.countDocuments({ user: budi.id })).toBe(1);
    expect(await findActivities(projectId, 'task.assigned')).toHaveLength(1);
  });

  it('orang di luar project ditolak (403)', async () => {
    const { outsider, task } = await withTask();
    const res = await api().put(`/api/tasks/${task._id}`).set(outsider.headers).send({ title: 'X' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('manager menghapus task beserta komentar dan notifikasinya, dan tercatat task.deleted', async () => {
    const { manager, budi, task, projectId } = await withTask();
    await createComment(budi, task._id);

    const res = await api().delete(`/api/tasks/${task._id}`).set(manager.headers);

    expect(res.status).toBe(200);
    expect(await Task.countDocuments()).toBe(0);
    expect(await Comment.countDocuments()).toBe(0);
    expect(await Notification.countDocuments({ task: task._id })).toBe(0);
    expect(await findActivities(projectId, 'task.deleted')).toHaveLength(1);
  });

  it('admin dapat menghapus task', async () => {
    const { admin, task } = await withTask();
    expect((await api().delete(`/api/tasks/${task._id}`).set(admin.headers)).status).toBe(200);
  });

  it('assignee (member biasa) dan orang luar tidak boleh menghapus (403)', async () => {
    const { budi, outsider, task } = await withTask();

    expect((await api().delete(`/api/tasks/${task._id}`).set(budi.headers)).status).toBe(403);
    expect((await api().delete(`/api/tasks/${task._id}`).set(outsider.headers)).status).toBe(403);
    expect(await Task.countDocuments()).toBe(1);
  });

  it('mengembalikan 404 untuk task yang tidak ada', async () => {
    const { manager } = await createScenario();
    const res = await api().delete('/api/tasks/64b7f0f5e1b2c3a4d5e6f708').set(manager.headers);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/tasks (lintas project)', () => {
  it('hanya menampilkan task dari project yang diikuti, admin melihat semuanya', async () => {
    const { admin, manager, budi, outsider, otherManager, projectId } = await createScenario();
    await createTask(manager, projectId, { title: 'Di HRIS 1' });
    await createTask(manager, projectId, { title: 'Di HRIS 2' });
    const other = await createProject(otherManager, { name: 'Project Lain' });
    await createTask(otherManager, other._id, { title: 'Di project lain' });

    const asBudi = await api().get('/api/tasks').set(budi.headers);
    const asOutsider = await api().get('/api/tasks').set(outsider.headers);
    const asAdmin = await api().get('/api/tasks').set(admin.headers);

    expect(asBudi.body.data.tasks.map((t) => t.title).sort()).toEqual(['Di HRIS 1', 'Di HRIS 2']);
    expect(asOutsider.body.count).toBe(0);
    expect(asAdmin.body.count).toBe(3);
  });

  it('menyertakan nama project pada setiap task', async () => {
    const { manager, projectId } = await createScenario();
    await createTask(manager, projectId);
    const res = await api().get('/api/tasks').set(manager.headers);

    expect(res.body.data.tasks[0].project.name).toBe('HRIS');
  });

  it('menyaring berdasarkan rentang due date (from inklusif, to eksklusif) dan mengurutkannya', async () => {
    const { manager, projectId } = await createScenario();
    await createTask(manager, projectId, { title: 'C', dueDate: '2026-03-20T00:00:00.000Z' });
    await createTask(manager, projectId, { title: 'A', dueDate: '2026-03-10T00:00:00.000Z' });
    await createTask(manager, projectId, { title: 'B', dueDate: '2026-03-15T00:00:00.000Z' });
    await createTask(manager, projectId, { title: 'Tanpa due' });

    const res = await api()
      .get('/api/tasks')
      .query({ from: '2026-03-10T00:00:00.000Z', to: '2026-03-20T00:00:00.000Z' })
      .set(manager.headers);

    expect(res.body.data.tasks.map((t) => t.title)).toEqual(['A', 'B']);
  });

  it('menolak parameter tanggal yang tidak valid (400)', async () => {
    const { manager } = await createScenario();
    const res = await api().get('/api/tasks?from=bukan-tanggal').set(manager.headers);

    expect(res.status).toBe(400);
  });

  it('filter project: yang tidak dapat diakses 404, yang dapat diakses hanya menampilkan project itu', async () => {
    const { manager, budi, otherManager, projectId } = await createScenario();
    const other = await createProject(otherManager, { name: 'Project Lain' });
    await createTask(manager, projectId, { title: 'Milik HRIS' });
    await createTask(otherManager, other._id, { title: 'Milik Lain' });

    const forbidden = await api().get(`/api/tasks?project=${other._id}`).set(budi.headers);
    expect(forbidden.status).toBe(404);

    const ok = await api().get(`/api/tasks?project=${projectId}`).set(budi.headers);
    expect(ok.body.data.tasks.map((t) => t.title)).toEqual(['Milik HRIS']);
  });
});

describe('GET /api/projects/:id/activities', () => {
  it('anggota dapat melihat riwayat, terbaru lebih dulu, lengkap dengan nama pelaku', async () => {
    const { manager, budi, projectId } = await createScenario();
    const task = await createTask(manager, projectId, { title: 'Dilacak', assignee: budi.id });
    await patchStatus(budi, task._id, 'in_progress');

    const res = await api().get(`/api/projects/${projectId}/activities`).set(budi.headers);

    expect(res.status).toBe(200);
    const items = res.body.data.activities;
    expect(items.length).toBeGreaterThanOrEqual(4); // project.created, task.created, task.assigned, task.moved
    expect(items[0].user.name).toBeDefined();
    const times = items.map((a) => new Date(a.createdAt).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it('mendukung halaman: hasMore menunjukkan masih ada data', async () => {
    const { manager, projectId } = await createScenario();
    for (const t of ['T1', 'T2', 'T3']) await createTask(manager, projectId, { title: t });
    // total 4 aktivitas: 1 project.created + 3 task.created

    const page1 = await api().get(`/api/projects/${projectId}/activities?limit=2&page=1`).set(manager.headers);
    const page2 = await api().get(`/api/projects/${projectId}/activities?limit=2&page=2`).set(manager.headers);

    expect(page1.body.data.activities).toHaveLength(2);
    expect(page1.body.data.hasMore).toBe(true);
    expect(page2.body.data.activities).toHaveLength(2);
    expect(page2.body.data.hasMore).toBe(false);
  });

  it('orang di luar project tidak dapat melihat riwayat (403)', async () => {
    const { outsider, projectId } = await createScenario();
    const res = await api().get(`/api/projects/${projectId}/activities`).set(outsider.headers);

    expect(res.status).toBe(403);
  });
});
