import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildRetrievalIndex,
  retrieveDocuments,
  type RetrievalPage,
} from '../lib/ai/retrieval';

function readGuide(relativePath: string, url: string, title: string): RetrievalPage {
  const raw = readFileSync(path.join(process.cwd(), relativePath), 'utf8');
  const content = raw.replace(/^---[\s\S]*?---\s*/, '');
  return { url, title, content };
}

const valeGuardian = readGuide(
  'content/docs/gw2/wing-1/vale-guardian.mdx',
  '/docs/gw2/wing-1/vale-guardian',
  'Vale Guardian',
);
valeGuardian.contentStatus = 'legacy';
valeGuardian.mechanicsStatus = 'needs-review';
valeGuardian.buildsStatus = 'outdated';
valeGuardian.phaseCount = 3;
const sabetha = readGuide(
  'content/docs/gw2/wing-1/sabetha.mdx',
  '/docs/gw2/wing-1/sabetha',
  'Sabetha',
);
const index = buildRetrievalIndex([valeGuardian, sabetha]);

test('recupera as três fases do Vale Guardian a partir da página atual', () => {
  const matches = retrieveDocuments(index, {
    query: 'Quantas fases tem o Vale Guardian?',
    location: 'http://localhost:3000/docs/gw2/wing-1/vale-guardian',
  });
  const headingsAndContent = matches
    .map((match) => `${match.heading}\n${match.content}`)
    .join('\n');

  assert.match(headingsAndContent, /Fase 1/);
  assert.match(headingsAndContent, /Fase 2/);
  assert.match(headingsAndContent, /Fase 3/);
  assert.match(headingsAndContent, /Número de fases: 3/);
});

test('resolve o acrónimo VG mesmo sem contexto de página', () => {
  const matches = retrieveDocuments(index, {
    query: 'quantas fases tem o VG?',
  });

  assert.ok(matches.length > 0);
  assert.equal(matches[0].pageTitle, 'Vale Guardian');
  assert.ok(matches.every((match) => match.pageTitle === 'Vale Guardian'));
});

test('encontra a transição aos 66 por cento', () => {
  const matches = retrieveDocuments(index, {
    query: 'O que acontece aos 66% no Vale Guardian?',
  });

  assert.ok(
    matches.some(
      (match) => match.pageTitle === 'Vale Guardian' && match.content.includes('66%'),
    ),
  );
});

test('não devolve documentação para uma pergunta sem correspondência', () => {
  const matches = retrieveDocuments(index, {
    query: 'Como cultivo batatas em Marte?',
  });

  assert.deepEqual(matches, []);
});
