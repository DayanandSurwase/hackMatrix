import { useState } from 'react';
import { useCase } from '../lib/context/CaseContext';
import { Link } from '../lib/router';
import { PageHeader, Stepper } from '../components/layout/AppShell';
import { Badge, Button, Card, Icon, Skeleton, cx } from '../components/ui';
import { DecisionBadge } from '../components/domain/decision';
import type { Decision } from '../lib/types';

const FILTERS: { id: 'ALL' | Decision; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'ELIGIBLE', label: 'Eligible' },
  { id: 'NEEDS_REVIEW', label: 'Needs review' },
  { id: 'NOT_ELIGIBLE', label: 'Not eligible' },
];

export function SchemeResults() {
  const { activeCase, loading } = useCase();
  const [filter, setFilter] = useState<'ALL' | Decision>('ALL');

  if (loading || !activeCase) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  const rows = activeCase.evaluations
    .map((e) => ({ e, scheme: activeCase.schemes.find((s) => s.schemeId === e.schemeId)! }))
    .filter((r) => filter === 'ALL' || r.e.decision === filter);

  return (
    <div className="fp-fade-in">
      <Stepper current="schemes" caseId={activeCase.caseId} />
      <PageHeader
        title="Matched schemes"
        subtitle="Schemes retrieved from the verified knowledge base and evaluated against your confirmed facts. Results are ranked by decision, not by an opaque score."
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Schemes' }]}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cx(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === f.id ? 'border-brand bg-brand-050 text-brand' : 'border-line bg-surface text-muted hover:text-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map(({ e, scheme }) => {
          const missing = scheme.requiredDocuments.filter((d) => d.readiness === 'MISSING');
          return (
            <Card key={e.schemeId} interactive className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-faint">{scheme.ministry}</p>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-ink">{scheme.name}</h3>
                </div>
                <DecisionBadge decision={e.decision} />
              </div>
              <p className="mb-4 text-sm text-muted">{scheme.purpose}</p>

              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[8px] bg-surface-sunken px-3 py-2">
                  <p className="text-xs text-faint">Estimated benefit</p>
                  <p className="font-mono text-[13px] font-medium text-ink">
                    {e.benefit.status === 'AVAILABLE' ? e.benefit.amountLabel : e.benefit.status === 'REVIEW' ? 'Pending review' : 'Unavailable'}
                  </p>
                </div>
                <div className="rounded-[8px] bg-surface-sunken px-3 py-2">
                  <p className="text-xs text-faint">Source verified</p>
                  <p className="text-[13px] font-medium text-ink">{scheme.lastVerified}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {e.sourceStale && <Badge tone="review" icon={<Icon name="clock" size={12} />}>Source needs re-verification</Badge>}
                {missing.length > 0 && (
                  <Badge tone="review" icon={<Icon name="alert" size={12} />}>{missing.length} document{missing.length > 1 ? 's' : ''} missing</Badge>
                )}
                {missing.length === 0 && !e.sourceStale && <Badge tone="pass" icon={<Icon name="check" size={12} />}>Documents ready</Badge>}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
                <span className="text-xs text-muted">{e.ruleResults.length} rules evaluated</span>
                <Link to={`/assessment/${activeCase.caseId}/schemes/${e.schemeId}`}>
                  <Button variant="secondary" size="sm">View decision & evidence <Icon name="arrow" size={14} /></Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
