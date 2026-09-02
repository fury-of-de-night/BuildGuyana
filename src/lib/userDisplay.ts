export const DELETED_USER_NAME = 'Deleted User';
export const NEW_USER_NAME = 'New User';

export function getDisplayName(fullName: string | null | undefined, fallback?: string | null): string {
  if (!fullName || fullName === DELETED_USER_NAME) return 'Account Deleted';
  if (fullName === NEW_USER_NAME) return fallback || 'Account';
  return fullName;
}