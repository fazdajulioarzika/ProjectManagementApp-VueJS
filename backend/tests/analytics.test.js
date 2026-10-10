import { describe, it, expect } from 'vitest';
import { api, createTask, createUser, createProject, createScenario, DAY } from './helpers.js';

// Tanggal "hari ini" menurut zona waktu yang dipakai backend untuk grafik tren
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const past = new Date(Date.now() - 3 * DAY).toISOString();

const analytics = (actor, query = '') => api().get(`/api/analytics${query}`).set(actor.headers);

async function withTasks() {
  const s = await createScenario();
  const { manager, budi, citra, projectId } = s;
  await createTask(manager, projectId, { title: 'A', status: 'done', priority: 'high', assignee: budi.id });
  await createTask(manager, projectId, { title: 'B', status: 'done', priority: 'medium', assignee: budi.id });
  await createTask(manager, projectId, { title: 'C', status: 'in_progress', priority: 'high', assignee: citra.id, dueDate: past });
  await createTask(manager, projectId, { title: 'D', status: 'todo', priority: 'low' });
  await createTask(manager, projectId, { title: 'E', status: 'review', priority: 'urgent', assignee: budi.id });
  return s;
}

describe('GET /api/analytics', () => {
  it('menghitung ringkasan, sebaran status, dan sebaran prioritas', async () => {
    const { manager } = await withTasks();
    const { data } = (await analytics(manager)).body;

    expect(data.summary).toEqual({ totalTasks: 5, completed: 2, overdue: 1, completionRate: 40 });
    expect(data.byStatus).toEqual({ todo: 1, in_progress: 1, review: 1, done: 2 });
    expect(data.byPriority).toEqual({ low: 1, medium: 1, high: 2, urgent: 1 });
  });

  it('menampilkan beban kerja per anggota, termasuk yang belum ditugaskan', async () => {
    const { manager } = await withTasks();
    const { byAssignee } = (await analytics(manager)).body.data;

    expect(byAssignee.find((r) => r.name === 'Budi')).toMatchObject({ total: 3, done: 2 });
    expect(byAssignee.find((r) => r.name === 'Citra')).toMatchObject({ total: 1, done: 0 });
    expect(byAssignee.find((r) => r.name === null)).toMatchObject({ total: 1, done: 0 });
    expect(byAssignee[0].name).toBe('Budi'); // diurutkan dari beban terbesar
  });

  it('tren penyelesaian memuat satu titik per hari dan menghitung task yang baru diselesaikan', async () => {
    const { manager, budi, projectId } = await createScenario();
    const task = await createTask(manager, projectId, { assignee: budi.id });
    await api().patch(`/api/tasks/${task._id}/status`).set(budi.headers).send({ status: 'done' });

    const { completedPerDay } = (await analytics(manager)).body.data;

    expect(completedPerDay).toHaveLength(14);
    expect(completedPerDay.at(-1)).toEqual({ date: todayKey(), count: 1 });
    expect(completedPerDay.slice(0, -1).every((d) => d.count === 0)).toBe(true);
  });

  it('parameter days: 7 dan 30 diterima, nilai lain kembali ke 14', async () => {
    const { manager } = await createScenario();

    expect((await analytics(manager, '?days=7')).body.data.completedPerDay).toHaveLength(7);
    expect((await analytics(manager, '?days=30')).body.data.completedPerDay).toHaveLength(30);
    expect((await analytics(manager, '?days=500')).body.data.completedPerDay).toHaveLength(14);
  });

  it('dapat dibatasi ke satu project', async () => {
    const { manager, projectId } = await withTasks();
    const second = await createProject(manager, { name: 'Project Kedua' });
    await createTask(manager, second._id, { title: 'Hanya di kedua' });

    const all = (await analytics(manager)).body.data;
    const one = (await analytics(manager, `?project=${projectId}`)).body.data;

    expect(all.summary.totalTasks).toBe(6);
    expect(one.summary.totalTasks).toBe(5);
    expect(one.projects).toHaveLength(2); // daftar pilihan tetap lengkap
  });

  it('project yang tidak dapat diakses ditolak (404), dan tidak masuk daftar pilihan', async () => {
    const { budi, otherManager } = await createScenario();
    const other = await createProject(otherManager, { name: 'Rahasia' });

    const res = await analytics(budi, `?project=${other._id}`);
    expect(res.status).toBe(404);

    const ok = await analytics(budi);
    expect(ok.body.data.projects.map((p) => p.name)).toEqual(['HRIS']);
  });

  it('tidak menghitung task dari project yang tidak diikuti', async () => {
    const { budi, otherManager } = await withTasks();
    const other = await createProject(otherManager, { name: 'Lain' });
    await createTask(otherManager, other._id, { title: 'Tidak boleh terhitung' });

    const { data } = (await analytics(budi)).body;

    expect(data.summary.totalTasks).toBe(5);
  });

  it('user tanpa project mendapat angka nol, bukan error', async () => {
    const fresh = await createUser();
    const { data } = (await analytics(fresh)).body;

    expect(data.summary).toEqual({ totalTasks: 0, completed: 0, overdue: 0, completionRate: 0 });
    expect(data.byAssignee).toEqual([]);
  });
});
