import { useState } from 'react';
import { useCase } from '../lib/context/CaseContext';
import { Link, useNavigate, useParams } from '../lib/router';
import { PageHeader } from '../components/layout/AppShell';
import { Alert, Badge, Button, Card, Icon, Skeleton, Tabs, cx } from '../components/ui';
import { DecisionBadge, DOC_META, RuleStatusIcon } from '../components/domain/decision';
import { EvidenceGraph, EvidencePanel } from '../components/domain/EvidenceGraph';
import type { RuleResult } from '../lib/types';

export function SchemeDetail() {
  const { activeCase, loading } = useCase();
  const { sid } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('evaluation');

  if (loading || !activeCase) return <Skeleton className="h-96 w-full" />;

  const scheme = activeCase.schemes.find((s) => s.schemeId === sid);
  const evaln = activeCase.evaluations.find((e) => e.schemeId === sid);
  if (!scheme || !evaln) {
    return (
      <Alert tone="error" title="Scheme unavailable" action={<Button size="sm" variant="secondary" onClick={() => navigate(`/assessment/${activeCase.caseId}/schemes`)}>Back to results</Button>}>
        This scheme could not be found in the verified knowledge base for your case.
      </Alert>
    );
  }

  const factValue = (id?: string) => (id ? activeCase.facts.find((f) => f.factId === id)?.value ?? '' : '');
  const passed = evaln.ruleResults.filter((r) => r.result === 'PASS').length;
  const failed = evaln.ruleResults.filter((r) => r.result === 'FAIL').length;
  const review = evaln.ruleResults.filter((r) => r.result === 'REVIEW').length;

  return (
    <div className="fp-fade-in">
      <PageHeader
        title={scheme.name}
        subtitle={scheme.ministry}
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Schemes', to: `/assessment/${activeCase.caseId}/schemes` },
          { label: scheme.schemeId },
        ]}
        actions={
          <a href={scheme.applicationUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary"><Icon name="link" size={15} /> Official portal</Button>
          </a>
        }
      />

      {/* Decision summary — always visible above the fold */}
      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <DecisionBadge decision={evaln.decision} size="lg" />
            <div className="flex gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-pass"><Icon name="check" size={14} />{passed} passed</span>
              {failed > 0 && <span className="flex items-center gap-1.5 text-fail"><Icon name="x" size={14} />{failed} failed</span>}
              {review > 0 && <span className="flex items-center gap-1.5 text-review"><Icon name="alert" size={14} />{review} review</span>}
            </div>
          </div>
          <Link to={`/assessment/${activeCase.caseId}/guidance`}>
            <Button>Application guidance <Icon name="arrow" size={15} /></Button>
          </Link>
        </div>
        <div className="mt-4 flex gap-2.5 rounded-[10px] bg-surface-sunken p-3.5">
          <Icon name="info" size={16} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-sm text-ink-700">{evaln.whyText}</p>
        </div>
        {evaln.sourceStale && (
          <div className="mt-3">
            <Alert tone="warning" title="Scheme source needs re-verification">
              The official source for this scheme was last verified on {scheme.lastVerified}. Confirm the current guideline before relying on this result.
            </Alert>
          </div>
        )}
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'evaluation', label: "This applicant's evaluation" },
          { id: 'general', label: 'General scheme information' },
        ]}
      />

      <div className="pt-6">
        {tab === 'evaluation' ? (
          <EvaluationView evaln={evaln} scheme={scheme} factValue={factValue} caseId={activeCase.caseId} />
        ) : (
          <GeneralView scheme={scheme} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------ Applicant evaluation */
function EvaluationView({
  evaln,
  scheme,
  factValue,
  caseId,
}: {
  evaln: ReturnType<typeof Object> & any;
  scheme: any;
  factValue: (id?: string) => string;
  caseId: string;
}) {
  return (
    <div className="space-y-8">
      <p className="rounded-[8px] border border-line bg-surface px-4 py-2.5 text-xs text-muted">
        This section shows <span className="font-medium text-ink">your case</span> only. Scheme facts that apply to everyone are under “General scheme information”.
      </p>

      {/* Rule-by-rule */}
      <section>
        <SectionHead icon="scale" title="Eligibility check" desc="Each condition is evaluated deterministically against your confirmed facts." />
        <div className="space-y-2.5">
          {evaln.ruleResults.map((rr: RuleResult) => <RuleRow key={rr.ruleId} rr={rr} factValue={factValue} />)}
        </div>
      </section>

      {/* Evidence graph */}
      <section>
        <SectionHead icon="route" title="Decision proof" desc="Trace every result from your fact through to the decision. Select a row to open its source." />
        <EvidenceGraph evaluation={evaln} applicantFact={factValue} />
      </section>

      {/* Benefit + documents */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BenefitCard benefit={evaln.benefit} />
        <DocumentsCard scheme={scheme} caseId={caseId} />
      </div>
    </div>
  );
}

function RuleRow({ rr, factValue }: { rr: RuleResult; factValue: (id?: string) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-sunken"
      >
        <RuleStatusIcon status={rr.result} />
        <span className="flex-1">
          <span className="block text-sm font-medium text-ink">{rr.rule.label}</span>
          <span className="block text-xs text-muted">{rr.rule.description}</span>
        </span>
        <span className="hidden font-mono text-[13px] text-ink-700 sm:block">{rr.evaluationText}</span>
        <Icon name="chevron-down" size={16} className={cx('shrink-0 text-faint transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="fp-fade-in border-t border-line bg-surface-sunken/40 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rule" value={rr.rule.description} />
            <Field label="Required condition" value={rr.rule.requiredValue} mono />
            <Field label="Your value" value={rr.applicantValue} />
            <Field label="Evaluation" value={rr.evaluationText} mono />
          </div>
          {rr.reason && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-review-050 px-2.5 py-1 text-xs font-medium text-review">
              <Icon name="alert" size={12} /> Reason: {rr.reason.replace(/_/g, ' ')}
            </p>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rr.evidence ? <EvidencePanel source={rr.evidence} /> : (
              <div className="rounded-[var(--radius)] border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">
                No document evidence — this condition is routed for review rather than assumed.
              </div>
            )}
            <div className="rounded-[var(--radius)] bg-brand-050 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
                <Icon name="scale" size={13} /> Official source
              </div>
              <p className="text-sm text-ink">{rr.rule.sourceDocument} · page {rr.rule.sourcePage}</p>
              <p className="mt-1 text-xs italic text-ink-700">“{rr.rule.sourceText}”</p>
              <p className="mt-2 text-xs text-muted">Last verified {rr.rule.lastVerified}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Fact used: <span className="font-medium text-ink">{factValue(rr.factId) || '—'}</span></p>
        </div>
      )}
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className={cx('mt-0.5 text-sm text-ink', mono && 'font-mono text-[13px]')}>{value}</p>
    </div>
  );
}

export function BenefitCard({ benefit }: { benefit: any }) {
  const unavailable = benefit.status !== 'AVAILABLE';
  return (
    <Card className="p-5">
      <SectionHead icon="scale" title="Benefit estimate" desc="" inline />
      {unavailable ? (
        <div className="mt-3">
          <Badge tone="review">{benefit.status === 'REVIEW' ? 'Pending review' : 'Estimate unavailable'}</Badge>
          <p className="mt-3 text-sm text-ink-700">
            The benefit cannot be estimated until the required inputs are confirmed. We do not show a fabricated amount.
          </p>
          {benefit.missingInputs?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {benefit.missingInputs.map((m: string) => (
                <li key={m} className="flex items-center gap-2 text-sm text-muted"><Icon name="alert" size={13} className="text-review" />{m}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <p className="mt-3 font-display text-3xl font-bold text-ink">{benefit.amountLabel}</p>
          <p className="text-xs text-muted">Estimated margin-money subsidy</p>
          <dl className="mt-4 space-y-2 rounded-[8px] bg-surface-sunken p-3">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-muted">Formula</dt>
              <dd className="font-mono text-[12px] text-ink-700">{benefit.formula}</dd>
            </div>
            {benefit.inputs.map((i: any) => (
              <div key={i.label} className="flex items-center justify-between text-sm">
                <dt className="text-muted">{i.label}</dt>
                <dd className="font-medium text-ink">{i.value}</dd>
              </div>
            ))}
            {benefit.capLabel && (
              <div className="flex items-center justify-between border-t border-line pt-2 text-sm">
                <dt className="text-muted">Cap</dt>
                <dd className="text-ink-700">{benefit.capLabel}</dd>
              </div>
            )}
          </dl>
        </>
      )}
      <p className="mt-3 text-xs text-muted">
        Source: {benefit.sourceDocument}, p.{benefit.sourcePage}. This is an estimate; the sanctioning authority decides the final amount.
      </p>
    </Card>
  );
}

function DocumentsCard({ scheme, caseId }: { scheme: any; caseId: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <SectionHead icon="doc" title="Required documents" desc="" inline />
        <Link to={`/assessment/${caseId}/guidance`} className="text-sm font-medium text-brand hover:underline">View all →</Link>
      </div>
      <ul className="mt-4 space-y-2">
        {scheme.requiredDocuments.map((d: any) => {
          const m = DOC_META[d.readiness as keyof typeof DOC_META];
          return (
            <li key={d.id} className="flex items-start justify-between gap-3 rounded-[8px] border border-line px-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  {d.name}
                  {d.mandatory ? <span className="text-[10px] font-semibold uppercase text-fail">Required</span> : <span className="text-[10px] font-semibold uppercase text-faint">Optional</span>}
                </p>
                <p className="text-xs text-muted">{d.reason}</p>
              </div>
              <Badge tone={m.tone} icon={<Icon name={m.icon} size={12} />}>{m.label}</Badge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------ General scheme info */
function GeneralView({ scheme }: { scheme: any }) {
  return (
    <div className="space-y-8">
      <p className="rounded-[8px] border border-line bg-surface px-4 py-2.5 text-xs text-muted">
        This section describes the scheme <span className="font-medium text-ink">in general</span>. It does not reflect your specific evaluation.
      </p>

      <section>
        <SectionHead icon="info" title="Overview" desc="" />
        <p className="text-sm leading-relaxed text-ink-700">{scheme.overview}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <SectionHead icon="check-circle" title="Who can apply" desc="" />
          <ul className="space-y-2">
            {scheme.whoCanApply.map((w: string) => (
              <li key={w} className="flex items-start gap-2 text-sm text-ink-700"><Icon name="check" size={15} className="mt-0.5 text-pass" />{w}</li>
            ))}
          </ul>
        </section>
        <section>
          <SectionHead icon="scale" title="Eligibility conditions" desc="" />
          <ul className="space-y-2">
            {scheme.eligibilityConditions.map((c: string) => (
              <li key={c} className="flex items-start gap-2 text-sm text-ink-700"><Icon name="arrow" size={14} className="mt-0.5 text-brand" />{c}</li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <SectionHead icon="scale" title="Benefit" desc="" />
        <p className="text-sm text-ink-700">{scheme.benefitSummary}</p>
      </section>

      <section>
        <SectionHead icon="route" title="Application process" desc="" />
        <ol className="space-y-3">
          {scheme.applicationProcess.map((step: string, i: number) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-050 text-xs font-semibold text-brand">{i + 1}</span>
              <span className="text-sm text-ink-700">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <SectionHead icon="link" title="Official source" desc="" />
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-ink">{scheme.officialSource}</p>
            <p className="text-xs text-muted">Last verified {scheme.lastVerified}</p>
          </div>
          <a href={scheme.applicationUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm"><Icon name="link" size={14} /> Visit</Button>
          </a>
        </Card>
      </section>
    </div>
  );
}

function SectionHead({ icon, title, desc, inline }: { icon: string; title: string; desc: string; inline?: boolean }) {
  return (
    <div className={cx(inline ? 'flex items-center gap-2' : 'mb-4')}>
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
        <Icon name={icon} size={17} className="text-accent" /> {title}
      </h3>
      {desc && !inline && <p className="mt-1 text-sm text-muted">{desc}</p>}
    </div>
  );
}
