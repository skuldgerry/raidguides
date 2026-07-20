import { source } from '@/lib/source';

// Converts a doc page into a plain Markdown document — used by the
// "Copy Markdown" page action and the /llms.mdx/docs/[[...slug]] route,
// which in turn backs "View as Markdown" and the Open in ChatGPT/Claude/
// Cursor page actions (they all point AI tools at that raw-markdown URL).
export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
