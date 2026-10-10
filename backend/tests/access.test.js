import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { sameId, isProjectMember, canManageProject } from '../src/utils/access.js';

const id = () => new mongoose.Types.ObjectId();
const user = (role) => ({ _id: id(), role });

describe('sameId', () => {
  it('membandingkan ObjectId, string, dan dokumen ter-populate', () => {
    const a = id();
    expect(sameId(a, String(a))).toBe(true);
    expect(sameId({ _id: a }, a)).toBe(true);
    expect(sameId(a, id())).toBe(false);
  });
});

describe('hak akses project', () => {
  const owner = user('manager');
  const managerMember = user('manager');
  const managerOutside = user('manager');
  const member = user('member');
  const outsider = user('member');
  const admin = user('admin');

  const project = {
    owner: owner._id,
    members: [{ user: owner._id }, { user: managerMember._id }, { user: member._id }],
  };

  it('admin dapat mengakses dan mengelola project mana pun', () => {
    expect(isProjectMember(project, admin)).toBe(true);
    expect(canManageProject(project, admin)).toBe(true);
  });

  it('owner dapat mengelola project', () => {
    expect(canManageProject(project, owner)).toBe(true);
  });

  it('manager yang menjadi anggota dapat mengelola project', () => {
    expect(canManageProject(project, managerMember)).toBe(true);
  });

  it('manager yang bukan anggota tidak dapat mengakses maupun mengelola', () => {
    expect(isProjectMember(project, managerOutside)).toBe(false);
    expect(canManageProject(project, managerOutside)).toBe(false);
  });

  it('member biasa dapat mengakses tetapi tidak dapat mengelola', () => {
    expect(isProjectMember(project, member)).toBe(true);
    expect(canManageProject(project, member)).toBe(false);
  });

  it('orang di luar project tidak punya akses', () => {
    expect(isProjectMember(project, outsider)).toBe(false);
    expect(canManageProject(project, outsider)).toBe(false);
  });
});
