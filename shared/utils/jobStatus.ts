export type JobStatus =
  | 'active'
  | 'pending'
  | 'onHold'
  | 'dormant'
  | 'fulfilled'
  | 'deleted';

export function getJobStatus({
  isActive,
  fulfilled,
  deleted,
  onHold,
  createdAt,
}: {
  isActive?: boolean;
  fulfilled?: boolean;
  deleted?: boolean;
  onHold?: boolean;
  createdAt?: Date | string;
}): JobStatus {
  if (deleted) return 'deleted';
  if (fulfilled) return 'fulfilled';
  if (isActive) return 'active';
  if (onHold) return 'onHold';
  if (isActive === false) {
    if (createdAt) {
      const createdDate = new Date(createdAt);
      if (!isNaN(createdDate.getTime())) {
        const daysSinceCreated =
          (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 90) return 'pending';
      }
    }
  }
  return 'dormant';
}
