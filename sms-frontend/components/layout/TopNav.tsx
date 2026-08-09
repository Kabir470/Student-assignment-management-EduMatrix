'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut, Menu, X, ChevronDown, Megaphone } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getInitials } from '@/lib/utils';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { announcementsService } from '@/lib/api/announcements';
import type { Announcement } from '@/lib/types';

const ROLE_COLORS = {
  admin: 'var(--color-purple)',
  teacher: 'var(--color-info)',
  student: 'var(--color-success)',
};

const ROLE_LABELS = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
};

interface TopNavProps {
  isSidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function TopNav({ isSidebarCollapsed, onMobileMenuToggle, isMobileMenuOpen }: TopNavProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementsService.getAll();
        setAnnouncements(data.slice(0, 5));
        const lastRead = localStorage.getItem('last_read_announcement');
        if (data.length > 0 && data[0].id !== lastRead) {
          setUnreadCount(1);
        }
      } catch (e) {}
    };
    fetchAnnouncements();
  }, [user]);

  const handleOpenNotifications = () => {
    setShowNotifications(v => !v);
    if (!showNotifications && announcements.length > 0) {
      localStorage.setItem('last_read_announcement', announcements[0].id);
      setUnreadCount(0);
    }
  };

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      className="topnav"
      style={{ left: isSidebarCollapsed ? 64 : 'var(--sidebar-width)' }}
    >
      {/* Left: Mobile menu + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onMobileMenuToggle}
          className="btn btn-ghost btn-icon"
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {showSearch ? (
          <div className="input-wrapper" style={{ width: 300 }}>
            <Search size={16} className="input-icon" />
            <input
              className="input"
              placeholder="Search assignments, users..."
              autoFocus
              onBlur={() => setShowSearch(false)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="btn btn-ghost"
            style={{ gap: '0.5rem', color: 'var(--color-text-muted)' }}
          >
            <Search size={16} />
            <span style={{ fontSize: '0.875rem' }}>Search...</span>
          </button>
        )}
      </div>

      {/* Right: Notifications + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ThemeToggle />

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-ghost btn-icon" 
            style={{ position: 'relative' }}
            onClick={handleOpenNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--color-danger)',
                border: '2px solid var(--color-surface)',
              }} />
            )}
          </button>
          
          {showNotifications && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                width: 340,
                maxHeight: 400,
                overflowY: 'auto',
                zIndex: 100,
                animation: 'slideUp 0.15s ease',
              }}
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={16} style={{ color: 'var(--color-primary)' }}/> Announcements
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {announcements.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    No new announcements.
                  </div>
                ) : announcements.map(ann => (
                  <div key={ann.id} style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{ann.title}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{ann.content}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {new Date(ann.createdAt).toLocaleDateString()} · {ann.authorName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.75rem 0.35rem 0.35rem',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <div
              className="avatar avatar-sm"
              style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)` }}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ fontSize: '0.7rem', color: roleColor, lineHeight: 1.2 }}>
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {showDropdown && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem',
                minWidth: 180,
                zIndex: 100,
                animation: 'slideUp 0.15s ease',
              }}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Signed in as</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-danger)', fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans)', transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-danger-muted)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@media (max-width: 768px) { #mobile-menu-btn { display: flex !important; } }`}</style>
    </header>
  );
}
