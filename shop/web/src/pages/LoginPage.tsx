import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      mode="login"
      title="登录云市"
      subtitle="继续挑选，或者看看之前买过的东西。"
      footer={<>还没有账号？ <Link to="/register" className="font-semibold text-brick underline underline-offset-4">注册一个</Link></>}
    >
      <form onSubmit={submit} className="grid gap-4">
        {error && <div className="rounded border border-brick/25 bg-brick/5 px-3 py-2 text-xs text-brick-deep">{error}</div>}
        <div><label htmlFor="username" className="field-label">用户名</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="field" placeholder="你的用户名" autoComplete="username" required autoFocus /></div>
        <div>
          <label htmlFor="password" className="field-label">密码</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="field pr-10!" placeholder="输入密码" autoComplete="current-password" required />
            <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? '隐藏密码' : '显示密码'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </div>
        </div>
        <button type="submit" disabled={submitting} className="btn-brick mt-1 w-full py-3!">
          {submitting ? <LoaderCircle size={15} className="animate-spin" /> : <LogIn size={15} />} {submitting ? '登录中…' : '登录'}
        </button>
      </form>
      <button type="button" onClick={() => { setUsername('林见山'); setPassword('demo1234'); setError(''); }} className="mt-4 w-full rounded border border-dashed border-olive/30 bg-olive/[0.03] px-3 py-2.5 text-left">
        <span className="flex items-center justify-between text-[10px] font-bold tracking-[0.1em] text-olive">使用体验账号<span className="font-normal tracking-normal text-ink-soft">点击填入</span></span>
        <span className="mt-0.5 block text-[11px] text-ink-soft">林见山 · <span className="font-mono">demo1234</span></span>
      </button>
    </AuthLayout>
  );
}
