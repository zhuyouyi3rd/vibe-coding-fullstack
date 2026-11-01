import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

export function CoverImage({
  src,
  alt,
  className = '',
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-paper-deep via-sand/70 to-moss/40 text-forest/40 ${className}`}
      >
        <div className="flex flex-col items-center gap-2">
          <ImageOff size={26} strokeWidth={1.4} />
          <span className="text-[10px] font-semibold tracking-[0.2em]">SHIYU NOTES</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
