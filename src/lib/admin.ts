// This controls UI access only. Server/database authorization must also be enforced.
const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@buildguyana.gy').trim().toLowerCase();

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === adminEmail;
}
