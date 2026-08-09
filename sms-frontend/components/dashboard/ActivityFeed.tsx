import { formatRelative } from '@/lib/utils';
import type { ActivityItem } from '@/lib/types';
import { FileText, ClipboardCheck, Star, UserPlus, BookOpen } from 'lucide-react';

const ACTIVITY_ICONS = {
  submission: ClipboardCheck,
  assignment: FileText,
  grading: Star,
  user: UserPlus,
  course: BookOpen,
};

const ACTIVITY_COLORS = {
  submission: 'var(--color-info)',
  assignment: 'var(--color-primary)',
  grading: 'var(--color-warning)',
  user: 'var(--color-success)',
  course: 'var(--color-purple)',
};

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
}

export default function ActivityFeed({ items, maxItems = 6 }: ActivityFeedProps) {
  const displayed = items.slice(0, maxItems);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {displayed.map((item, idx) => {
        const Icon = ACTIVITY_ICONS[item.type] ?? FileText;
        const color = ACTIVITY_COLORS[item.type] ?? 'var(--color-primary)';
        const isLast = idx === displayed.length - 1;

        return (
          <div key={item.id} style={{ display: 'flex', gap: '0.875rem', paddingBottom: isLast ? 0 : '1rem' }}>
            {/* Timeline line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `${color}18`,
                border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} style={{ color }} />
              </div>
              {!isLast && (
                <div style={{ flex: 1, width: 1, background: 'var(--color-border)', marginTop: '0.35rem', minHeight: 16 }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingTop: '0.35rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{item.message}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                {formatRelative(item.timestamp)}
              </p>
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <FileText size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
          <p style={{ fontSize: '0.875rem' }}>No recent activity</p>
        </div>
      )}
    </div>
  );
}
