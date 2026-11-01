import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';
import { usePageTitle } from '../lib/usePageTitle';

export function LoginPage() {
  usePageTitle('登录');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      const state = location.state as { from?: string } | null;
      navigate(state?.from || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setUsername('林见山');
    setPassword('demo1234');
    setError('');
  };

  return (
    <AuthLayout
      mode="login"
      title="欢迎回来"
      subtitle="登录后继续发布文章、管理你的小院子。"
      footer={
        <>
          还没有账号？{' '}
          <Link to="/register" className="font-semibold text-clay-deep underline underline-offset-4">
            创建一个
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        {error && (
          <div className="rounded-xl border border-clay/25 bg-clay/5 px-3.5 py-2.5 text-xs leading-5 text-clay-deep">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="username" className="field-label">用户名</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="field"
            placeholder="你的用户名"
            autoComplete="username"
            required
            autoFocus
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="field-label">密码</label>
            <span className="mb-1.5 text-[10px] text-moss">至少 6 位</span>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field pr-11!"
              placeholder="输入密码"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-moss transition hover:text-forest"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
          {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />}
          {submitting ? '正在登录…' : '登录'}
        </button>
      </form>

      <button
        type="button"
        onClick={fillDemo}
        className="mt-5 w-full rounded-xl border border-dashed border-forest/25 bg-forest/[0.035] px-4 py-3 text-left transition hover:border-forest/45 hover:bg-forest/[0.06]"
      >
        <span className="flex items-center justify-between text-[11px] font-bold tracking-[0.1em] text-forest">
          使用体验账号
          <span className="font-normal tracking-normal text-moss">点击自动填入</span>
        </span>
        <span className="mt-1 block text-xs text-ink-soft">
          林见山 · <span className="font-mono">demo1234</span>
        </span>
      </button>
    </AuthLayout>
  );
}
