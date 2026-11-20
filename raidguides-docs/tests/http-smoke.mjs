import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import test, { before, after } from 'node:test';

const origin = 'http://127.0.0.1:3000';
const guide = '/docs/gw2/wing-1/vale-guardian';
let server;
let output = '';

before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: '/app',
    env: { ...process.env, NODE_OPTIONS: '--require=/fixtures/fixtures/openrouter.cjs',
      OPENROUTER_API_KEY: 'ci-test-only', OPENROUTER_MODEL: 'test/model',
      HOSTNAME: '127.0.0.1', PORT: '3000', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [server.stdout, server.stderr]) {
    stream.on('data', chunk => { output = (output + chunk).slice(-30_000); });
  }
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(1_000) });
      await response.text();
      if (response.ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error(`Server did not become ready: ${output}`);
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill('SIGTERM');
    const timer = setTimeout(() => server.kill('SIGKILL'), 3_000);
    try { await exited; } finally { clearTimeout(timer); }
  }
});

function request(path, options = {}) {
  return fetch(origin + path, { ...options, signal: AbortSignal.timeout(20_000),
    headers: { 'accept-encoding': 'gzip', ...options.headers } });
}

async function chat(question) {
  const response = await request('/api/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ id: 'test-user', role: 'user', parts: [
      { type: 'text', text: question },
      { type: 'data-client', data: { location: origin + guide } },
    ] }] }),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  assert.equal(response.headers.get('x-vercel-ai-ui-message-stream'), 'v1');
  const body = await response.text();
  const events = body.split('\n').filter(line => line.startsWith('data: ') && line !== 'data: [DONE]')
    .map(line => JSON.parse(line.slice(6)));
  return { body, events };
}

test('guide HTML and Markdown remain readable with gzip negotiation', async () => {
  for (const path of [guide, guide + '.md']) {
    const response = await request(path);
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /Vale Guardian/);
    assert.match(body, /Fase 3/);
  }
});

test('search returns the canonical guide and an unrelated query has no results', async () => {
  const response = await request('/api/search?query=Vale%20Guardian');
  assert.equal(response.status, 200);
  assert.match(JSON.stringify(await response.json()), /\/docs\/gw2\/wing-1\/vale-guardian/);
  const unknown = await request('/api/search?query=zzzxxyyqqnonexistent');
  assert.equal(unknown.status, 200);
  assert.deepEqual(await unknown.json(), []);
});

test('invalid JSON, missing messages, empty questions and excessive length are rejected', async () => {
  for (const body of ['{', '{}', '{"messages":[]}', JSON.stringify({ messages: [
    { id: 'long-question', role: 'user', parts: [{ type: 'text', text: 'x'.repeat(2_001) }] },
  ] })]) {
    const response = await request('/api/chat', { method: 'POST',
      headers: { 'content-type': 'application/json' }, body });
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, 'string');
  }
});

test('actual chat route retrieves content and finishes its SSE response with canonical sources', async () => {
  const { events } = await chat('Quantas fases tem o Vale Guardian?');
  assert.equal(events.filter(event => event.type === 'text-delta').map(event => event.delta).join(''),
    'O Vale Guardian tem três fases.');
  assert.deepEqual(events.filter(event => event.type === 'data-sources').flatMap(event => event.data), [
    { url: guide, title: 'Vale Guardian' },
  ]);
  assert.ok(events.some(event => event.type === 'finish'));
  assert.ok(!events.some(event => event.type === 'error'));
});

test('an unrelated chat question does not claim retrieved sources', async () => {
  const { events } = await chat('Como cultivo batatas em Marte?');
  assert.ok(events.some(event => event.type === 'finish'));
  assert.ok(!events.some(event => event.type === 'data-sources'));
  assert.ok(!events.some(event => event.type === 'error'));
});

test('provider failure reaches the UI without leaking provider details or claiming sources', async () => {
  const { body, events } = await chat('[fixture-provider-error]');
  assert.ok(events.some(event => event.type === 'error'));
  assert.ok(!events.some(event => event.type === 'data-sources'));
  assert.doesNotMatch(body, /FIXTURE_PRIVATE_PROVIDER_DETAIL|ci-test-only/);
});
