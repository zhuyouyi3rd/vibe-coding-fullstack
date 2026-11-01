import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Image as ImageIcon,
  LoaderCircle,
  Save,
  Send,
  Settings2,
  Tags,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Category, PostDetail } from '../types';
import { readingTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { CoverPicker } from '../components/CoverPicker';
import { TagInput } from '../components/TagInput';
import { CoverImage } from '../components/CoverImage';
import { LoadingScreen } from '../components/LoadingScreen';
import { usePageTitle } from '../lib/usePageTitle';

export function WritePage() {
  const { id } = useParams();
  const editing = Boolean(id);
  usePageTitle(editing ? '修改文章' : '写文章');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState('/covers/cover-1.svg');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ data: Category[] }>('/categories')
      .then(({ data }) => {
        if (!active) return;
        setCategories(data.data);
        setCategoryId((current) => current ?? data.data[0]?.id ?? null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!editing || !id) return;
    let active = true;
    setLoading(true);
    api
      .get<{ data: PostDetail }>(`/posts/${id}`)
      .then(({ data }) => {
        if (!active) return;
        const post = data.data;
        if (post.author.id !== user?.id) {
          setError('只能编辑自己的文章');
          return;
        }
        setTitle(post.title);
        setContent(post.content);
        setCategoryId(post.category.id);
        setTags(post.tags);
        setCover(post.cover);
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
  }, [editing, id, user?.id]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const canPublish = title.trim().length > 0 && content.trim().length > 0 && Boolean(categoryId);

  const publish = async () => {
    setError('');
    if (!title.trim()) return setError('请先写一个标题');
    if (!content.trim()) return setError('正文还没有内容');
    if (!categoryId) return setError('请选择一个分类');

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        categoryId,
        tags,
        cover,
      };
      if (editing) {
        const { data } = await api.put<{ data: PostDetail }>(`/posts/${id}`, payload);
        toast('文章已更新');
        navigate(`/post/${data.data.id}`);
      } else {
        const { data } = await api.post<{ data: PostDetail }>('/posts', payload);
        toast('文章发布成功');
        navigate(`/post/${data.data.id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen label="正在打开编辑器" />;

  if (error && editing && !title) {
    return (
      <section className="page-shell grid min-h-[60vh] place-items-center text-center">
        <div>
          <p className="font-display text-2xl font-semibold text-forest-deep">无法打开这篇草稿</p>
          <p className="mt-2 text-sm text-ink-soft">{error}</p>
          <Link to="/" className="btn-primary mt-6">
            <ArrowLeft size={15} />
            回到首页
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="page-shell py-7 sm:py-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            to={editing ? `/post/${id}` : '/'}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft transition hover:border-forest/40 hover:text-forest"
            aria-label="返回"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-moss">
              {editing ? 'EDIT STORY' : 'NEW STORY'}
            </p>
            <h1 className="font-display text-xl font-semibold text-forest-deep">
              {editing ? '修改这篇文章' : '写一篇新文章'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`hidden text-[11px] sm:inline ${canPublish ? 'text-moss' : 'text-clay'}`}>
            {canPublish ? '可以发布了' : '标题、正文、分类为必填'}
          </span>
          <button type="button" onClick={publish} disabled={saving} className="btn-primary px-4! py-2.5!">
            {saving ? <LoaderCircle size={15} className="animate-spin" /> : editing ? <Save size={15} /> : <Send size={15} />}
            {saving ? '保存中…' : editing ? '保存修改' : '发布文章'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-clay/25 bg-clay/5 px-4 py-2.5 text-xs text-clay-deep">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="rounded-[1.1rem] border border-line bg-paper-light/55 px-5 py-5 sm:px-6">
            <textarea
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              rows={2}
              maxLength={200}
              placeholder="给这篇文章一个标题…"
              className="w-full resize-none border-0 bg-transparent font-display text-[1.8rem] font-semibold leading-[1.35] tracking-[-0.03em] text-forest-deep outline-none placeholder:text-moss/35 sm:text-[2.2rem]"
            />
            <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 text-[10px] text-moss">
              <span>{selectedCategory ? `分类 · ${selectedCategory.name}` : '尚未选择分类'}</span>
              <span>{title.length} / 200</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[0.12em] text-moss">正文</p>
            <button
              type="button"
              onClick={() => setShowSettings((shown) => !shown)}
              className="inline-flex items-center gap-1 text-[11px] text-ink-soft transition hover:text-clay-deep"
            >
              <Settings2 size={13} />
              {showSettings ? '收起文章设置' : '展开文章设置'}
            </button>
          </div>

          {showSettings && (
            <div className="mt-3 grid gap-4 rounded-[1.1rem] border border-line bg-paper-light/45 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="field-label flex items-center gap-1.5">
                  <Tags size={12} /> 分类
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                        categoryId === category.id
                          ? 'border-forest bg-forest text-paper'
                          : 'border-line bg-white/40 text-ink-soft hover:border-forest/40'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="field-label">标签</span>
                <TagInput value={tags} onChange={setTags} />
              </div>
              <div className="sm:col-span-2">
                <span className="field-label flex items-center gap-1.5">
                  <ImageIcon size={12} /> 封面
                </span>
                <CoverPicker value={cover} onChange={setCover} />
              </div>
            </div>
          )}

          <div className="mt-4">
            <MarkdownEditor value={content} onChange={setContent} />
          </div>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-[1.2rem] border border-line bg-paper-light/75 shadow-[0_24px_60px_-48px_rgba(29,43,38,0.8)]">
            <div className="flex items-center justify-between border-b border-line/70 bg-paper-deep/30 px-4 py-2.5">
              <span className="text-[10px] font-bold tracking-[0.18em] text-moss">实时预览</span>
              <span className="text-[10px] text-moss/70">
                {content.length ? `${readingTime(content)} 分钟阅读` : '等待落笔'}
              </span>
            </div>
            <div className="max-h-[calc(100vh-11rem)] overflow-y-auto">
              <CoverImage
                src={cover}
                alt="封面预览"
                className="aspect-[16/8] w-full object-cover"
              />
              <div className="px-5 py-5">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-moss">
                  <span className="rounded-full bg-forest/10 px-2.5 py-1 font-semibold text-forest">
                    {selectedCategory?.name || '未分类'}
                  </span>
                  {tags.slice(0, 3).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
                <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.4] tracking-[-0.02em] text-forest-deep">
                  {title || '标题会出现在这里'}
                </h2>
                <div className="mt-3 flex items-center gap-2 border-b border-line/70 pb-4 text-[10px] text-moss">
                  <span>{user?.username}</span>
                  <span>·</span>
                  <span>刚刚</span>
                </div>
                <div className="prose-preview mt-4">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-sm leading-7 text-moss/60">
                      正文会在这里实时排版。试着写一段开头，看看它变成文章的样子。
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 px-1 text-[10px] leading-5 text-moss">
            提示：Markdown 支持标题、引用、列表、代码块。发布后仍可随时回来修改。
          </p>
        </aside>
      </div>
    </div>
  );
}
