import type { ComponentProps } from 'react';

/**
 * Monochrome game marks for the compact Fumadocs game selector.
 * Both use currentColor so the active game theme controls their colour.
 */
export function GuildWars2Icon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      {/* Compact GW wordmark, paired with a dragon-like numeral two. */}
      <path
        d="M8.2 7.2H5.8a3.7 3.7 0 0 0 0 7.4h2.6v-3.1H6.6M9.4 7.2l1.1 7.4 2-4.3 2 4.3 1.1-7.4"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.2 8.1c.5-1.2 1.4-1.8 2.6-1.8 1.5 0 2.5.8 2.5 2 0 1-.6 1.7-1.8 2.5l-3.1 2.3h5.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m17.6 7.2-.9-1.3 1.7.4.9-1.3.3 1.5"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.45"
        strokeLinejoin="round"
      />
      <circle cx="19.3" cy="7.7" r="0.5" fill="currentColor" />
      <path d="M16.8 16.9h5.7" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
    </svg>
  );
}

export function Division2Icon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      {/* Segmented SHD-style ring with a vector numeral two at the centre. */}
      <circle
        cx="12"
        cy="12"
        r="8.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="3.4 1.35"
      />
      <path
        d="M8.7 10.1c.5-1.5 1.6-2.2 3.3-2.2 2 0 3.3 1 3.3 2.5 0 1.4-.8 2.2-2.3 3.1l-3.8 2.6h6.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 1v2m0 18v2M1 12h2m18 0h2" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
    </svg>
  );
}
