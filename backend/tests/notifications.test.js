import { describe, it, expect } from 'vitest';
import { api, createTask, createScenario, daysFromNow } from './helpers.js';
import Notification from '../src/models/Notification.js';

const list = (actor) => api().get('/api/notifications').set(actor.headers);

describe('notifikasi penugasan', () => {
  it('assignee menerima notifikasi belum dibaca saat ditugaskan', async () => {
    const { manager, budi, projectId } = await createScenario();
    await createTask(manager, projectId, { title: 'Kerjakan ini', assignee: budi.id });

    const res = await list(budi);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(1);
    expect(res.body.data.notifications[0]).toMatchObject({ type: 'task.assigned', read: false });
    expect(res.body.data.notifications[0].message).toContain('Kerjakan ini');
  });

  it('setiap user hanya melihat notifikasinya sendiri', async () => {
    const { manager, budi, citra, projectId } = await createScenario();
    await createTask(manager, projectId, { assignee: budi.id });

    const asCitra = await list(citra);
    const asManager = await list(manager);

    expect(asCitra.body.data.notifications).toEqual([]);
    expect(asManager.body.data.notifications).toEqual([]);
  });
});

describe('menandai dibaca', () => {
  it('menandai satu notifikasi mengurangi jumlah belum dibaca', async () => {
    const { manager, budi, projectId } = await createScenario();
    await createTask(manager, projectId, { title: 'A', assignee: budi.id });
    await createTask(manager, projectId, { title: 'B', assignee: budi.id });

    const before = await list(budi);
    expect(before.body.data.unreadCount).toBe(2);

    const id = before.body.data.notifications[0]._id;
    const res = await api().patch(`/api/notifications/${id}/read`).set(budi.headers);
    expect(res.status).toBe(200);
    expect(res.body.data.notification.read).toBe(true);

    expect((await list(budi)).body.data.unreadCount).toBe(1);
  });

  it('tidak dapat menandai notifikasi milik orang lain (404) dan notifikasi itu tetap belum dibaca', async () => {
    const { manager, budi, citra, projectId } = await createScenario();
    await createTask(manager, projectId, { assignee: budi.id });
    const note = await Notification.findOne({ user: budi.id });

    const res = await api().patch(`/api/notifications/${note._id}/read`).set(citra.headers);

    expect(res.status).toBe(404);
    expect((await Notification.findById(note._id)).read).toBe(false);
  });

  it('menolak id yang formatnya salah (400)', async () => {
    const { budi } = await createScenario();
    const res = await api().patch('/api/notifications/bukan-id/read').set(budi.headers);

    expect(res.status).toBe(400);
  });

  it('"tandai semua dibaca" hanya memengaruhi notifikasi milik sendiri', async () => {
    const { manager, budi, citra, projectId } = await createScenario();
    await createTask(manager, projectId, { assignee: budi.id });
    await createTask(manager, projectId, { assignee: budi.id });
    await createTask(manager, projectId, { assignee: citra.id });

    const res = await api().patch('/api/notifications/read-all').set(budi.headers);

    expect(res.status).toBe(200);
    expect((await list(budi)).body.data.unreadCount).toBe(0);
    expect((await list(citra)).body.data.unreadCount).toBe(1);
  });
});

describe('notifikasi deadline (dibuat saat notifikasi dibuka)', () => {
  const deadlineNotes = (user) => Notification.find({ user: user.id, type: 'task.deadline' });

  it('task belum selesai yang jatuh tempo dalam 3 hari memunculkan satu notifikasi deadline', async () => {
    const { manager, budi, projectId } = await createScenario();
    await createTask(manager, projectId, { assignee: budi.id, dueDate: daysFromNow(1) });

    const res = await list(budi);
    const deadline = res.body.data.notifications.find((n) => n.type === 'task.deadline');

    expect(deadline.message).toBe('Anda memiliki 1 task yang mendekati deadline');
  });

  it('membuka notifikasi berulang kali tidak menggandakan, tetapi memperbarui jumlahnya', async () => {
    const { manager, budi, projectId } = await createScenario();
    await createTask(manager, projectId, { assignee: budi.id, dueDate: daysFromNow(1) });
    await list(budi);
    await list(budi);
    expect(await deadlineNotes(budi)).toHaveLength(1);

    await createTask(manager, projectId, { assignee: budi.id, dueDate: daysFromNow(2) });
    await list(budi);

    const notes = await deadlineNotes(budi);
    expect(notes).toHaveLength(1);
    expect(notes[0].message).toBe('Anda memiliki 2 task yang mendekati deadline');
  });

  it('task selesai, deadline jauh, atau milik orang lain tidak dihitung', async () => {
    const { manager, budi, citra, projectId } = await createScenario();
    await createTask(manager, projectId, { assignee: budi.id, dueDate: daysFromNow(1), status: 'done' });
    await createTask(manager, projectId, { assignee: budi.id, dueDate: daysFromNow(10) });
    await createTask(manager, projectId, { assignee: citra.id, dueDate: daysFromNow(1) });

    await list(budi);

    expect(await deadlineNotes(budi)).toHaveLength(0);
    await list(citra);
    expect(await deadlineNotes(citra)).toHaveLength(1);
  });
});
