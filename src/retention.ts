const RETENTION_MS = 24 * 60 * 60 * 1000;

export function expiresAt(receivedAt: Date): Date {
  return new Date(receivedAt.getTime() + RETENTION_MS);
}

export function isExpired(uploaded: Date, now: Date): boolean {
  return uploaded.getTime() <= now.getTime() - RETENTION_MS;
}
