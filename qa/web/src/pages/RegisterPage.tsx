import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';
import { AuthLayout } from '../components/AuthLayout';

export function RegisterPage() {
  usePageTitle('注册');
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    setSubmitting(true);
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      mode="register"
      title="加入问渠"
      subtitle="注册即送 20 积分，足够提出你的第一个问题。"
      footer={
        <>
          已经有账号？{' '}
          <Link to="/login" className="font-semibold text-amber-deep underline underline-offset-4">去登录</Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-3.5">
        {error && <div className="rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-coral">{error}</div>}
        <div>
          <label htmlFor="username" className="field-label">用户名</label>
          <input id="username" value={form.username} onChange={update('username')} className="field" placeholder="3–20 个字符，支持中文" autoComplete="username" minLength={3} maxLength={20} required autoFocus />
        </div>
        <div>
          <label htmlFor="email" className="field-label">邮箱</label>
          <input id="email" type="email" value={form.email} onChange={update('email')} className="field" placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password" className="field-label">密码</label>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              className="field pr-10!"
              placeholder="至少 6 位"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button type="button" onClick={() => setShow((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-soft" aria-label={show ? '隐藏密码' : '显示密码'}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm" className="field-label">确认密码</label>
          <input id="confirm" type={show ? 'text' : 'password'} value={form.confirm} onChange={update('confirm')} className="field" placeholder="再输入一次" autoComplete="new-password" required />
        </div>
        <button type="submit" disabled={submitting} className="btn-teal mt-1 w-full py-3!">
          {submitting ? <LoaderCircle size={15} className="animate-spin" /> : <UserPlus size={15} />}
          {submitting ? '正在创建…' : '创建账号'}
        </button>
        <p className="text-center text-[9px] leading-5 text-teal-soft">注册即表示你愿意认真对待这里的每一个问题。</p>
      </form>
    </AuthLayout>
  );
}
