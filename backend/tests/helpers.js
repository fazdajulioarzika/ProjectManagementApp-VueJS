import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Activity from '../src/models/Activity.js';
import generateToken from '../src/utils/generateToken.js';

export const api = () => request(app);

let seq = 0;

// Membuat user langsung di database, lengkap dengan header Authorization siap pakai
export async function createUser(overrides = {}) {
  seq += 1;
  const user = await User.create({
    name: `User ${seq}`,
    email: `user${seq}@test.com`,
    password: 'secret123',
    role: 'member',
    ...overrides,
  });
  return {
    user,
    id: String(user._id),
    headers: { Authorization: `Bearer ${generateToken(user._id)}` },
  };
}

// Project dan task dibuat lewat API, seperti pengguna sungguhan
export async function createProject(owner, body = {}) {
  const res = await api().post('/api/projects').set(owner.headers).send({ name: 'Project Uji', ...body });
  if (res.status !== 201) {
    throw new Error(`Gagal membuat project: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.project;
}

export async function createTask(actor, projectId, body = {}) {
  const res = await api()
    .post(`/api/projects/${projectId}/tasks`)
    .set(actor.headers)
    .send({ title: 'Task Uji', ...body });
  if (res.status !== 201) {
    throw new Error(`Gagal membuat task: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.task;
}

export async function createComment(actor, taskId, content = 'Komentar uji') {
  const res = await api().post(`/api/tasks/${taskId}/comments`).set(actor.headers).send({ content });
  if (res.status !== 201) {
    throw new Error(`Gagal membuat komentar: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.comment;
}

/**
 * Skenario standar:
 * - admin, manager (owner project), otherManager (manager di luar project)
 * - budi dan citra: member project
 * - outsider: member biasa yang BUKAN anggota project
 */
export async function createScenario() {
  const admin = await createUser({ role: 'admin', name: 'Admin' });
  const manager = await createUser({ role: 'manager', name: 'Manager' });
  const otherManager = await createUser({ role: 'manager', name: 'Other Manager' });
  const budi = await createUser({ name: 'Budi' });
  const citra = await createUser({ name: 'Citra' });
  const outsider = await createUser({ name: 'Outsider' });

  const project = await createProject(manager, {
    name: 'HRIS',
    members: [{ user: budi.id, title: 'Backend Developer' }, { user: citra.id }],
  });

  return { admin, manager, otherManager, budi, citra, outsider, project, projectId: project._id };
}

export const findActivities = (project, action) =>
  Activity.find({ project, ...(action && { action }) }).sort('createdAt');

export const DAY = 24 * 60 * 60 * 1000;
export const daysFromNow = (n) => new Date(Date.now() + n * DAY).toISOString();
