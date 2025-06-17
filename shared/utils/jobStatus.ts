export type JobStatus = 'active' | 'dormant' | 'fulfilled' | 'deleted';

export function getJobStatus({ isActive, fulfilled, deleted }: { isActive?: boolean; fulfilled?: boolean; deleted?: boolean; }): JobStatus {
  if (deleted) return 'deleted';
  if (fulfilled) return 'fulfilled';
  return isActive ? 'active' : 'dormant';
}
