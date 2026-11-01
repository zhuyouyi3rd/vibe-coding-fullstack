import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('两次输入的密码不一致');
    setSubmitting(true);
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      mode="register"
      title="加入云市"
      subtitle="注册后可以保存地址、管理订单，把喜欢的东西先放进购物车。"
      footer={<>已经有账号？ <Link to="/login" className="font-semibold text-brick underline underline-offset-4">去登录</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3.5">
        {error && <div className="rounded border border-brick/25 bg-brick/5 px-3 py-2 text-xs text-brick-deep">{error}</div>}
        <div><label htmlFor="username" className="field-label">用户名</label><input id="username" value={form.username} onChange={update('username')} className="field" placeholder="3–20 个字符" autoComplete="username" minLength={3} maxLength={20} required autoFocus /></div>
        <div><label htmlFor="email" className="field-label">邮箱</label><input id="email" type="email" value={form.email} onChange={update('email')} className="field" placeholder="you@example.com" autoComplete="email" required /></div>
        <div>
          <label htmlFor="password" className="field-label">密码</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} value={form.password} onChange={update('password')} className="field pr-10!" placeholder="至少 6 位" autoComplete="new-password" minLength={6} required />
            <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? '隐藏密码' : '显示密码'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </div>
        </div>
        <div><label htmlFor="confirm" className="field-label">确认密码</label><input id="confirm" type={show ? 'text' : 'password'} value={form.confirm} onChange={update('confirm')} className="field" placeholder="再输入一次" autoComplete="new-password" required /></div>
        <button type="submit" disabled={submitting} className="btn-brick mt-1 w-full py-3!">
          {submitting ? <LoaderCircle size={15} className="animate-spin" /> : <UserPlus size={15} />} {submitting ? '创建中…' : '创建账号'}
        </button>
      </form>
    </AuthLayout>
  );
}
