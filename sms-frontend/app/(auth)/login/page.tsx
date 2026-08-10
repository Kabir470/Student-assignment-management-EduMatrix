'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Mail, Lock, Eye, EyeOff, ClipboardList, ShieldCheck, LineChart, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import type { LoginInput } from '@/lib/types';
import Image from 'next/image';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@edumatrix.com', role: 'admin' },
  { label: 'Teacher', email: 'farhad@tc.com', role: 'teacher' },
  { label: 'Student', email: 'sk@st.com', role: 'student' },
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
    setValue('password', label === 'Admin' ? 'Admin@123456' : '123456');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row w-full h-[100dvh] bg-slate-50 font-sans overflow-hidden">
      {/* ── LEFT PANEL (Dark Blue Gradient) ── */}
      <div
        className="hidden lg:flex flex-1 flex-col relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)', padding: '4rem 5rem' }}
      >
        {/* Decorative pattern overlay (optional, simplified) */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '50%', height: '50%',
          backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%', width: '60%', height: '60%',
          backgroundImage: 'radial-gradient(circle at 0% 100%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />

        {/* Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 40, height: 40, background: '#4F46E5', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BookOpen size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>EduMatrix</h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0 }}>Assignment Management System</p>
          </div>
        </div>

        {/* Hero Text */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 400 }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, margin: 0 }}>Streamline.</h2>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, margin: 0 }}>Manage.</h2>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, margin: 0, color: '#60A5FA' }}>Achieve.</h2>
          
          <p style={{ fontSize: '1rem', color: '#CBD5E1', marginTop: '1.5rem', lineHeight: 1.6, maxWidth: 360 }}>
            A smart platform to create, submit, review and manage assignments efficiently.
          </p>
        </div>

        {/* Features List */}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, background: 'rgba(59, 130, 246, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0 }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Easy Assignment Management</h3>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, lineHeight: 1.5, maxWidth: 260 }}>Create, distribute and track assignments with ease.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Secure & Reliable</h3>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, lineHeight: 1.5, maxWidth: 260 }}>Your data is safe with enterprise grade security.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, background: 'rgba(168, 85, 247, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC', flexShrink: 0 }}>
              <LineChart size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Real-time Insights</h3>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, lineHeight: 1.5, maxWidth: 260 }}>Track progress and performance with real-time analytics.</p>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup Image */}
        <div style={{ position: 'absolute', bottom: '-4rem', right: '-4rem', width: '75%', minWidth: '450px', zIndex: 1 }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: 'auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transform: 'perspective(1200px) rotateX(2deg) rotateY(-8deg) rotateZ(2deg)',
            border: '6px solid #1E293B',
          }}>
            <Image
              src="/dashboard_mockup.png"
              alt="Dashboard Mockup"
              width={800}
              height={600}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              priority
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Login Form) ── */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto">
        
        {/* The Card */}
        <div className="w-full max-w-[440px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 64, height: 64, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <BookOpen size={32} color="#3B82F6" />
            </div>
            <h1 className="lg:hidden text-xl font-bold text-slate-800 mb-1">EduMatrix</h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0' }}>Welcome Back!</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>Login to continue to your account</p>
          </div>

          {/* Quick Demo Fill Buttons (Requested by User) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.role}
                type="button"
                onClick={() => fillDemo(acc.email, acc.label)}
                style={{
                  flex: 1, padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '8px',
                  background: '#F8FAFC', color: '#475569', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                className="hover:border-blue-500 hover:text-blue-600"
              >
                {acc.label}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '0.75rem', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Email or Student ID"
                style={{
                  width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', border: '1px solid #E2E8F0',
                  borderRadius: '12px', fontSize: '0.9rem', color: '#334155', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                className={`focus:border-blue-500 ${errors.email ? 'border-red-500' : ''}`}
                {...register('email')}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                style={{
                  width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem', border: '1px solid #E2E8F0',
                  borderRadius: '12px', fontSize: '0.9rem', color: '#334155', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                className={`focus:border-blue-500 ${errors.password ? 'border-red-500' : ''}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#64748B' }}>
                <input type="checkbox" style={{ width: 16, height: 16, borderRadius: 4, cursor: 'pointer' }} />
                Remember me
              </label>
              <Link href="#" style={{ fontSize: '0.85rem', color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '0.875rem', background: '#3B82F6', color: 'white', border: 'none',
                borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)', transition: 'background 0.2s',
                marginTop: '0.5rem'
              }}
              className="hover:bg-blue-600"
            >
              {isLoading ? 'Signing in...' : 'Login'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ flex: 1, padding: '0.75rem', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }} className="hover:bg-gray-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button style={{ flex: 1, padding: '0.75rem', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }} className="hover:bg-gray-50">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: 20, height: 20 }}>
                <div style={{ background: '#F25022' }}></div>
                <div style={{ background: '#7FBA00' }}></div>
                <div style={{ background: '#00A4EF' }}></div>
                <div style={{ background: '#FFB900' }}></div>
              </div>
            </button>
            <button style={{ flex: 1, padding: '0.75rem', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }} className="hover:bg-gray-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#64748B' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }}>
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
