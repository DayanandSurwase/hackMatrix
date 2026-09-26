import { useEffect, useState } from 'react';
import { listReviews } from '../lib/api';
import type { ReviewCase } from '../lib/types';
import { PageHeader } from '../components/layout/AppShell';
import { Alert, Badge, Button, Card, EmptyState, Icon, Skeleton, useToast, cx } from '../components/ui';
import { EvidencePanel } from '../components/domain/EvidenceGraph';

const REASON_LABEL: Record<string, string> = {
  MISSING_FACT: 'Missing information',
  CONFLICTING_FACT: 'Conflicting information',
  LOW_CONFIDENCE: 'Low confidence',
  RULE_AMBIGUITY: 'Rule ambiguity',
  SOURCE_STALE: 'Source out of date',
  UNSUPPORTED_CASE: 'Unsupported case',
};
const STATUS_TONE: Record<string, 'review' | 'brand' | 'pass'> = { OPEN: 'review', IN_PROGRESS: 'brand', RESOLVED: 'pass' };

export function Reviews() {
  const [items, setItems] = useState<ReviewCase[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => { listReviews().then((r) => { setItems(r); setOpen(r[0]?.reviewId ?? null); }); }, []);

  if (!items) return <div className="space-y-4"><Skeleton className="h-9 w-64" /><Skeleton className="h-48" /></div>;

  return (
    <div className="fp-fade-in">
      <PageHeader
        title="Needs review"
        subtitle="Cases where the evidence is missing, conflicting or uncertain. The system does not guess — it explains what a human needs to confirm."
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Needs review' }]}
      />

      {items.length === 0 ? (
        <EmptyState icon="flag" title="Nothing to review">All your cases have a confident, evidence-backed decision.</EmptyState>
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const isOpen = open === r.reviewId;
            return (
              <Card key={r.reviewId}>
                <button onClick={() => setOpen(isOpen ? null : r.reviewId)} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-surface-sunken/50">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-review-050 text-review"><Icon name="alert" size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{r.title}</h3>
                      <Badge tone="review">{REASON_LABEL[r.reasonCode]}</Badge>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{r.schemeName}</p>
                  </div>
                  <Icon name="chevron-down" size={16} className={cx('mt-1 shrink-0 text-faint transition-transform', isOpen && 'rotate-180')} />
                </button>

                {isOpen && (
                  <div className="fp-fade-in space-y-4 border-t border-line px-5 py-4">
                    <Alert tone="warning" title="Manual review required">{r.explanation}</Alert>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Info label="Affected rule" value={r.affectedRule} mono />
                      <Info label="Documents involved" value={r.documentsInvolved.join(', ')} />
                    </div>

                    {r.conflictingEvidence && r.conflictingEvidence.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Conflicting evidence</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {r.conflictingEvidence.map((c, i) => (
                            <div key={i}>
                              <p className="mb-1 text-sm font-medium text-ink">Value: {c.value}</p>
                              <EvidencePanel source={c.source} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Resolution history</p>
                      <ol className="space-y-2">
                        {r.history.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                            <span className="text-ink-700"><span className="font-medium text-ink">{h.actor}</span> — {h.action}</span>
                            <span className="ml-auto shrink-0 text-xs text-faint">{new Date(h.at).toLocaleDateString()}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                      <Button size="sm" onClick={() => toast({ tone: 'success', msg: 'Correction submitted — affected rules will be re-evaluated.' })}>
                        <Icon name="edit" size={14} /> Provide correction
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toast({ tone: 'info', msg: 'Marked resolved by reviewer.' })}>Mark resolved</Button>
                      <Button size="sm" variant="ghost" onClick={() => toast({ tone: 'info', msg: 'Requested more information from applicant.' })}>Request more info</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[8px] bg-surface-sunken px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className={cx('mt-0.5 text-sm text-ink', mono && 'font-mono text-[13px]')}>{value}</p>
    </div>
  );
}
