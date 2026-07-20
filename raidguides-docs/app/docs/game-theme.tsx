'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Scopes the active accent color (--color-fd-primary, see app/global.css)
// to whichever game root the user is currently browsing, by setting a
// data-game attribute derived from the URL (/docs/gw2/... or
// /docs/division-2/...).
export function GameThemeWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const match = pathname.match(/^\/docs\/(gw2|division-2)(?:\/|$)/);
  const game = match?.[1];

  return <div data-game={game}>{children}</div>;
}
