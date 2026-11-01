import { Check, Link2 } from 'lucide-react';
import { CoverImage } from './CoverImage';

const presets = [
  '/covers/cover-1.svg',
  '/covers/cover-2.svg',
  '/covers/cover-3.svg',
  '/covers/cover-4.svg',
  '/covers/cover-5.svg',
  '/covers/cover-6.svg',
];

interface CoverPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CoverPicker({ value, onChange }: CoverPickerProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const selected = value === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`group relative overflow-hidden rounded-lg border-2 transition ${
                selected ? 'border-clay' : 'border-transparent hover:border-line'
              }`}
              aria-label={`选择封面 ${preset}`}
              aria-pressed={selected}
            >
              <CoverImage
                src={preset}
                alt=""
                className="aspect-[16/10] w-full object-cover transition group-hover:scale-105"
              />
              {selected && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-clay text-paper shadow">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative mt-2.5">
        <Link2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-moss" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field py-2! pl-9! text-xs!"
          placeholder="或粘贴图片地址 /covers/cover-1.svg"
        />
      </div>
    </div>
  );
}
