import { useCase } from '../lib/context/CaseContext';
import { Link, useNavigate } from '../lib/router';
import { PageHeader } from '../components/layout/AppShell';
import { Alert, Badge, Button, Card, Icon, Skeleton, cx } from '../components/ui';
import { DecisionBadge, DOC_META } from '../components/domain/decision';
import type { Decision, RequiredDocument } from '../lib/types';

export function Guidance() {
  const { activeCase, loading } = useCase();
  const navigate = useNavigate();

  if (loading || !activeCase) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  // Show eligible schemes first, then needs-review. Skip not-eligible.
  const ORDER: Decision[] = ['ELIGIBLE', 'NEEDS_REVIEW', 'NOT_ELIGIBLE'];
  const eligible = activeCase.evaluations
    .map((e) => ({ e, scheme: activeCase.schemes.find((s) => s.schemeId === e.schemeId)! }))
    .filter(({ e, scheme }) => e && scheme && e.decision !== 'NOT_ELIGIBLE')
    .sort((a, b) => ORDER.indexOf(a.e.decision) - ORDER.indexOf(b.e.decision));

  const hasEligible = eligible.some(({ e }) => e.decision === 'ELIGIBLE');

  return (
    <div className="fp-fade-in">
      <PageHeader
        title="Application guidance"
        subtitle="Step-by-step instructions derived from verified scheme guidelines. Always confirm the current requirements at each official portal before applying."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Schemes', to: `/assessment/${activeCase.caseId}/schemes` },
          { label: 'Application guidance' },
        ]}
      />

      {/* Trust banner */}
      <div className="mb-6 flex items-start gap-3 rounded-[var(--radius)] border border-line bg-surface px-4 py-3">
        <Icon name="shield" size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-sm text-muted">
          The product does not submit applications on your behalf. Use the official portals linked below.
          Every step shown is sourced from the published scheme guidelines — the source document and last verified date are shown on each card.
        </p>
      </div>

      {eligible.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken">
            <Icon name="layers" size={22} className="text-muted" />
          </div>
          <p className="text-sm font-medium text-ink">No actionable schemes to show</p>
          <p className="mt-1 text-sm text-muted">
            All evaluated schemes are not eligible. Return to the scheme results to review the reasons.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => navigate(`/assessment/${activeCase.caseId}/schemes`)}
          >
            Back to schemes
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {eligible.map(({ e, scheme }) => (
            <div key={scheme.schemeId}>
              {/* Scheme header */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-ink">{scheme.name}</h2>
                    <DecisionBadge decision={e.decision} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{scheme.ministry}</p>
                </div>
                <a href={scheme.applicationUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <Icon name="link" size={14} /> Official portal
                  </Button>
                </a>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                {/* Application steps */}
                <Card className="p-5">
                  <SectionHead icon="layers" title="Application steps" />
                  <ol className="mt-4 space-y-0">
                    {scheme.applicationProcess.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={cx(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                              i === 0 && e.decision === 'ELIGIBLE'
                                ? 'bg-brand text-white'
                                : 'bg-brand-050 text-brand',
                            )}
                          >
                            {i + 1}
                          </span>
                          {i < scheme.applicationProcess.length - 1 && (
                            <div className="my-1 w-px flex-1 bg-line" />
                          )}
                        </div>
                        <div className="min-w-0 pb-4">
                          <p className={cx('text-sm', i === 0 ? 'font-medium text-ink' : 'text-ink-700')}>
                            {step}
                          </p>
                          {i === scheme.applicationProcess.length - 1 && (
                            <a
                              href={scheme.applicationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-050 transition-colors"
                            >
                              <Icon name="link" size={13} /> Open official portal
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {e.decision === 'NEEDS_REVIEW' && (
                    <div className="mt-4">
                      <Alert tone="warning" title="Review required before applying">
                        One or more conditions could not be fully evaluated. Resolve the open review items before
                        submitting a formal application.{' '}
                        <Link to="/reviews" className="font-semibold text-review underline">
                          Open review queue →
                        </Link>
                      </Alert>
                    </div>
                  )}
                </Card>

                {/* Documents + Source sidebar */}
                <div className="flex flex-col gap-4">
                  <DocumentChecklist docs={scheme.requiredDocuments} />
                  <SourceCard
                    source={scheme.officialSource}
                    lastVerified={scheme.lastVerified}
                    stale={e.sourceStale}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Call to action at the bottom */}
          {hasEligible && (
            <Card className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pass-050 text-pass">
                <Icon name="check" size={22} />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-ink">You appear eligible</p>
                <p className="mt-1 max-w-md text-sm text-muted">
                  The deterministic rule engine found at least one scheme you likely qualify for. Follow the
                  official application steps above. Keep your documents ready — the checklist shows what you need.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/assessment/${activeCase.caseId}/schemes`)}
                >
                  Back to all schemes
                </Button>
                <Button onClick={() => navigate('/dashboard')}>Done — go to dashboard</Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function SectionHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-brand-050 text-brand">
        <Icon name={icon} size={14} />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
    </div>
  );
}

function DocumentChecklist({ docs }: { docs: RequiredDocument[] }) {
  const sorted = [...docs].sort((a, b) => {
    const order = ['MISSING', 'CONFLICTING', 'LOW_CONFIDENCE', 'PRESENT', 'NOT_REQUIRED'];
    return order.indexOf(a.readiness) - order.indexOf(b.readiness);
  });
  const missing = sorted.filter((d) => d.readiness === 'MISSING' && d.mandatory).length;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <SectionHead icon="doc" title="Documents" />
        {missing > 0 && (
          <span className="rounded-full bg-fail-050 px-2 py-0.5 text-[11px] font-semibold text-fail">
            {missing} missing
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {sorted.map((d) => {
          const m = DOC_META[d.readiness as keyof typeof DOC_META];
          return (
            <li key={d.id} className="flex items-start gap-2.5 rounded-[8px] border border-line px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-ink">
                  {d.name}
                  {d.mandatory && (
                    <span className="text-[10px] font-semibold uppercase text-fail">Required</span>
                  )}
                </p>
                <p className="text-xs text-muted">{d.reason}</p>
              </div>
              <Badge tone={m.tone} icon={<Icon name={m.icon} size={12} />}>
                {m.label}
              </Badge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function SourceCard({
  source,
  lastVerified,
  stale,
}: {
  source: string;
  lastVerified: string;
  stale?: boolean;
}) {
  return (
    <Card className="p-4">
      <SectionHead icon="shield" title="Source" />
      <div className="mt-3 space-y-2 text-xs text-muted">
        <div className="flex items-start gap-2">
          <Icon name="doc" size={13} className="mt-0.5 shrink-0 text-faint" />
          <span>{source}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="clock" size={13} className="shrink-0 text-faint" />
          <span>Last verified {lastVerified}</span>
        </div>
        {stale && (
          <div className="mt-2 flex items-start gap-2 rounded-[6px] bg-review-050 px-2.5 py-2 text-review">
            <Icon name="alert" size={12} className="mt-0.5 shrink-0" />
            <span className="font-medium">Source may be out of date. Verify before applying.</span>
          </div>
        )}
      </div>
    </Card>
  );
}
