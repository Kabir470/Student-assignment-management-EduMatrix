import { RedirectIfAuthenticated } from '@/lib/auth/guards';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RedirectIfAuthenticated>
      <div className="auth-bg">
        {children}
      </div>
    </RedirectIfAuthenticated>
  );
}
