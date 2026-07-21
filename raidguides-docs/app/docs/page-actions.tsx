'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { GitHubIcon } from '@/components/github-icon';

// Self-built "Page Actions" bar, styled after Fumadocs' own docs site:
// a "Copy Markdown" button plus a dropdown with links that hand the page's
// raw Markdown (served at `${page.url}.md`, see next.config.mjs rewrites +
// app/llms.mdx/docs/[[...slug]]/route.ts) to various AI tools.
export function PageActions({
  markdownUrl,
  sourcePath,
}: {
  markdownUrl: string;
  sourcePath: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  async function copyMarkdown() {
    try {
      const res = await fetch(markdownUrl);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard/network access can fail silently (e.g. no HTTPS context) —
      // not worth surfacing a hard error for a convenience action.
    }
  }

  const absoluteMarkdownUrl =
    typeof window !== 'undefined'
      ? new URL(markdownUrl, window.location.origin).toString()
      : markdownUrl;

  const links = [
    {
      label: 'Open in ChatGPT',
      href: `https://chat.openai.com/?q=${encodeURIComponent(`Read ${absoluteMarkdownUrl} so I can ask questions about it.`)}`,
    },
    {
      label: 'Open in Claude',
      href: `https://claude.ai/new?q=${encodeURIComponent(`Read ${absoluteMarkdownUrl} so I can ask questions about it.`)}`,
    },
    {
      label: 'Open in Cursor',
      href: `https://cursor.com/link?url=${encodeURIComponent(absoluteMarkdownUrl)}`,
    },
    {
      label: 'View as Markdown',
      href: markdownUrl,
    },
    {
      label: 'Open in GitHub',
      href: `https://github.com/skuldgerry/raidguides/blob/main/raidguides-docs/content/docs/${sourcePath}`,
      icon: GitHubIcon,
    },
  ];

  return (
    <div className="flex flex-row items-center gap-2 border-b pt-2 pb-6">
      <button
        type="button"
        onClick={copyMarkdown}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Copiado!' : 'Copy Markdown'}
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors"
        >
          <ChevronDown className="size-3.5" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute left-0 z-50 mt-1 min-w-[200px] rounded-md border bg-fd-popover p-1 shadow-md"
          >
            {links.map((link) => {
              const Icon = link.icon ?? (link.label === 'View as Markdown' ? FileText : ExternalLink);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-fd-popover-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
                  onClick={() => setOpen(false)}
                >
                  <Icon className="size-3.5" />
                  {link.label}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
