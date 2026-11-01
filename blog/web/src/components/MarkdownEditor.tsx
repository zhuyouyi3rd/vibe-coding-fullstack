import { useRef, type KeyboardEvent } from 'react';
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  Link2,
  List,
  Quote,
  SeparatorHorizontal,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const tools = [
  { key: 'bold', label: '加粗', icon: Bold },
  { key: 'italic', label: '斜体', icon: Italic },
  { key: 'heading', label: '二级标题', icon: Heading2 },
  { key: 'quote', label: '引用', icon: Quote },
  { key: 'list', label: '列表', icon: List },
  { key: 'link', label: '链接', icon: Link2 },
  { key: 'code', label: '代码', icon: Code2 },
  { key: 'divider', label: '分割线', icon: SeparatorHorizontal },
] as const;

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const replaceSelection = (before: string, after = '', placeholder = '') => {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const prefixLine = (prefix: string) => {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const handleTool = (key: (typeof tools)[number]['key']) => {
    switch (key) {
      case 'bold':
        return replaceSelection('**', '**', '加粗文字');
      case 'italic':
        return replaceSelection('*', '*', '斜体文字');
      case 'heading':
        return prefixLine('## ');
      case 'quote':
        return prefixLine('> ');
      case 'list':
        return prefixLine('- ');
      case 'link':
        return replaceSelection('[', '](https://)', '链接文字');
      case 'code':
        return replaceSelection('`', '`', '代码');
      case 'divider':
        return replaceSelection('\n\n---\n\n');
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      replaceSelection('  ');
    }
  };

  return (
    <div className="overflow-hidden rounded-[1.1rem] border border-line bg-paper-light/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 bg-paper-deep/35 px-3 py-2">
        <div className="flex flex-wrap items-center gap-0.5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                onClick={() => handleTool(tool.key)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft/80 transition hover:bg-paper hover:text-forest-deep"
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
        <span className="pr-1 text-[10px] tracking-[0.12em] text-moss">MARKDOWN</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className="editor-area min-h-[24rem] px-4 py-4 sm:min-h-[32rem] sm:px-5"
        placeholder={'从这里开始写。\n\n支持 Markdown：## 小标题、**加粗**、> 引用、`代码`、- 列表……'}
        spellCheck={false}
      />
      <div className="flex items-center justify-between border-t border-line/60 px-4 py-2 text-[10px] text-moss">
        <span>Tab 插入缩进</span>
        <span>{value.length.toLocaleString('zh-CN')} 字符</span>
      </div>
    </div>
  );
}
