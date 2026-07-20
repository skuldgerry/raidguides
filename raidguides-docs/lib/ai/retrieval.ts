export interface RetrievalPage {
  url: string;
  title: string;
  description?: string;
  content: string;
  contentStatus?: 'current' | 'legacy' | 'coming-soon';
  editorialStatus?: 'reviewed' | 'needs-review';
  mechanicsStatus?: 'reviewed' | 'generally-valid' | 'needs-review';
  buildsStatus?: 'reviewed' | 'outdated' | 'needs-review';
  phaseCount?: number;
}

interface IndexedSection {
  id: string;
  pageUrl: string;
  pageTitle: string;
  heading: string;
  content: string;
  kind: 'metadata' | 'outline' | 'section';
  titleSearch: string;
  headingSearch: string;
  contentSearch: string;
  aliases: string[];
}

export interface RetrievalIndex {
  sections: IndexedSection[];
  pageUrls: Set<string>;
}

export interface RetrievalMatch {
  pageUrl: string;
  pageTitle: string;
  heading: string;
  content: string;
  score: number;
}

export interface RetrievalOptions {
  query: string;
  location?: string;
  limit?: number;
  maxCharacters?: number;
}

const STOP_WORDS = new Set([
  'a',
  'ao',
  'aos',
  'as',
  'como',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'esta',
  'este',
  'isto',
  'me',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'qual',
  'quais',
  'que',
  'quantas',
  'quantos',
  'se',
  'sobre',
  'tem',
  'uma',
  'um',
]);

const ACRONYM_IGNORED_WORDS = new Set([
  ...STOP_WORDS,
  'the',
  'of',
  'and',
]);

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function createAliases(page: RetrievalPage) {
  const titleWords = tokenize(page.title).filter(
    (word) => !ACRONYM_IGNORED_WORDS.has(word),
  );
  const acronym = titleWords.map((word) => word[0]).join('');
  const slug = page.url.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ');

  return Array.from(
    new Set(
      [acronym.length >= 2 ? acronym : '', slug ? normalizeSearchText(slug) : ''].filter(
        Boolean,
      ),
    ),
  );
}

function cleanContent(content: string) {
  return content
    .replace(/^import\s.+;\s*$/gm, '')
    .replace(/^export\s.+;\s*$/gm, '')
    .trim();
}

