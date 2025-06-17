export type JobTransition =
  | 'activate'
  | 'deactivate'
  | 'fulfill'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'hold';

export interface JobFlags {
  isActive?: boolean;
  fulfilled?: boolean;
  deleted?: boolean;
}

export function validateJobTransition(job: JobFlags, action: JobTransition): { allowed: boolean; message?: string } {
  if (job.deleted) {
    return { allowed: false, message: 'Job has been deleted' };
  }
  if (job.fulfilled) {
    return { allowed: false, message: 'Job has already been fulfilled' };
  }

  if (action === 'activate' || action === 'approve') {
    if (job.isActive) {
      return { allowed: false, message: 'Job is already active' };
    }
  }

  if (action === 'deactivate' || action === 'hold') {
    if (job.isActive === false) {
      return { allowed: false, message: 'Job is already inactive' };
    }
  }

  if (action === 'fulfill') {
    if (job.fulfilled) {
      return { allowed: false, message: 'Job is already fulfilled' };
    }
  }

  if (action === 'delete' || action === 'reject') {
    if (job.deleted) {
      return { allowed: false, message: 'Job is already deleted' };
    }
  }

  return { allowed: true };
}
