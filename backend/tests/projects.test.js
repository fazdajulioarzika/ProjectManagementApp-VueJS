import { describe, it, expect } from 'vitest';
import { api, createUser, createProject, createTask, createComment, createScenario, findActivities } from './helpers.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import Comment from '../src/models/Comment.js';
import Activity from '../src/models/Activity.js';

describe('POST /api/projects', () => {
  it('member biasa tidak boleh membuat project (403)', async () => {
    const member = await createUser();
    const res = await api().post('/api/projects').set(member.headers).send({ name: 'Rahasia' });

    expect(res.status).toBe(403);
    expect(await Project.countDocuments()).toBe(0);
  });

  it('manager dapat membuat project dan otomatis menjadi owner sekaligus anggota', async () => {
    const manager = await createUser({ role: 'manager' });
    const res = await api().post('/api/projects').set(manager.headers).send({ name: 'HRIS' });

    expect(res.status).toBe(201);
    const project = res.body.data.project;
    expect(project.owner).toBe(manager.id);
    expect(project.members).toHaveLength(1);
    expect(project.members[0]).toMatchObject({ user: manager.id, title: 'Project Manager' });
    expect(project.progress).toBe(0);
  });

  it('admin dapat membuat project', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api().post('/api/projects').set(admin.headers).send({ name: 'Admin Project' });

    expect(res.status).toBe(201);
  });

  it('menyertakan anggota awal dan tidak menduplikasi owner', async () => {
    const manager = await createUser({ role: 'manager' });
    const budi = await createUser();
    const project = await createProject(manager, {
      members: [{ user: budi.id, title: 'Backend' }, { user: manager.id }, { user: budi.id }],
    });

    expect(project.members).toHaveLength(2);
    expect(project.members.find((m) => m.user === budi.id).title).toBe('Backend');
  });

  it('menolak anggota yang tidak ada di database', async () => {
    const manager = await createUser({ role: 'manager' });
    const res = await api()
      .post('/api/projects')
      .set(manager.headers)
      .send({ name: 'X', members: [{ user: '64b7f0f5e1b2c3a4d5e6f708' }] });

    expect(res.status).toBe(400);
  });

  it('menolak nama kosong', async () => {
    const manager = await createUser({ role: 'manager' });
    const res = await api().post('/api/projects').set(manager.headers).send({ name: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Nama project wajib diisi');
  });

  it('menolak tanggal selesai yang lebih awal dari tanggal mulai', async () => {
    const manager = await createUser({ role: 'manager' });
    const res = await api()
      .post('/api/projects')
      .set(manager.headers)
      .send({ name: 'X', startDate: '2026-05-10', endDate: '2026-05-01' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tanggal selesai/i);
  });

  it('menolak status yang tidak dikenal', async () => {
    const manager = await createUser({ role: 'manager' });
    const res = await api().post('/api/projects').set(manager.headers).send({ name: 'X', status: 'ngawur' });

    expect(res.status).toBe(400);
  });

  it('mencatat activity project.created', async () => {
    const manager = await createUser({ role: 'manager' });
    const project = await createProject(manager, { name: 'Dicatat' });
    const logs = await findActivities(project._id, 'project.created');

    expect(logs).toHaveLength(1);
    expect(logs[0].target).toBe('Dicatat');
    expect(String(logs[0].user)).toBe(manager.id);
  });
});

describe('GET /api/projects', () => {
  it('menampilkan hanya project yang diikuti user', async () => {
    const { budi, citra, outsider, manager, otherManager } = await createScenario();
    await createProject(otherManager, { name: 'Milik Orang Lain' });

    const asBudi = await api().get('/api/projects').set(budi.headers);
    const asCitra = await api().get('/api/projects').set(citra.headers);
    const asOutsider = await api().get('/api/projects').set(outsider.headers);
    const asManager = await api().get('/api/projects').set(manager.headers);

    expect(asBudi.body.data.projects.map((p) => p.name)).toEqual(['HRIS']);
    expect(asCitra.body.data.projects.map((p) => p.name)).toEqual(['HRIS']);
    expect(asOutsider.body.data.projects).toEqual([]);
    expect(asManager.body.data.projects).toHaveLength(1);
  });

  it('admin melihat semua project', async () => {
    const { admin, otherManager } = await createScenario();
    await createProject(otherManager, { name: 'Project Kedua' });

    const res = await api().get('/api/projects').set(admin.headers);

    expect(res.body.count).toBe(2);
  });

  it('menghitung progress dari task yang selesai', async () => {
    const { manager, budi, projectId } = await createScenario();
    await createTask(manager, projectId, { title: 'A', assignee: budi.id, status: 'done' });
    await createTask(manager, projectId, { title: 'B', status: 'todo' });
    await createTask(manager, projectId, { title: 'C', status: 'in_progress' });
    await createTask(manager, projectId, { title: 'D', status: 'done' });

    const res = await api().get('/api/projects').set(manager.headers);
    const project = res.body.data.projects[0];

    expect(project).toMatchObject({ totalTasks: 4, doneTasks: 2, progress: 50 });
  });

  it('progress 0 untuk project tanpa task', async () => {
    const { manager } = await createScenario();
    const res = await api().get('/api/projects').set(manager.headers);

    expect(res.body.data.projects[0]).toMatchObject({ totalTasks: 0, progress: 0 });
  });
});

describe('GET /api/projects/:id', () => {
  it('anggota project dapat melihat detail beserta data owner dan anggota', async () => {
    const { budi, projectId } = await createScenario();
    const res = await api().get(`/api/projects/${projectId}`).set(budi.headers);

    expect(res.status).toBe(200);
    const project = res.body.data.project;
    expect(project.owner.name).toBe('Manager');
    expect(project.members.map((m) => m.user.name).sort()).toEqual(['Budi', 'Citra', 'Manager']);
    expect(project.members[0].user).not.toHaveProperty('password');
  });

  it('bukan anggota ditolak dengan 403', async () => {
    const { outsider, projectId } = await createScenario();
    const res = await api().get(`/api/projects/${projectId}`).set(outsider.headers);

    expect(res.status).toBe(403);
  });

  it('manager yang bukan anggota juga ditolak (role manager saja tidak cukup)', async () => {
    const { otherManager, projectId } = await createScenario();
    const res = await api().get(`/api/projects/${projectId}`).set(otherManager.headers);

    expect(res.status).toBe(403);
  });

  it('admin dapat melihat project mana pun', async () => {
    const { admin, projectId } = await createScenario();
    const res = await api().get(`/api/projects/${projectId}`).set(admin.headers);

    expect(res.status).toBe(200);
  });

  it('mengembalikan 404 untuk id yang tidak ada', async () => {
    const { manager } = await createScenario();
    const res = await api().get('/api/projects/64b7f0f5e1b2c3a4d5e6f708').set(manager.headers);

    expect(res.status).toBe(404);
  });

  it('mengembalikan 400 untuk id yang formatnya salah', async () => {
    const { manager } = await createScenario();
    const res = await api().get('/api/projects/bukan-id').set(manager.headers);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('ID tidak valid');
  });
});

describe('PUT /api/projects/:id', () => {
  it('owner dapat mengubah project dan perubahan tercatat di activity', async () => {
    const { manager, projectId } = await createScenario();
    const res = await api()
      .put(`/api/projects/${projectId}`)
      .set(manager.headers)
      .send({ name: 'HRIS v2', status: 'active' });

    expect(res.status).toBe(200);
    expect(res.body.data.project).toMatchObject({ name: 'HRIS v2', status: 'active' });
    expect(await findActivities(projectId, 'project.updated')).toHaveLength(1);
  });

  it('admin dapat mengubah project mana pun', async () => {
    const { admin, projectId } = await createScenario();
    const res = await api().put(`/api/projects/${projectId}`).set(admin.headers).send({ name: 'Diubah Admin' });

    expect(res.status).toBe(200);
  });

  it('member biasa tidak boleh mengubah (403) dan data tidak berubah', async () => {
    const { budi, projectId } = await createScenario();
    const res = await api().put(`/api/projects/${projectId}`).set(budi.headers).send({ name: 'Diretas' });

    expect(res.status).toBe(403);
    expect((await Project.findById(projectId)).name).toBe('HRIS');
  });

  it('manager di luar project tidak boleh mengubah (403)', async () => {
    const { otherManager, projectId } = await createScenario();
    const res = await api().put(`/api/projects/${projectId}`).set(otherManager.headers).send({ name: 'Diretas' });

    expect(res.status).toBe(403);
  });

  it('menolak status tidak valid', async () => {
    const { manager, projectId } = await createScenario();
    const res = await api().put(`/api/projects/${projectId}`).set(manager.headers).send({ status: 'ngawur' });

    expect(res.status).toBe(400);
  });

  it('tidak dapat mengganti owner atau anggota lewat body', async () => {
    const { manager, outsider, projectId } = await createScenario();
    await api()
      .put(`/api/projects/${projectId}`)
      .set(manager.headers)
      .send({ owner: outsider.id, members: [{ user: outsider.id }] });

    const stored = await Project.findById(projectId);
    expect(String(stored.owner)).toBe(manager.id);
    expect(stored.members).toHaveLength(3);
  });

  it('tidak mencatat activity jika tidak ada yang berubah', async () => {
    const { manager, projectId } = await createScenario();
    await api().put(`/api/projects/${projectId}`).set(manager.headers).send({ name: 'HRIS' });

    expect(await findActivities(projectId, 'project.updated')).toHaveLength(0);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('hanya admin yang boleh menghapus: owner (manager) ditolak', async () => {
    const { manager, budi, projectId } = await createScenario();

    expect((await api().delete(`/api/projects/${projectId}`).set(manager.headers)).status).toBe(403);
    expect((await api().delete(`/api/projects/${projectId}`).set(budi.headers)).status).toBe(403);
    expect(await Project.countDocuments()).toBe(1);
  });

  it('admin menghapus project beserta seluruh task, komentar, dan aktivitasnya', async () => {
    const { admin, manager, budi, projectId } = await createScenario();
    const task = await createTask(manager, projectId, { assignee: budi.id });
    await createComment(budi, task._id);

    const res = await api().delete(`/api/projects/${projectId}`).set(admin.headers);

    expect(res.status).toBe(200);
    expect(await Project.countDocuments()).toBe(0);
    expect(await Task.countDocuments()).toBe(0);
    expect(await Comment.countDocuments()).toBe(0);
    expect(await Activity.countDocuments({ project: projectId })).toBe(0);
  });

  it('tidak menghapus data project lain', async () => {
    const { admin, otherManager, projectId } = await createScenario();
    const other = await createProject(otherManager, { name: 'Tetap Ada' });
    await createTask(otherManager, other._id);

    await api().delete(`/api/projects/${projectId}`).set(admin.headers);

    expect(await Project.countDocuments()).toBe(1);
    expect(await Task.countDocuments()).toBe(1);
  });

  it('mengembalikan 404 untuk project yang tidak ada', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await api().delete('/api/projects/64b7f0f5e1b2c3a4d5e6f708').set(admin.headers);

    expect(res.status).toBe(404);
  });
});
