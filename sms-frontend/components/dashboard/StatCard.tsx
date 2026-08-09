import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  trend?: { value: number; label: string };
}

const VARIANT_COLORS = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

const VARIANT_MUTED = {
  primary: 'var(--color-primary-muted)',
  success: 'var(--color-success-muted)',
  warning: 'var(--color-warning-muted)',
  danger: 'var(--color-danger-muted)',
};

export default function StatCard({ title, value, subtitle, icon: Icon, variant = 'primary', trend }: StatCardProps) {
  const color = VARIANT_COLORS[variant];
  const muted = VARIANT_MUTED[variant];

  return (
    <div className={`stat-card ${variant}`} style={{ minHeight: '130px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {title}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginTop: '0.25rem' }}>
            {value}
          </p>
          {subtitle && (
            <p style={{
              fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
          {trend.value >= 0 ? (
            <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
          ) : (
            <TrendingDown size={14} style={{ color: 'var(--color-danger)' }} />
          )}
          <span style={{
            fontSize: '0.78rem', fontWeight: 600,
            color: trend.value >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
