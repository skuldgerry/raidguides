import type { ReactNode } from 'react';

type GuideTermProps = {
  children: ReactNode;
  description: string;
  href: `#${string}`;
  tooltipId: string;
};

/**
 * Contextual guide term: hover/focus shows a short definition and activating
 * the link moves to the complete explanation on the same page.
 */
export function GuideTerm({ children, description, href, tooltipId }: GuideTermProps) {
  return (
    <span className="group/term relative inline-block">
      <a
        href={href}
        className="font-semibold text-fd-foreground underline decoration-dotted underline-offset-4 hover:text-fd-primary"
        aria-describedby={tooltipId}
      >
        {children}
      </a>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-left text-xs leading-relaxed font-normal text-fd-foreground opacity-0 shadow-xl transition-opacity group-hover/term:block group-hover/term:opacity-100 group-focus-within/term:block group-focus-within/term:opacity-100"
      >
        {description}
      </span>
    </span>
  );
}
