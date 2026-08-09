'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getDashboardPath } from '@/lib/utils';

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      router.replace(getDashboardPath(user.role));
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen flex-center" style={{ background: 'var(--color-bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '4px solid var(--color-primary)',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading EduTrack...</p>
      </div>
    </div>
  );
}
