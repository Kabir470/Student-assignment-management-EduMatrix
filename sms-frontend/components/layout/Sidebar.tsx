'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, LayoutDashboard, Users, BookMarked, FileText,
  ClipboardCheck, GraduationCap, BarChart3, ChevronLeft, ChevronRight,
  Settings, HelpCircle, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getInitials, cn } from '@/lib/utils';

// ─── Nav config per role ──────────────────────────────────────────────────────

const NAV = {
  admin: [
    { section: 'Main', items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/courses', label: 'Courses', icon: BookMarked },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ]},
  ],
  teacher: [
    { section: 'Main', items: [
      { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/teacher/courses', label: 'My Courses', icon: BookMarked },
      { href: '/teacher/assignments', label: 'Assignments', icon: FileText },
    ]},
  ],
  student: [
    { section: 'Main', items: [
      { href: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/student/courses', label: 'My Courses', icon: BookMarked },
      { href: '/student/assignments', label: 'Assignments', icon: FileText },
      { href: '/student/submissions', label: 'My Submissions', icon: ClipboardCheck },
    ]},
  ],
};

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

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, isOpenMobile, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const nav = NAV[user.role] ?? [];
  const roleColor = ROLE_COLORS[user.role];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`sidebar ${isOpenMobile ? 'open' : ''}`}
      style={{ width: isCollapsed ? 64 : 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="sidebar-logo" style={{ position: 'relative' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: 'var(--shadow-glow)',
        }}>
          <BookOpen size={18} color="white" />
        </div>
        {!isCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>EduMatrix</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>SMS Platform</p>
          </div>
        )}
        {isOpenMobile && onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="btn btn-ghost btn-icon d-md-none"
            style={{ position: 'absolute', right: '0.5rem', width: '32px', height: '32px', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {nav.map(group => (
          <div key={group.section}>
            {!isCollapsed && (
              <p className="sidebar-section-label">{group.section}</p>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { if (isOpenMobile && onCloseMobile) onCloseMobile(); }}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                  style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                >
                  <Icon size={18} style={{ flexShrink: 0, color: active ? 'var(--color-primary)' : undefined }} />
                  {!isCollapsed && <span>{item.label}</span>}
                  {!isCollapsed && active && (
                    <div style={{
                      marginLeft: 'auto', width: 6, height: 6,
                      borderRadius: '50%', background: 'var(--color-primary)',
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div style={{
        padding: isCollapsed ? '0.75rem 0.5rem' : '1rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
        gap: isCollapsed ? 0 : '0.75rem',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
      }}>
        <div
          className="avatar avatar-sm"
          style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`, flexShrink: 0 }}
        >
          {getInitials(user.firstName, user.lastName)}
        </div>
        {!isCollapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.firstName} {user.lastName}
            </p>
            <p style={{ fontSize: '0.7rem', color: roleColor, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="sidebar-collapse-btn"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
