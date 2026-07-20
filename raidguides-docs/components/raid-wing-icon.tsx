import type { ComponentProps } from 'react';

type WingNumber = 1 | 2 | 3 | 4;

const numberPaths: Record<WingNumber, string> = {
  1: 'M10.25 10.5 12.5 9v7',
  2: 'M9.5 10.75C10 9.6 10.85 9 12.1 9c1.45 0 2.4.8 2.4 1.95 0 1.05-.55 1.7-1.65 2.45L9.5 16h5',
  3: 'M9.75 9.4h4.5l-2.45 2.65c1.7 0 2.75.7 2.75 2 0 1.35-1.15 2.2-2.85 2.2-1.05 0-1.95-.35-2.55-1',
  4: 'M13.75 16V9.1l-4.5 4.45h6',
};

/**
 * A compact, original raid-portal badge for the Guild Wars 2 wing navigation.
 * It uses only currentColor and opacity, so it inherits the active game colour
 * from Fumadocs in both light and dark themes.
 */
export function RaidWingIcon({
  wing,
  ...props
}: ComponentProps<'svg'> & { wing: WingNumber }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Recessed arched door: a quieter shade of the same colour. */}
      <path
        d="M7.25 22V11.25a4.75 4.75 0 0 1 9.5 0V22h-9.5Z"
        fill="currentColor"
        opacity="0.2"
      />

      {/* Square gatehouse with battlements, designed to survive at 16px. */}
      <path
        d="M2 22V5h3V2h3v3h2V2h4v3h2V2h3v3h3v17h-5V11a5 5 0 0 0-10 0v11H2Z"
        fill="currentColor"
      />

      {/* Stone courses and threshold reinforce the medieval-gate silhouette. */}
      <path
        d="M2.5 9h4.75m9.5 0h4.75m-19 6h4.75m9.5 0h4.75"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      <path d="M6.25 20.25h11.5V22H6.25z" fill="currentColor" opacity="0.7" />

      {/* Vector numerals stay consistent regardless of the user's font. */}
      <path
        d={numberPaths[wing]}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RaidWing1Icon(props: ComponentProps<'svg'>) {
  return <RaidWingIcon wing={1} {...props} />;
}

export function RaidWing2Icon(props: ComponentProps<'svg'>) {
  return <RaidWingIcon wing={2} {...props} />;
}

export function RaidWing3Icon(props: ComponentProps<'svg'>) {
  return <RaidWingIcon wing={3} {...props} />;
}

export function RaidWing4Icon(props: ComponentProps<'svg'>) {
  return <RaidWingIcon wing={4} {...props} />;
}
