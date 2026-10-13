import type { UIMessageChunk } from 'ai';
import type { Root } from 'hast';
import { visit } from 'unist-util-visit';
import type { RetrievalMatch } from './retrieval';

export interface RetrievedSource {
  url: string;
  title: string;
}

export function getRetrievedSources(matches: RetrievalMatch[], pageUrls: Set<string>) {
  const sources = new Map<string, RetrievedSource>();
  for (const match of matches) {
    const url = match.pageUrl;
    // Keep canonical, same-site routes from the documentation index only.
    if (!pageUrls.has(url) || !url.startsWith('/docs/') || url.includes('\\')) continue;
    const parsed = new URL(url, 'https://docs.raidguides.pt');
    if (parsed.origin !== 'https://docs.raidguides.pt' || parsed.pathname !== url || parsed.search || parsed.hash) continue;
    sources.set(url, { url, title: match.pageTitle });
  }
  return [...sources.values()];
}

export function withRetrievedSources(stream: ReadableStream<UIMessageChunk>, sources: RetrievedSource[]) {
  let hasText = false;
  let failed = false;
  return stream.pipeThrough(new TransformStream<UIMessageChunk, UIMessageChunk>({
    transform(chunk, controller) {
      // Provider-generated references cannot replace the retrieved source list.
      if (chunk.type === 'source-url' || chunk.type === 'source-document' || chunk.type === 'data-sources') return;
      if (chunk.type === 'error' || chunk.type === 'abort') failed = true;
      if (chunk.type === 'text-delta' && chunk.delta.trim()) hasText = true;
      if (chunk.type === 'finish' && hasText && !failed && sources.length > 0 &&
          chunk.finishReason !== 'error' && chunk.finishReason !== 'content-filter') {
        controller.enqueue({ type: 'data-sources', data: sources });
      }
      controller.enqueue(chunk);
    },
  }));
}

// Markdown links from the model remain readable text. Clickable references
// are rendered separately from the server's validated retrieval results.
export function rehypeDisableLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'a') {
        node.tagName = 'span';
        node.properties = {};
      }
    });
  };
}
