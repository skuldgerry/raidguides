import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// Root cause of the earlier "TypeError: a.map is not a function" crash:
// fumadocs-core@15.8.5's loader() expected `source.files` as an array, but
// the fumadocs-mdx version pinned at the time returned a lazy function — an
// API-contract mismatch between independently-versioned packages within the
// 15.x line. No compatible fumadocs-core/fumadocs-mdx pairing was found
// within 15.x for this project's needs, so the whole stack was moved to the
// coordinated Fumadocs v16 release train (see package.json), which resolves
// the mismatch and restores this to the plain documented usage.
export const { GET } = createFromSource(source);
