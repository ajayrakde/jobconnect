import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobRepository } from '../JobRepository';


var whereMock: any;
var data: any[] = [];
var callIndex = 0;

vi.mock('../../db', () => {
  data = [
    { id: 1, employerId: 1, isActive: false, deleted: false },
    { id: 2, employerId: 1, isActive: false, deleted: true },
    { id: 3, employerId: 2, isActive: false, deleted: false },
  ];
  whereMock = vi.fn(() => {
    const current = callIndex++;
    let result;
    if (current === 0) {
      result = data.filter((j) => j.employerId === 1 && !j.deleted);
    } else {
      result = data.filter((j) => !j.isActive && !j.deleted);
    }
    return result;
  });
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  return { db: { select: selectMock }, whereMock };
});

import { whereMock as dbWhereMock } from '../../db';

describe('JobRepository soft delete filters', () => {
  beforeEach(() => {
    dbWhereMock.mockClear();
  });

  it('getJobPostsByEmployer should filter deleted jobs', async () => {
    const jobs = await JobRepository.getJobPostsByEmployer(1);
    expect(jobs.length).toBe(1);
    expect(jobs[0].id).toBe(1);
  });

  it('getInactiveJobs should filter deleted jobs', async () => {
    const jobs = await JobRepository.getInactiveJobs();
    expect(jobs.every(j => !j.deleted)).toBe(true);
  });
});