function splitSections(page: RetrievalPage) {
  const lines = cleanContent(page.content).split(/\r?\n/);
  const sections: Array<{ heading: string; content: string }> = [];
  let heading = 'Visão geral';
  let body: string[] = [];

  function flush() {
    const content = body.join('\n').trim();
    if (content) sections.push({ heading, content });
    body = [];
  }

  for (const line of lines) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (match) {
      flush();
      heading = match[2].replace(/[*_`]/g, '').trim();
      body.push(line);
    } else {
      body.push(line);
    }
  }
  flush();

  return sections;
}

export function buildRetrievalIndex(pages: RetrievalPage[]): RetrievalIndex {
  const indexed: IndexedSection[] = [];

  for (const page of pages) {
    const aliases = createAliases(page);
    const sections = splitSections(page);
    const metadata = [
      page.contentStatus === 'legacy' ? 'Estado: conteúdo por rever' : null,
      page.contentStatus === 'coming-soon' ? 'Estado: conteúdo em preparação' : null,
      page.editorialStatus === 'reviewed' ? 'Texto: revisto' : null,
      page.editorialStatus === 'needs-review' ? 'Texto: por rever' : null,
      page.mechanicsStatus === 'reviewed' ? 'Mecânicas: revistas' : null,
      page.mechanicsStatus === 'generally-valid' ? 'Mecânicas: geralmente válidas' : null,
      page.mechanicsStatus === 'needs-review' ? 'Mecânicas: por rever' : null,
      page.buildsStatus === 'reviewed' ? 'Classes e builds: revistas' : null,
      page.buildsStatus === 'outdated' ? 'Classes e builds: desatualizadas' : null,
      page.buildsStatus === 'needs-review' ? 'Classes e builds: por rever' : null,
      page.phaseCount ? `Número de fases: ${page.phaseCount}` : null,
    ].filter((item): item is string => item !== null);

    if (metadata.length > 0) {
      const content = `## Estado e dados da página\n${metadata.map((item) => `- ${item}`).join('\n')}`;
      indexed.push({
        id: `${page.url}#metadata`,
        pageUrl: page.url,
        pageTitle: page.title,
        heading: 'Estado e dados da página',
        content,
        kind: 'metadata',
        titleSearch: normalizeSearchText(page.title),
        headingSearch: 'estado dados pagina',
        contentSearch: normalizeSearchText(content),
        aliases,
      });
    }

    const headings = sections
      .map((section) => section.heading)
      .filter((sectionHeading) => sectionHeading !== 'Visão geral');

    if (headings.length > 0) {
      const outline = `## Estrutura da página\n${headings.map((item) => `- ${item}`).join('\n')}`;
      indexed.push({
        id: `${page.url}#outline`,
        pageUrl: page.url,
        pageTitle: page.title,
        heading: 'Estrutura da página',
        content: outline,
        kind: 'outline',
        titleSearch: normalizeSearchText(page.title),
        headingSearch: 'estrutura pagina',
        contentSearch: normalizeSearchText(outline),
        aliases,
      });
    }

    sections.forEach((section, position) => {
      indexed.push({
        id: `${page.url}#${position}`,
        pageUrl: page.url,
        pageTitle: page.title,
        heading: section.heading,
        content: section.content,
        kind: 'section',
        titleSearch: normalizeSearchText(page.title),
        headingSearch: normalizeSearchText(section.heading),
        contentSearch: normalizeSearchText(section.content),
        aliases,
      });
    });
  }

  return {
    sections: indexed,
    pageUrls: new Set(pages.map((page) => normalizePath(page.url))),
  };
}

function normalizePath(value: string) {
  const withoutTrailingSlash = value.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function getLocationPath(location?: string) {
  if (!location) return undefined;

  try {
    return normalizePath(new URL(location, 'https://raidguides.local').pathname);
  } catch {
    return undefined;
  }
}

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  const canonical = (token: string) => (token === 'fases' ? 'fase' : token);
  const expected = canonical(needle);

  return haystack
    .split(' ')
    .filter((word) => canonical(word) === expected).length;
}

function scoreSection(
  section: IndexedSection,
  tokens: string[],
  querySearch: string,
  currentPath?: string,
) {
  let lexicalScore = 0;

  if (section.titleSearch === querySearch) lexicalScore += 30;
  else if (querySearch.length > 3 && section.titleSearch.includes(querySearch)) {
    lexicalScore += 18;
  }

  for (const token of tokens) {
    if (section.aliases.includes(token)) lexicalScore += 18;
    if (countOccurrences(section.titleSearch, token) > 0) lexicalScore += 8;
    if (countOccurrences(section.headingSearch, token) > 0) lexicalScore += 6;
    lexicalScore += Math.min(countOccurrences(section.contentSearch, token), 4);
  }

  // Do not return a current page merely because it is open: it still needs
  // at least one lexical signal from the user's question.
  if (lexicalScore === 0) return 0;

  let score = lexicalScore;
  if (currentPath === normalizePath(section.pageUrl)) score += 12;

  const asksAboutPhases = tokens.some((token) => token.startsWith('fase'));
  if (asksAboutPhases && section.headingSearch.startsWith('fase')) score += 16;
  if (asksAboutPhases && section.kind === 'metadata') score += 20;
  if (asksAboutPhases && section.kind === 'outline') score += 12;

  return score;
}

export function retrieveDocuments(
  index: RetrievalIndex,
  {
    query,
    location,
    limit = 6,
    maxCharacters = 16_000,
  }: RetrievalOptions,
): RetrievalMatch[] {
  const querySearch = normalizeSearchText(query);
  const tokens = Array.from(new Set(tokenize(query)));
  if (!querySearch || tokens.length === 0) return [];

  const locationPath = getLocationPath(location);
  const currentPath = locationPath && index.pageUrls.has(locationPath) ? locationPath : undefined;

  const ranked = index.sections
    .map((section) => ({
      section,
      score: scoreSection(section, tokens, querySearch, currentPath),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.section.pageUrl.localeCompare(b.section.pageUrl) ||
        a.section.id.localeCompare(b.section.id),
    );

  const selected: RetrievalMatch[] = [];
  let usedCharacters = 0;

  for (const { section, score } of ranked) {
    if (selected.length >= limit) break;
    const remaining = maxCharacters - usedCharacters;
    if (remaining <= 0) break;

    const content = section.content.slice(0, remaining);
    selected.push({
      pageUrl: section.pageUrl,
      pageTitle: section.pageTitle,
      heading: section.heading,
      content,
      score,
    });
    usedCharacters += content.length;
  }

  return selected;
}

export function formatRetrievedContext(matches: RetrievalMatch[]) {
  if (matches.length === 0) return 'Nenhuma secção relevante foi encontrada.';

  return matches
    .map(
      (match, index) =>
        `[Fonte ${index + 1}] ${match.pageTitle} — ${match.heading}\nURL: ${match.pageUrl}\n\n${match.content}`,
    )
    .join('\n\n---\n\n');
}
