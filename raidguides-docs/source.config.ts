import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

const raidGuideSchema = pageSchema.extend({
  contentStatus: z.enum(['current', 'legacy', 'coming-soon']),
  // Kept as optional retrieval metadata, but deliberately not displayed in
  // the factual content-status notice.
  editorialStatus: z.enum(['reviewed', 'needs-review']).optional(),
  lastReviewed: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD.')
    .optional(),
  mechanicsStatus: z.enum(['reviewed', 'generally-valid', 'needs-review']).optional(),
  buildsStatus: z.enum(['reviewed', 'outdated', 'needs-review']).optional(),
  phaseCount: z.number().int().positive().optional(),
});

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: raidGuideSchema,
    // Needed by getLLMText() (lib/get-llm-text.ts) to serve the fully
    // processed Markdown for the "Copy Markdown" / "View as Markdown" page
    // actions and the /llms.mdx route.
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export default defineConfig({
  mdxOptions: {
    // Add rehype/remark plugins here later if needed (e.g. for GW2 wiki-style tooltips).
  },
});
