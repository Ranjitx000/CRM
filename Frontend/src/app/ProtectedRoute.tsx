import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import type { UserRole } from '@/types/auth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <Skeleton className="h-32 w-full max-w-sm rounded-lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Alternatively, redirect to a 403 page
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
