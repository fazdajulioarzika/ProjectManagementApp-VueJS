import { describe, it, expect } from 'vitest';
import { api, createUser, createTask, createScenario, findActivities } from './helpers.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';

const add = (actor, projectId, body) =>
  api().post(`/api/projects/${projectId}/members`).set(actor.headers).send(body);
const remove = (actor, projectId, userId) =>
  api().delete(`/api/projects/${projectId}/members/${userId}`).set(actor.headers);

describe('POST /api/projects/:id/members', () => {
  it('manager menambah anggota: anggota baru langsung punya akses', async () => {
    const { manager, outsider, projectId } = await createScenario();

    const before = await api().get(`/api/projects/${projectId}`).set(outsider.headers);
    expect(before.status).toBe(403);

    const res = await add(manager, projectId, { user: outsider.id, title: 'QA Engineer' });
    expect(res.status).toBe(201);

    const after = await api().get(`/api/projects/${projectId}`).set(outsider.headers);
    expect(after.status).toBe(200);
    expect(after.body.data.project.members.find((m) => m.user._id === outsider.id).title).toBe('QA Engineer');
  });

  it('jabatan default adalah Member', async () => {
    const { manager, outsider, projectId } = await createScenario();
    await add(manager, projectId, { user: outsider.id });

    const stored = await Project.findById(projectId);
    expect(stored.members.find((m) => String(m.user) === outsider.id).title).toBe('Member');
  });

  it('mencatat activity member.added dengan nama anggota', async () => {
    const { manager, outsider, projectId } = await createScenario();
    await add(manager, projectId, { user: outsider.id });

    const logs = await findActivities(projectId, 'member.added');
    expect(logs).toHaveLength(1);
    expect(logs[0].target).toBe('Outsider');
  });

  it('admin dapat menambah anggota ke project mana pun', async () => {
    const { admin, outsider, projectId } = await createScenario();
    const res = await add(admin, projectId, { user: outsider.id });

    expect(res.status).toBe(201);
  });

  it('menolak anggota yang sudah ada dengan 409', async () => {
    const { manager, budi, projectId } = await createScenario();
    const res = await add(manager, projectId, { user: budi.id });

    expect(res.status).toBe(409);
  });

  it('menolak user yang tidak ada (404) dan id yang formatnya salah (400)', async () => {
    const { manager, projectId } = await createScenario();

    expect((await add(manager, projectId, { user: '64b7f0f5e1b2c3a4d5e6f708' })).status).toBe(404);
    expect((await add(manager, projectId, { user: 'bukan-id' })).status).toBe(400);
  });

  it('member biasa tidak boleh menambah anggota (403)', async () => {
    const { budi, outsider, projectId } = await createScenario();
    const res = await add(budi, projectId, { user: outsider.id });

    expect(res.status).toBe(403);
    expect((await Project.findById(projectId)).members).toHaveLength(3);
  });

  it('manager di luar project tidak boleh menambah anggota (403)', async () => {
    const { otherManager, outsider, projectId } = await createScenario();
    const res = await add(otherManager, projectId, { user: outsider.id });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/projects/:id/members/:userId', () => {
  it('manager mengeluarkan anggota: akses hilang dan task miliknya menjadi belum ditugaskan', async () => {
    const { manager, budi, projectId } = await createScenario();
    const task = await createTask(manager, projectId, { assignee: budi.id });

    const res = await remove(manager, projectId, budi.id);
    expect(res.status).toBe(200);

    expect((await Task.findById(task._id)).assignee).toBeNull();
    const access = await api().get(`/api/projects/${projectId}`).set(budi.headers);
    expect(access.status).toBe(403);
  });

  it('hanya task milik anggota yang dikeluarkan yang dilepas', async () => {
    const { manager, budi, citra, projectId } = await createScenario();
    await createTask(manager, projectId, { title: 'Milik Budi', assignee: budi.id });
    const keep = await createTask(manager, projectId, { title: 'Milik Citra', assignee: citra.id });

    await remove(manager, projectId, budi.id);

    expect(String((await Task.findById(keep._id)).assignee)).toBe(citra.id);
  });

  it('mencatat activity member.removed', async () => {
    const { manager, budi, projectId } = await createScenario();
    await remove(manager, projectId, budi.id);

    const logs = await findActivities(projectId, 'member.removed');
    expect(logs).toHaveLength(1);
    expect(logs[0].target).toBe('Budi');
  });

  it('owner tidak dapat dikeluarkan', async () => {
    const { manager, projectId } = await createScenario();
    const res = await remove(manager, projectId, manager.id);

    expect(res.status).toBe(400);
    expect((await Project.findById(projectId)).members).toHaveLength(3);
  });

  it('admin pun tidak dapat mengeluarkan owner', async () => {
    const { admin, manager, projectId } = await createScenario();
    const res = await remove(admin, projectId, manager.id);

    expect(res.status).toBe(400);
  });

  it('menolak user yang bukan anggota (404)', async () => {
    const { manager, outsider, projectId } = await createScenario();
    const res = await remove(manager, projectId, outsider.id);

    expect(res.status).toBe(404);
  });

  it('member biasa tidak boleh mengeluarkan anggota, termasuk dirinya lewat endpoint ini (403)', async () => {
    const { budi, citra, projectId } = await createScenario();

    expect((await remove(budi, projectId, citra.id)).status).toBe(403);
    expect((await remove(budi, projectId, budi.id)).status).toBe(403);
  });

  it('menolak id yang formatnya salah', async () => {
    const { manager, projectId } = await createScenario();
    const res = await remove(manager, projectId, 'bukan-id');

    expect(res.status).toBe(400);
  });
});

describe('aturan assignee harus anggota project', () => {
  it('task tidak dapat ditugaskan kepada orang di luar project', async () => {
    const { manager, outsider, projectId } = await createScenario();
    const res = await api()
      .post(`/api/projects/${projectId}/tasks`)
      .set(manager.headers)
      .send({ title: 'X', assignee: outsider.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Assignee harus anggota project');
  });

  it('setelah ditambahkan sebagai anggota, orang itu boleh ditugaskan', async () => {
    const { manager, projectId } = await createScenario();
    const newbie = await createUser({ name: 'Newbie' });
    await add(manager, projectId, { user: newbie.id });

    const res = await api()
      .post(`/api/projects/${projectId}/tasks`)
      .set(manager.headers)
      .send({ title: 'X', assignee: newbie.id });

    expect(res.status).toBe(201);
  });
});
