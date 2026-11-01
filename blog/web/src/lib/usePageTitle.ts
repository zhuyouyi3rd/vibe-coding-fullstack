import { useEffect } from 'react';

const SITE_NAME = '拾语';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · 把想法写下来`;
  }, [title]);
}
