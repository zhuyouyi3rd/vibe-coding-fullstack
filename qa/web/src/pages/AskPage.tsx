import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Coins,
  Eye,
  Lightbulb,
  LoaderCircle,
  Send,
  Tag as TagIcon,
  X,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { QuestionDetail, Tag } from '../types';
import { usePageTitle } from '../lib/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Markdown } from '../components/Markdown';
import { Avatar } from '../components/Avatar';

export function AskPage() {
  usePageTitle('提个问题');
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [draftTag, setDraftTag] = useState('');
  const [popular, setPopular] = useState<Tag[]>([]);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<{ data: Tag[] }>('/tags')
      .then(({ data }) => {
        if (active) setPopular(data.data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const addTag = (value: string) => {
    const tag = value.trim().replace(/^#/, '');
    if (!tag || tags.includes(tag) || tags.length >= 3) return;
    setTags([...tags, tag]);
    setDraftTag('');
  };

  const onTagKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
      event.preventDefault();
      addTag(draftTag);
    }
    if (event.key === 'Backspace' && !draftTag && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (title.trim().length < 5) return setError('标题至少 5 个字符，把问题说具体一点');
    if (content.trim().length < 10) return setError('问题描述至少 10 个字符，补充一下背景和尝试');
    if (!tags.length) return setError('至少选择 1 个标签，方便懂的人看到');
    if ((user?.points ?? 0) < 5) return setError('积分不足，发布问题需要 5 积分');

    setSubmitting(true);
    try {
      const { data } = await api.post<{ data: QuestionDetail }>('/questions', {
        title: title.trim(),
        content,
        tags,
      });
      await refreshUser();
      toast('问题已发布，-5 积分');
      navigate(`/question/${data.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shell py-7 sm:py-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-soft hover:border-teal/40" aria-label="返回">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-amber-deep">ASK A QUESTION</p>
            <h1 className="font-display text-xl font-semibold text-deep">提个问题</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber/25 bg-amber/5 px-3 py-1.5 text-[10px] font-semibold text-amber-deep">
          <Coins size={13} />
          发布扣 5 积分 · 当前 {user?.points ?? 0}
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="rounded-xl border border-line bg-panel/80 p-4 sm:p-5">
            <label htmlFor="question-title" className="field-label">问题标题</label>
            <textarea
              id="question-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              rows={2}
              maxLength={160}
              placeholder="一句话说清楚你卡在哪里，例如：Express 项目怎么组织目录才不容易乱？"
              className="w-full resize-none border-0 bg-transparent font-display text-[1.35rem] font-semibold leading-[1.5] text-deep outline-none placeholder:text-teal-soft/40"
            />
            <div className="flex justify-between border-t border-line/60 pt-2 text-[9px] text-teal-soft">
              <span>具体的标题更容易被懂的人看到</span>
              <span>{title.length} / 160</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-panel/80 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <span className="field-label mb-0!">问题描述</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => setPreview(false)} className={`rounded px-2 py-1 text-[10px] font-semibold ${!preview ? 'bg-deep text-panel' : 'text-teal-soft'}`}>编辑</button>
                <button type="button" onClick={() => setPreview(true)} className={`rounded px-2 py-1 text-[10px] font-semibold ${preview ? 'bg-deep text-panel' : 'text-teal-soft'}`}>预览</button>
              </div>
            </div>
            {preview ? (
              <div className="min-h-64 py-3">
                {content ? <Markdown content={content} /> : <p className="text-xs text-teal-soft">还没有内容。</p>}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={12}
                aria-label="问题描述"
                className="editor-area mt-2 min-h-64"
                placeholder={'把背景、你试过什么、具体卡在哪写清楚。\n\n可以这样组织：\n1. 我想实现什么\n2. 现在的代码 / 报错\n3. 我已经排查了什么'}
              />
            )}
            <div className="mt-2 flex justify-between border-t border-line/60 pt-2 text-[9px] text-teal-soft">
              <span>支持 Markdown，代码请用 ``` 包裹</span>
              <span>{content.length} 字符</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-panel/80 p-4 sm:p-5">
            <div className="flex items-center gap-1.5">
              <TagIcon size={13} className="text-amber" />
              <span className="field-label mb-0!">标签（1–3 个）</span>
            </div>
            <div className="mt-2 flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white/50 px-2 py-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded bg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-teal">
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter((item) => item !== tag))} aria-label={`移除 ${tag}`}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                value={draftTag}
                onChange={(event) => setDraftTag(event.target.value)}
                onKeyDown={onTagKey}
                onBlur={() => addTag(draftTag)}
                aria-label="添加标签"
                className="min-w-28 flex-1 border-0 bg-transparent px-1 text-xs outline-none placeholder:text-teal-soft"
                placeholder={tags.length >= 3 ? '最多 3 个标签' : '输入标签，回车添加'}
                maxLength={20}
                disabled={tags.length >= 3}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {popular.slice(0, 10).map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => addTag(tag.name)}
                  disabled={tags.includes(tag.name) || tags.length >= 3}
                  className="rounded border border-line bg-paper/60 px-2 py-0.5 text-[10px] text-ink-soft transition hover:border-teal/35 hover:text-teal disabled:opacity-35"
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 rounded-lg border border-coral/25 bg-coral/5 px-3 py-2 text-xs text-coral">{error}</p>}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] text-teal-soft">发布后不可编辑，请确认描述完整。</p>
            <button type="submit" disabled={submitting} className="btn-amber">
              {submitting ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? '发布中…' : '发布问题'}
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-panel/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-[0.16em] text-teal-soft">问题预览</span>
              <span className="text-[9px] text-teal-soft">实时</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.length ? tags.map((tag) => <span key={tag} className="tag">#{tag}</span>) : <span className="text-[10px] text-teal-soft">标签会显示在这里</span>}
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold leading-[1.45] text-deep">
              {title || '问题标题会显示在这里'}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-teal-soft">
              <Avatar src={user?.avatar} name={user?.username || '我'} size={22} />
              <span>{user?.username}</span>
              <span>·</span>
              <span>刚刚</span>
              <span className="inline-flex items-center gap-1"><Eye size={10} /> 0</span>
            </div>
            <div className="mt-3 border-t border-line/60 pt-3">
              {content ? <Markdown content={content} className="text-[0.85rem]" /> : <p className="text-xs leading-6 text-teal-soft">问题描述会在这里实时排版。</p>}
            </div>
          </div>

          <div className="rounded-xl border border-amber/20 bg-amber/[0.04] p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-amber-deep">
              <Lightbulb size={13} /> 提问小提示
            </div>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-5 text-ink-soft">
              <li>· 说清楚「你已经试过什么」，比只说「报错了」有效。</li>
              <li>· 标题带上具体技术或场景，方便被检索到。</li>
              <li>· 一次只问一个问题，回答者更容易接住。</li>
            </ul>
          </div>

          <div className="rounded-xl bg-deep p-4 text-panel">
            <p className="text-[9px] font-bold tracking-[0.16em] text-panel/60">BEFORE YOU ASK</p>
            <p className="mt-2 font-display text-sm leading-6 text-panel/80">
              一个好问题，
              <br />
              已经包含了一半答案。
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
