import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { Banner } from 'fumadocs-ui/components/banner';
import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangleIcon, GithubIcon, MessageCircleIcon } from 'lucide-react';
import { source } from '@/lib/source';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search';
import { DiscordIcon } from '@/components/discord-icon';
import { GameThemeWrapper } from './game-theme';

// `source` is still needed for `tree={source.pageTree}` below.
const DISCORD_URL = 'https://discord.gg/nqqrpwrcpM';
const GITHUB_URL = 'https://github.com/skuldgerry/raidguides';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <GameThemeWrapper>
      <Banner
        id="gw2-legacy-guides-v1"
        className="border-b border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-[#211707] dark:text-amber-50"
        height="var(--raidguides-banner-height)"
      >
        <span className="flex h-full items-center gap-2 py-2 pe-8 text-xs sm:text-sm">
          <AlertTriangleIcon aria-hidden="true" className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Estas guias de Guild Wars 2 podem não estar totalmente atualizadas. As mecânicas continuam, em geral, válidas, mas
            referências a classes, builds e composições podem estar desatualizadas.
          </span>
        </span>
      </Banner>
      <DocsLayout
        tree={source.pageTree}
        links={[
          {
            type: 'icon',
            label: 'Discord',
            text: 'Discord',
            url: DISCORD_URL,
            external: true,
            icon: <DiscordIcon className="size-4" />,
          },
          {
            type: 'icon',
            label: 'GitHub',
            text: 'GitHub',
            url: GITHUB_URL,
            external: true,
            icon: <GithubIcon className="size-4" />,
          },
        ]}
        nav={{
          title: (
            <span className="flex items-center gap-2">
              <img src="/logo.png" alt="" width={20} height={20} className="rounded-sm" />
              <span className="font-bold">Raid Guides</span>
            </span>
          ),
        }}
        // Each content/docs/<game>/meta.json with "root": true automatically
        // becomes an entry in the sidebar's game-switcher dropdown —
        // root-folder tab detection is fumadocs-ui's default, no `tabs`
        // option needed. Order comes from content/docs/meta.json's `pages`
        // array (gw2 first, division-2 second).
        sidebar={{
          tabs: {
            transform(option) {
              // Match against the tab's own url (e.g. "/docs/gw2") rather
              // than source.getNodeMeta(node)'s internal shape, which varies
              // across fumadocs-core versions and doesn't reliably expose a
              // `.file.dirname` field on this version (16.x).
              const match = option.url?.match(/^\/docs\/(gw2|division-2)(?:\/|$)/);
              const dir = match?.[1];
              if (dir !== 'gw2' && dir !== 'division-2') return option;

              return {
                ...option,
                // Tints the tab's icon/selected-state to each game's own
                // branding color via the CSS vars defined in app/global.css.
                props: {
                  ...option.props,
                  style: {
                    ...option.props?.style,
                    '--tab-color': `var(--${dir}-color)`,
                  } as CSSProperties & Record<'--tab-color', string>,
                },
              };
            },
          },
        }}
      >
        <AISearch>
          <AISearchPanel />
          {children}
          <AISearchTrigger
            position="float"
            className={cn(
              buttonVariants({
                color: 'secondary',
                className: 'text-fd-muted-foreground rounded-2xl',
              }),
            )}
          >
            <MessageCircleIcon className="size-4.5" />
            Ask AI
          </AISearchTrigger>
        </AISearch>
      </DocsLayout>
    </GameThemeWrapper>
  );
}
