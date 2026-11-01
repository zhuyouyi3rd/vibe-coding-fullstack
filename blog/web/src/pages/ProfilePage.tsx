import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Eye,
  FileText,
  KeyRound,
  LoaderCircle,
  Pencil,
  Save,
  Settings2,
  Trash2,
  UserRound,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { AuthUser, Pagination as PaginationType, PostListResponse, PostSummary, PublicProfile } from '../types';
import { formatDate, formatViews } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/Avatar';
import { Pagination } from '../components/Pagination';
import { LoadingScreen } from '../components/LoadingScreen';
import { usePageTitle } from '../lib/usePageTitle';

const avatarPresets = ['/avatars/lin.svg', '/avatars/zhou.svg', '/avatars/chen.svg', '/avatars/guest.svg'];

type Tab = 'posts' | 'settings';

export function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { toast } = useToast();

  const isOwn = !id || (user ? Number(id) === user.id : false);
  const targetId = isOwn ? user?.id : Number(id);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('posts');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [profileForm, setProfileForm] = useState({ username: '', email: '', avatar: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  usePageTitle(profile ? profile.username : isOwn ? '个人中心' : '作者主页');

  useEffect(() => {
    if (!targetId) return;
    let active = true;
    setLoading(true);
    setError('');
    setPage(1);
    api
      .get<{ data: PublicProfile }>(`/users/${targetId}`)
      .then(({ data }) => {
        if (!active) return;
        setProfile(data.data);
        setProfileForm({
          username: data.data.username,
          email: user && isOwn ? user.email : '',
          avatar: data.data.avatar,
        });
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetId, isOwn, user]);

  useEffect(() => {
    if (!targetId) return;
    let active = true;
    setPostsLoading(true);
    api
      .get<PostListResponse>('/posts', { params: { authorId: targetId, page, pageSize: 6 } })
      .then(({ data }) => {
        if (!active) return;
        setPosts(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => {
        if (active) toast(getErrorMessage(err), 'error');
      })
      .finally(() => {
        if (active) setPostsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetId, page, toast]);

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put<{ data: AuthUser }>('/users/me', profileForm);
      setUser(data.data);
      setProfile((current) =>
        current
          ? { ...current, username: data.data.username, avatar: data.data.avatar }
          : current,
      );
      toast('个人资料已更新');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await api.put('/users/me/password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast('密码已更新');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDelete = async (postId: number) => {
    setDeletingId(postId);
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      setProfile((current) =>
        current
          ? {
              ...current,
              stats: { ...current.stats, postCount: Math.max(0, current.stats.postCount - 1) },
            }
          : current,
      );
      setConfirmDeleteId(null);
      toast('文章已删除');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingScreen label="正在整理这间屋子" />;

  if (error || !profile || !targetId) {
    return (
      <section className="page-shell grid min-h-[60vh] place-items-center text-center">
        <div>
          <p className="font-display text-5xl text-clay/30">404</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-forest-deep">没有找到这位作者</h1>
          <p className="mt-2 text-sm text-ink-soft">{error || '链接可能已经失效。'}</p>
          <Link to="/" className="btn-primary mt-6">回到首页</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="page-shell py-8 sm:py-10">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-line bg-gradient-to-br from-forest-deep via-forest to-[#2c5b49] px-6 pb-16 pt-10 text-paper sm:px-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-paper/10" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-clay/10 blur-2xl" />
        <p className="relative text-[10px] font-bold tracking-[0.25em] text-paper/45">A WRITER'S YARD</p>
        <p className="relative mt-3 max-w-xl font-display text-2xl leading-9 text-paper/85 sm:text-3xl">
          {isOwn ? '这是你的小院子。' : '路过一位写作者的小院子。'}
        </p>
      </div>

      <div className="relative -mt-12 px-4 sm:px-8">
        <div className="rounded-[1.3rem] border border-line bg-paper-light/95 p-5 shadow-[0_30px_60px_-45px_rgba(29,43,38,0.8)] backdrop-blur sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar
                src={profile.avatar}
                name={profile.username}
                size={84}
                className="border-4! border-paper-light! -mt-14 shadow-xl"
              />
              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-forest-deep">
                  {profile.username}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-moss">
                  <CalendarDays size={12} />
                  {formatDate(profile.createdAt)} 加入
                </p>
              </div>
            </div>

            {isOwn && (
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/write" className="btn-primary px-4! py-2.5!">
                  <Pencil size={14} />
                  写新文章
                </Link>
                <button
                  type="button"
                  onClick={() => setTab(tab === 'settings' ? 'posts' : 'settings')}
                  className="btn-ghost px-4! py-2.5!"
                >
                  <Settings2 size={14} />
                  {tab === 'settings' ? '返回文章' : '账号设置'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 sm:max-w-md">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-forest/8 text-forest">
                <FileText size={15} />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-forest-deep">{profile.stats.postCount}</p>
                <p className="text-[10px] tracking-[0.1em] text-moss">篇文章</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-clay/8 text-clay-deep">
                <Eye size={15} />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-forest-deep">
                  {formatViews(profile.stats.viewCount)}
                </p>
                <p className="text-[10px] tracking-[0.1em] text-moss">次阅读</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOwn && tab === 'settings' ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <form onSubmit={submitProfile} className="rounded-[1.2rem] border border-line bg-paper-light/55 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <UserRound size={16} className="text-clay" />
              <h2 className="font-display text-lg font-semibold text-forest-deep">个人资料</h2>
            </div>
            <div className="mt-5 grid gap-4">
              <div>
                <label htmlFor="profile-username" className="field-label">用户名</label>
                <input
                  id="profile-username"
                  value={profileForm.username}
                  onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })}
                  className="field"
                  minLength={3}
                  maxLength={20}
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="field-label">邮箱</label>
                <input
                  id="profile-email"
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                  className="field"
                  required
                />
              </div>
              <div>
                <span className="field-label">头像</span>
                <div className="flex flex-wrap items-center gap-2">
                  {avatarPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar: preset })}
                      className={`rounded-full border-2 p-0.5 transition ${
                        profileForm.avatar === preset ? 'border-clay' : 'border-transparent hover:border-line'
                      }`}
                      aria-label="选择头像"
                    >
                      <Avatar src={preset} name="头像" size={42} />
                    </button>
                  ))}
                </div>
                <input
                  value={profileForm.avatar}
                  onChange={(event) => setProfileForm({ ...profileForm, avatar: event.target.value })}
                  className="field mt-2.5 py-2! text-xs!"
                  placeholder="或粘贴头像图片地址"
                />
              </div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary mt-5">
              {savingProfile ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
              {savingProfile ? '保存中…' : '保存资料'}
            </button>
          </form>

          <div className="space-y-5">
            <form onSubmit={submitPassword} className="rounded-[1.2rem] border border-line bg-paper-light/55 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-clay" />
                <h2 className="font-display text-lg font-semibold text-forest-deep">修改密码</h2>
              </div>
              <div className="mt-5 grid gap-4">
                <div>
                  <label htmlFor="current-password" className="field-label">当前密码</label>
                  <input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                    className="field"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="field-label">新密码</label>
                  <input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                    className="field"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={savingPassword} className="btn-primary mt-5">
                {savingPassword ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />}
                {savingPassword ? '更新中…' : '更新密码'}
              </button>
            </form>

            <div className="rounded-[1.2rem] border border-line bg-paper-light/35 p-5">
              <p className="text-sm font-semibold text-forest-deep">要离开一会儿吗？</p>
              <p className="mt-1 text-xs leading-6 text-ink-soft/80">退出后需要重新登录才能发文。</p>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="mt-3 text-xs font-semibold text-clay-deep underline underline-offset-4"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-9">
          <div className="flex items-end justify-between border-b border-line pb-4">
            <div>
              <span className="eyebrow">{isOwn ? '我的文章' : '作者的文章'}</span>
              <h2 className="mt-3 font-display text-2xl font-semibold text-forest-deep">
                {isOwn ? '写下的字' : `${profile.username}写下的字`}
              </h2>
            </div>
            <span className="text-[11px] text-moss">{pagination.total} 篇</span>
          </div>

          {postsLoading ? (
            <div className="mt-5 space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 rounded-xl bg-paper-deep/60" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-line px-6 py-14 text-center">
              <p className="font-display text-lg text-forest-deep">还没有文章</p>
              <p className="mt-1 text-xs text-moss">{isOwn ? '从第一篇开始吧。' : '这位作者还在酝酿。'}</p>
              {isOwn && (
                <Link to="/write" className="btn-primary mt-4">
                  <Pencil size={14} />
                  写第一篇
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-4 divide-y divide-line/70">
              {posts.map((post) => (
                <div key={post.id} className="group flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] text-moss">
                      <span className="rounded-full bg-paper-deep/70 px-2 py-0.5 font-semibold text-forest">
                        {post.category.name}
                      </span>
                      <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                      <span className="inline-flex items-center gap-1"><Eye size={10} /> {formatViews(post.views)}</span>
                    </div>
                    <Link
                      to={`/post/${post.id}`}
                      className="mt-1.5 block truncate font-display text-lg font-semibold text-forest-deep transition group-hover:text-clay-deep"
                    >
                      {post.title}
                    </Link>
                  </div>
                  {isOwn && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link to={`/write/${post.id}`} className="rounded-full p-2 text-moss transition hover:bg-paper-deep hover:text-forest" aria-label="编辑文章">
                        <Pencil size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(post.id)}
                        className="rounded-full p-2 text-moss transition hover:bg-clay/10 hover:text-clay-deep"
                        aria-label="删除文章"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-forest-deep/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[1.2rem] border border-line bg-paper-light p-5 shadow-2xl animate-rise">
            <h3 className="font-display text-xl font-semibold text-forest-deep">确认删除这篇文章？</h3>
            <p className="mt-2 text-xs leading-6 text-ink-soft">删除后无法恢复，读者也将无法再访问。</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="btn-ghost px-4! py-2! text-xs!"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId !== null}
                className="rounded-full bg-clay px-4 py-2 text-xs font-semibold text-white transition hover:bg-clay-deep disabled:opacity-60"
              >
                {deletingId !== null ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
