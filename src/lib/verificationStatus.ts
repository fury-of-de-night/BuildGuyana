export function normalizeVerificationStatus(status: string): string {
  const normalized = (status || '').toLowerCase().trim();
  if (normalized === 'manually_approved') return 'approved';
  if (normalized === 'manually_rejected') return 'rejected';
  return normalized;
}
