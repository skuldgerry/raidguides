import assert from 'node:assert/strict';
import test from 'node:test';
import { createUIMessageStreamResponse, readUIMessageStream, type UIMessage, type UIMessageChunk } from 'ai';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import { getRetrievedSources, rehypeDisableLinks, withRetrievedSources, type RetrievedSource } from '../lib/ai/citations';
import { buildRetrievalIndex, retrieveDocuments, type RetrievalMatch } from '../lib/ai/retrieval';

const url = '/docs/gw2/wing-1/vale-guardian';
const source = { url, title: 'Vale Guardian' };
const index = buildRetrievalIndex([{ ...source, content: 'O Vale Guardian tem três fases.', phaseCount: 3 }]);

test('retrieval yields one canonical source per page, independently of generated text', () => {
  const matches = retrieveDocuments(index, { query: 'Quantas fases tem o VG?' });
  assert.ok(matches.length > 1);
  assert.deepEqual(getRetrievedSources(matches, index.pageUrls), [source]);
});

test('sources reject invented hosts, unknown pages and noncanonical paths', () => {
  const urls = [url, 'https://docs.gw2/wing-1/vale-guardian', '//evil.example/docs/gw2',
    '/docs/unknown', '/docs/../outside', '/docs/%2e%2e/outside', `${url}?redirect=evil`, `${url}#invented`, '/docs/\\evil'];
  const matches = urls.map((pageUrl) => ({ pageUrl, pageTitle: 'Guide', heading: '', content: '', score: 1 } satisfies RetrievalMatch));
  // Even an unexpected entry in the index cannot turn into an external route.
  const result = getRetrievedSources(matches, new Set(urls.filter((value) => value !== '/docs/unknown')));
  assert.deepEqual(result, [{ url, title: 'Guide' }]);
});

async function collect(chunks: UIMessageChunk[]) {
  const input = new ReadableStream<UIMessageChunk>({ start(controller) {
    chunks.forEach((chunk) => controller.enqueue(chunk));
    controller.close();
  } });
  const output: UIMessageChunk[] = [];
  const reader = withRetrievedSources(input, [source]).getReader();
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    output.push(next.value);
  }
  return output;
}

test('the UI protocol retains server sources and ignores provider references', async () => {
  const output = await collect([
    { type: 'start', messageId: 'answer' },
    { type: 'text-start', id: 'text' },
    { type: 'text-delta', id: 'text', delta: '[VG](https://docs.gw2/wing-1/vale-guardian)' },
    { type: 'text-end', id: 'text' },
    { type: 'source-url', sourceId: 'invented', url: 'https://docs.gw2/wing-1/vale-guardian' },
    { type: 'data-sources', data: [{ url: 'https://evil.example', title: 'Invented' }] },
    { type: 'finish', finishReason: 'stop' },
  ]);
  assert.equal(output.at(-2)?.type, 'data-sources');
  assert.equal(output.at(-1)?.type, 'finish');
  assert.ok(!output.some((part) => part.type === 'source-url'));
  const response = createUIMessageStreamResponse({ stream: new ReadableStream({ start(controller) {
    output.forEach((chunk) => controller.enqueue(chunk));
    controller.close();
  } }) });
  assert.equal(response.headers.get('x-vercel-ai-ui-message-stream'), 'v1');
  let message: UIMessage<unknown, { sources: RetrievedSource[] }> | undefined;
  for await (const next of readUIMessageStream<UIMessage<unknown, { sources: RetrievedSource[] }>>({
    stream: new ReadableStream({ start(controller) {
      output.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    } }),
  })) message = next;
  assert.deepEqual(message?.parts.find((part) => part.type === 'data-sources')?.data, [source]);
});

test('failed, aborted, filtered and empty answers do not present completed sources', async () => {
  const text: UIMessageChunk = { type: 'text-delta', id: 'text', delta: 'Partial' };
  for (const chunks of [
    [{ type: 'finish' }],
    [text, { type: 'error', errorText: 'Failed' }, { type: 'finish' }],
    [text, { type: 'abort' }, { type: 'finish' }],
    [text, { type: 'finish', finishReason: 'content-filter' }],
    [text, { type: 'finish', finishReason: 'error' }],
  ] satisfies UIMessageChunk[][]) {
    assert.ok(!(await collect(chunks)).some((part) => part.type === 'data-sources'));
  }
});

test('a question without retrieved documents produces no source list', async () => {
  const matches = retrieveDocuments(index, { query: 'Como cultivo batatas em Marte?' });
  assert.deepEqual(matches, []);
  const input = new ReadableStream<UIMessageChunk>({ start(controller) {
    controller.enqueue({ type: 'text-delta', id: 'text', delta: 'Não encontrei a resposta.' });
    controller.enqueue({ type: 'finish', finishReason: 'stop' });
    controller.close();
  } });
  const response = createUIMessageStreamResponse({ stream: withRetrievedSources(input, getRetrievedSources(matches, index.pageUrls)) });
  assert.doesNotMatch(await response.text(), /data-sources/);
});

test('inline, reference and automatic model links render without clickable URLs', async () => {
  const processor = remark().use(remarkGfm).use(remarkRehype).use(rehypeDisableLinks);
  const tree = await processor.run(processor.parse([
    '[Vale Guardian](https://docs.gw2/wing-1/vale-guardian)',
    '<https://evil.example> and https://other.example',
    '[VG][guide]\n\n[guide]: /docs/gw2/wing-1/vale-guardian',
    'Three phases: **Fase 1**, Fase 2, Fase 3.',
  ].join('\n\n')));
  const texts: string[] = [];
  visit(tree, 'element', (node) => assert.notEqual(node.tagName, 'a'));
  visit(tree, 'text', (node) => { texts.push(node.value); });
  assert.match(texts.join(''), /Vale Guardian/);
  assert.match(texts.join(''), /Fase 1/);
});
