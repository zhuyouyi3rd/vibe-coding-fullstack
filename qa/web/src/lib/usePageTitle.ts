import { useEffect } from 'react';

const SITE = '问渠';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} · 把问题问清楚`;
  }, [title]);
}
