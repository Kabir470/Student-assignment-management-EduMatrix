'use client';

import { useState } from 'react';
import { RequireAuth } from '@/lib/auth/guards';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="app-layout">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 39, backdropFilter: 'blur(2px)',
            }}
          />
        )}

        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(v => !v)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <div
          className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        >
          <TopNav
            isSidebarCollapsed={isCollapsed}
            onMobileMenuToggle={() => setIsMobileMenuOpen(v => !v)}
            isMobileMenuOpen={isMobileMenuOpen}
          />
          <main className="page-container">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
