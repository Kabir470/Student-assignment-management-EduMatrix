'use client';

import { useTheme } from '@/lib/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ width: 36, height: 36 }} />;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button 
        className="btn btn-ghost btn-icon"
        title="Toggle Theme"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {resolvedTheme === 'dark' ? (
          <Sun size={18} style={{ color: 'var(--color-warning)' }} />
        ) : (
          <Moon size={18} style={{ color: 'var(--color-primary)' }} />
        )}
      </button>
    </div>
  );
}
