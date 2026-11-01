import { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().slice(0, 1) || '拾';
  const style = { width: size, height: size };

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${name}的头像`}
        style={style}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full border border-white/60 object-cover shadow-sm ${className}`}
      />
    );
  }

  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/60 bg-gradient-to-br from-forest to-moss font-display font-semibold text-paper shadow-sm ${className}`}
      aria-label={name}
    >
      {initial}
    </span>
  );
}
