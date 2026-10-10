import { describe, it, expect } from 'vitest';
import { api, createTask, createUser, createProject, createScenario } from './helpers.js';
import { startOfTodayUTC } from '../src/utils/dates.js';

const HOUR = 60 * 60 * 1000;
const yesterday = () => new Date(startOfTodayUTC().getTime() - 12 * HOUR).toISOString();
// Detik pertama hari ini: sudah lewat jika dibandingkan dengan jam sekarang, tetapi tetap "hari ini".
// Dengan begitu tes ini konsisten di jam berapa pun dijalankan.
const todayEarly = () => new Date(startOfTodayUTC().getTime() + 1000).toISOString();

// 4 task: selesai terlambat, belum selesai terlambat, jatuh tempo hari ini, dan tanpa due date
async function withTasks() {
  const s = await createScenario();
  const { manager, budi, citra, projectId } = s;
  await createTask(manager, projectId, { title: 'T1', assignee: budi.id, status: 'done', dueDate: yesterday() });
  await createTask(manager, projectId, { title: 'T2', assignee: budi.id, status: 'todo', dueDate: yesterday() });
  await createTask(manager, projectId, { title: 'T3', assignee: citra.id, status: 'in_progress', dueDate: todayEarly() });
  await createTask(manager, projectId, { title: 'T4', status: 'todo' });
  return s;
}

const dashboard = (actor) => api().get('/api/dashboard').set(actor.headers);

describe('GET /api/dashboard', () => {
  it('manager melihat gambaran seluruh project yang diikuti', async () => {
    const { manager } = await withTasks();
    const res = await dashboard(manager);

    expect(res.status).toBe(200);
    expect(res.body.data.scope).toBe('all');
    expect(res.body.data.stats).toEqual({ totalProjects: 1, totalTasks: 4, completed: 1, overdue: 1 });
    expect(res.body.data.recentTasks).toHaveLength(4);
  });

  it('task yang jatuh tempo hari ini belum dihitung terlambat; task selesai tidak pernah terlambat', async () => {
    const { citra, budi } = await withTasks();

    // T3 (milik citra) jatuh tempo hari ini
    expect((await dashboard(citra)).body.data.stats.overdue).toBe(0);
    // Budi: T1 selesai (tidak dihitung) dan T2 terlambat
    expect((await dashboard(budi)).body.data.stats.overdue).toBe(1);
  });

  it('member hanya melihat angka dari task yang ditugaskan kepadanya', async () => {
    const { budi } = await withTasks();
    const res = await dashboard(budi);

    expect(res.body.data.scope).toBe('mine');
    expect(res.body.data.stats).toEqual({ totalProjects: 1, totalTasks: 2, completed: 1, overdue: 1 });
    expect(res.body.data.recentTasks.map((t) => t.title).sort()).toEqual(['T1', 'T2']);
  });

  it('menampilkan progress project', async () => {
    const { manager } = await withTasks();
    const res = await dashboard(manager);

    expect(res.body.data.projectProgress[0]).toMatchObject({ name: 'HRIS', progress: 25 }); // 1 dari 4 selesai
  });

  it('admin melihat semua project, termasuk yang tidak ia ikuti', async () => {
    const { admin, otherManager } = await withTasks();
    const other = await createProject(otherManager, { name: 'Project Lain' });
    await createTask(otherManager, other._id, { title: 'T5' });

    const res = await dashboard(admin);

    expect(res.body.data.stats.totalProjects).toBe(2);
    expect(res.body.data.stats.totalTasks).toBe(5);
  });

  it('tidak membocorkan data project yang tidak diikuti', async () => {
    const { outsider } = await withTasks();
    const res = await dashboard(outsider);

    expect(res.body.data.stats).toEqual({ totalProjects: 0, totalTasks: 0, completed: 0, overdue: 0 });
    expect(res.body.data.projectProgress).toEqual([]);
    expect(res.body.data.recentTasks).toEqual([]);
  });

  it('task terbaru dibatasi 5', async () => {
    const { manager, projectId } = await createScenario();
    for (let i = 1; i <= 7; i++) await createTask(manager, projectId, { title: `Task ${i}` });

    const res = await dashboard(manager);

    expect(res.body.data.recentTasks).toHaveLength(5);
    expect(res.body.data.stats.totalTasks).toBe(7);
  });

  it('user baru tanpa project mendapat dashboard kosong, bukan error', async () => {
    const fresh = await createUser();
    const res = await dashboard(fresh);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalProjects).toBe(0);
  });
});
