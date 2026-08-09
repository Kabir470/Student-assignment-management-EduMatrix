'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context';
import type { UserRole } from '@/lib/types';
import { getDashboardPath } from '@/lib/utils';

// ─── Redirect-to-login if not authenticated ───────────────────────────────────

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}

// ─── Require specific role(s) ─────────────────────────────────────────────────

export function RequireRole({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && !roles.includes(user.role)) {
      // Redirect to their own dashboard
      router.replace(getDashboardPath(user.role));
    }
  }, [user, isAuthenticated, isLoading, roles, router]);

  if (isLoading) return <AuthLoadingScreen />;
  if (!user || !roles.includes(user.role)) return null;
  return <>{children}</>;
}

// ─── Redirect authenticated users away from auth pages ────────────────────────

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return <AuthLoadingScreen />;
  if (isAuthenticated) return null;
  return <>{children}</>;
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
