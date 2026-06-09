const DEFAULT_RETENTION_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;

export function retentionHours(value: string | undefined): number {
  const hours = Number(value);
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_RETENTION_HOURS;
}

export function expiresAt(receivedAt: Date, hours = DEFAULT_RETENTION_HOURS): Date {
  return new Date(receivedAt.getTime() + hours * HOUR_MS);
}

export function isExpired(uploaded: Date, now: Date, hours = DEFAULT_RETENTION_HOURS): boolean {
  return uploaded.getTime() <= now.getTime() - hours * HOUR_MS;
}
