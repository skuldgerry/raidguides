import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.raidguides.pt'),
  title: {
    default: 'Raid Guides',
    template: '%s · Raid Guides',
  },
  description: 'Guias comunitárias para raids em Português.',
};

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
