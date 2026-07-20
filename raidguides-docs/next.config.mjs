import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
  // Allows local verification builds to avoid transient OneDrive locks while
  // keeping Next's conventional `.next` directory everywhere else.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  images: {
    // Media is self-hosted from /public/media, no remote optimization needed.
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Lets any doc URL be fetched as raw Markdown by appending .md — used
      // by the "View as Markdown" / "Copy Markdown" page actions and by AI
      // tools (ChatGPT, Claude, Cursor) that are pointed at that URL.
      {
        source: '/docs/:path*.md',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
};

export default withMDX(config);
