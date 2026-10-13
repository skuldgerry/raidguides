import assert from 'node:assert/strict';
import test from 'node:test';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createUIMessageStreamResponse, streamText, toUIMessageStream } from 'ai';
import { withRetrievedSources } from '../lib/ai/citations';

test('OpenRouter streams through the installed AI SDK to the chat UI', async () => {
  const requests: Request[] = [];
  const answer = 'O Vale Guardian tem três fases.';
  const chunks = [
    { id: 'test-chat', model: 'test/model', created: 1, choices: [{ index: 0, delta: { role: 'assistant', content: answer }, finish_reason: null }] },
    { id: 'test-chat', model: 'test/model', created: 1, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 } },
  ];
  const provider = createOpenRouter({
    apiKey: 'ci-test-only',
    fetch: async (input, init) => {
      requests.push(new Request(input, init));
      return new Response(
        chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n',
        { headers: { 'content-type': 'text/event-stream' } },
      );
    },
  });
  const result = streamText({
    model: provider('test/model'),
    system: 'Responde com base nas guias.',
    messages: [{ role: 'user', content: 'Quantas fases tem o VG?' }],
    maxOutputTokens: 1_000,
    temperature: 0.2,
  });
  const response = createUIMessageStreamResponse({
    stream: withRetrievedSources(toUIMessageStream({ stream: result.stream }), [
      { url: '/docs/gw2/wing-1/vale-guardian', title: 'Vale Guardian' },
    ]),
  });
  const body = await response.text();
  const events = body.split('\n')
    .filter((line) => line.startsWith('data: ') && line !== 'data: [DONE]')
    .map((line) => JSON.parse(line.slice(6)) as { type: string; delta?: string });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(requests[0].headers.get('authorization'), 'Bearer ci-test-only');
  const requestBody = await requests[0].json();
  assert.equal(requestBody.model, 'test/model');
  assert.equal(requestBody.stream, true);
  assert.equal(requestBody.max_tokens, 1_000);
  assert.equal(response.headers.get('x-vercel-ai-ui-message-stream'), 'v1');
  assert.equal(events.filter((event) => event.type === 'text-delta').map((event) => event.delta).join(''), answer);
  assert.ok(events.some((event) => event.type === 'finish'));
  assert.ok(events.some((event) => event.type === 'data-sources'));
  assert.ok(!events.some((event) => event.type === 'error'));
});

test('OpenRouter errors reach the UI stream without disclosing provider details', async () => {
  const errors: unknown[] = [];
  const provider = createOpenRouter({
    apiKey: 'ci-test-only',
    fetch: async () => new Response(JSON.stringify({
      error: { message: 'Internal provider detail that must stay private', code: 401 },
    }), { status: 401, headers: { 'content-type': 'application/json' } }),
  });
  const result = streamText({
    model: provider('test/model'),
    prompt: 'Pergunta de teste',
    maxRetries: 0,
    onError: ({ error }) => { errors.push(error); },
  });
  const response = createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
  const body = await response.text();
  assert.equal(errors.length, 1);
  assert.match(body, /"type":"error"/);
  assert.doesNotMatch(body, /Internal provider detail/);
});
