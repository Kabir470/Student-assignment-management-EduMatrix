'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, ShieldAlert, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function RegisterPage() {
  return (
    <div className="auth-bg animate-fade-in">
      <div className="auth-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--color-danger-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.5rem', border: '1px solid rgba(244,63,94,0.3)',
          boxShadow: '0 0 20px rgba(244,63,94,0.2)'
        }}>
          <ShieldAlert size={32} style={{ color: 'var(--color-danger)' }} />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Registration Disabled
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Public account creation is not permitted for security reasons. Only administrators can provision new role-based accounts.
        </p>

        <div style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          width: '100%',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Need an account?
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <a 
              href="mailto:admin@edumatrix.com"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              <Mail size={16} />
              admin@edumatrix.com
            </a>
            <CopyButton email="admin@edumatrix.com" />
          </div>
        </div>

        <Link 
          href="/login" 
          className="btn btn-ghost"
          style={{ width: '100%' }}
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}

function CopyButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-ghost btn-icon btn-sm"
      style={{ color: copied ? 'var(--color-success)' : 'var(--color-text-muted)', marginLeft: '0.25rem' }}
      title="Copy Email"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
