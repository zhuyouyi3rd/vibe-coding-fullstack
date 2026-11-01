import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const tag = draft.trim().replace(/^#/, '');
    if (!tag) return;
    if (!value.includes(tag) && value.length < 8) onChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
      event.preventDefault();
      addTag();
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <div className="flex min-h-[2.55rem] flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white/55 px-2.5 py-2 transition focus-within:border-forest/55 focus-within:bg-white/80">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-[11px] font-medium text-forest"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              className="rounded-full p-0.5 transition hover:bg-forest/15"
              aria-label={`移除标签 ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={addTag}
          className="min-w-24 flex-1 border-0 bg-transparent px-1 py-0.5 text-xs outline-none placeholder:text-moss/60"
          placeholder={value.length ? '' : '输入标签，回车添加'}
          maxLength={20}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-moss">最多 8 个，回车或逗号分隔</p>
    </div>
  );
}
