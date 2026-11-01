import { useState } from 'react';

export function Avatar({
  src,
  name,
  size = 36,
  className = '',
}: {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${name}的头像`}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full border border-white/70 object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-deep font-display font-semibold text-panel ${className}`}
    >
      {name.slice(0, 1) || '问'}
    </span>
  );
}
