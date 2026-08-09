'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import type { LoginInput } from '@/lib/types';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Quick-login presets for demo
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@edumatrix.com', role: 'admin', color: 'var(--color-purple)' },
  { label: 'Teacher', email: 'farhad@tc.com', role: 'teacher', color: 'var(--color-info)' },
  { label: 'Student', email: 'sk@st.com', role: 'student', color: 'var(--color-success)' },
];

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError('');
    try {
      await login(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  const fillDemo = (email: string, label: string) => {
    setValue('email', email);
    if (label == 'Admin') {
      setValue('password', 'Admin@123456');
    }
    else {
      setValue('password', '123456');
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: 440 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
        }}>
          <BookOpen size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>EduTrack</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Assignment Management</p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>Welcome back</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.75rem' }}>
        Sign in to access your dashboard
      </p>

      {/* Demo Quick Login */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick demo access
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {DEMO_ACCOUNTS.map(acc => (
            <button
              key={acc.role}
              type="button"
              onClick={() => fillDemo(acc.email, acc.label)}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: `1px solid ${acc.color}40`,
                borderRadius: 'var(--radius-md)',
                background: `${acc.color}15`,
                color: acc.color,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Zap size={10} style={{ display: 'inline', marginRight: 4 }} />
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider-with-label" style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}>or continue with email</div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--color-danger-muted)',
          border: '1px solid rgba(244,63,94,0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger)',
          fontSize: '0.875rem',
          marginBottom: '1.25rem',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email address</label>
          <div className="input-wrapper">
            <Mail size={16} className="input-icon" />
            <input
              id="login-email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="your@email.edu"
              autoComplete="email"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <Lock size={16} className="input-icon" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{ paddingRight: '2.75rem' }}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: '0.75rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={isLoading}
          style={{ marginTop: '0.5rem', width: '100%' }}
        >
          {isLoading ? (
            <>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
              Signing in...
            </>
          ) : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Create one
        </Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
