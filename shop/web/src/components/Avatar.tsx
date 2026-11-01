import { useState } from 'react';

export function Avatar({ src, name, size = 34 }: { src?: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={`${name}的头像`} style={{ width: size, height: size }} onError={() => setFailed(true)} className="shrink-0 rounded-full border border-white/70 object-cover" />;
  }
  return (
    <span style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-brick font-display font-semibold text-panel">
      {name.slice(0, 1) || '云'}
    </span>
  );
}
