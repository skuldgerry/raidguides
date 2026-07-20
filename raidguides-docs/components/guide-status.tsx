import { AlertTriangleIcon, CalendarCheckIcon, ConstructionIcon } from 'lucide-react';

type GuideStatusProps = {
  status: 'current' | 'legacy' | 'coming-soon';
  editorialStatus?: 'reviewed' | 'needs-review';
  lastReviewed?: string;
  mechanicsStatus?: 'reviewed' | 'generally-valid' | 'needs-review';
  buildsStatus?: 'reviewed' | 'outdated' | 'needs-review';
  phaseCount?: number;
};

const mechanicsLabels = {
  reviewed: 'Mecânicas revistas',
  'generally-valid': 'Mecânicas geralmente válidas',
  'needs-review': 'Mecânicas por rever',
} as const;

const editorialLabels = {
  reviewed: 'Texto revisto',
  'needs-review': 'Texto por rever',
} as const;

const buildsLabels = {
  reviewed: 'Classes e builds revistas',
  outdated: 'Classes e builds desatualizadas',
  'needs-review': 'Classes e builds por rever',
} as const;

function formatReviewDate(date: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function GuideStatus({
  status,
  editorialStatus,
  lastReviewed,
  mechanicsStatus,
  buildsStatus,
  phaseCount,
}: GuideStatusProps) {
  if (status === 'current') return null;

  const isComingSoon = status === 'coming-soon';
  const Icon = isComingSoon ? ConstructionIcon : AlertTriangleIcon;
  const details = [
    editorialStatus ? editorialLabels[editorialStatus] : null,
    mechanicsStatus ? mechanicsLabels[mechanicsStatus] : null,
    buildsStatus ? buildsLabels[buildsStatus] : null,
    phaseCount ? `${phaseCount} ${phaseCount === 1 ? 'fase' : 'fases'}` : null,
  ].filter((detail): detail is string => detail !== null);

  return (
    <aside
      aria-label={isComingSoon ? 'Estado da página' : 'Aviso de conteúdo por rever'}
      className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm"
    >
      <div className="flex gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <p className="m-0 font-semibold text-fd-foreground">
            {isComingSoon ? 'Conteúdo em preparação' : 'Conteúdo por rever'}
          </p>
          <p className="mt-1 mb-0 text-fd-muted-foreground">
            {isComingSoon
              ? 'Ainda não existem guias publicadas para este jogo.'
              : 'Esta página ainda não foi revista para o estado atual do jogo.'}
          </p>
          {details.length > 0 ? (
            <ul className="mt-2 mb-0 flex list-none flex-wrap gap-2 p-0 text-xs text-fd-muted-foreground">
              {details.map((detail) => (
                <li key={detail} className="rounded-full border border-fd-border bg-fd-background/70 px-2 py-1">
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}
          {lastReviewed ? (
            <p className="mt-2 mb-0 flex items-center gap-1.5 text-xs text-fd-muted-foreground">
              <CalendarCheckIcon aria-hidden="true" className="size-3.5" />
              Última revisão: {formatReviewDate(lastReviewed)}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
