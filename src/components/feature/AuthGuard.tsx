import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoModeContext';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: 'tradesperson' | 'project_owner' | 'admin';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const { isDemo } = useDemo();
  const location = useLocation();

  // Demo mode bypasses all auth checks
  if (isDemo) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-foreground-600 text-sm font-label">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Tradesperson dashboard — only accessible if user is a tradesperson
  if (requiredRole === 'tradesperson' && profile && !profile.is_tradesperson) {
    return <Navigate to="/register?role=tradesperson" replace />;
  }

  // Admin dashboard — only accessible to admin
  if (requiredRole === 'admin' && profile && user.email === (process.env.ADMIN_EMAIL || 'admin@buildguyana.gy')) {
    return <Navigate to="/" replace />;
  }

  // Project owner dashboard — everyone has access by default, no redirect needed
  return <>{children}</>;
}