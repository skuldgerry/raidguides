const assert = require('node:assert/strict');

// Loaded only by the isolated HTTP test process. The container has no network.
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  assert.equal(request.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(request.headers.get('authorization'), 'Bearer ci-test-only');
  const body = await request.json();
  assert.equal(body.model, 'test/model');
  assert.equal(body.stream, true);
  assert.equal(body.max_tokens, 1_000);
  const messages = JSON.stringify(body.messages);
  if (messages.includes('[fixture-provider-error]')) {
    return Response.json({ error: { code: 401, message: 'FIXTURE_PRIVATE_PROVIDER_DETAIL' } }, { status: 401 });
  }
  const unknown = messages.includes('batatas em Marte');
  if (!unknown) {
    assert.match(messages, /CONTEXTO RECUPERADO/);
    assert.match(messages, /Número de fases: 3/);
    assert.match(messages, /Fase 3/);
    assert.match(messages, /\/docs\/gw2\/wing-1\/vale-guardian/);
  }
  const answer = unknown ? 'Não encontrei a resposta.' : 'O Vale Guardian tem três fases.';
  const chunks = [
    { id: 'fixture-chat', model: 'test/model', created: 1, choices: [{ index: 0, delta: { role: 'assistant', content: answer }, finish_reason: null }] },
    { id: 'fixture-chat', model: 'test/model', created: 1, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 } },
  ];
  return new Response(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n', {
    headers: { 'content-type': 'text/event-stream' },
  });
};
