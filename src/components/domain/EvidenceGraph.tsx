import { useState } from 'react';
import type { EvidenceSource, RuleResult, SchemeEvaluation } from '../../lib/types';
import { Card, Drawer, Icon, cx } from '../ui';
import { DECISION_META, RuleStatusIcon } from './decision';

// The flagship interaction: Applicant Fact -> Document Evidence -> Policy Rule
// -> Evaluation -> Decision. Desktop renders a connected 5-stage proof chain;
// narrow screens render a readable vertical proof timeline. Clicking any rule
// opens the source drawer.

const STAGES = [
  { key: 'fact', label: 'Applicant fact', icon: 'edit' },
  { key: 'evidence', label: 'Document evidence', icon: 'doc' },
  { key: 'rule', label: 'Policy rule', icon: 'scale' },
  { key: 'eval', label: 'Evaluation', icon: 'route' },
  { key: 'decision', label: 'Decision', icon: 'shield' },
] as const;

export function EvidenceGraph({ evaluation, applicantFact }: { evaluation: SchemeEvaluation; applicantFact: (id?: string) => string }) {
  const [drawer, setDrawer] = useState<{ rr: RuleResult } | null>(null);
  // Pick the decisive rules to visualise (skip N/A).
  const rules = evaluation.ruleResults.filter((r) => r.result !== 'NOT_APPLICABLE');
  const dm = DECISION_META[evaluation.decision];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted">
        {STAGES.map((s, i) => (
          <span key={s.key} className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-ink-700">
              <Icon name={s.icon} size={13} /> {s.label}
            </span>
            {i < STAGES.length - 1 && <Icon name="arrow" size={13} className="text-faint" />}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {rules.map((rr) => (
          <ProofRow key={rr.ruleId} rr={rr} applicantFact={applicantFact} onOpen={() => setDrawer({ rr })} decisionTone={dm.tone} />
        ))}
      </div>

      {/* Converging decision node */}
      <div className="mt-4 flex items-center gap-3">
        <div className="hidden flex-1 border-t border-dashed border-line-strong md:block" />
        <div className={cx('inline-flex items-center gap-2 rounded-[10px] px-4 py-2 font-display text-sm font-bold',
          dm.tone === 'pass' && 'bg-pass-050 text-pass',
          dm.tone === 'fail' && 'bg-fail-050 text-fail',
          dm.tone === 'review' && 'bg-review-050 text-review',
        )}>
          <Icon name={dm.icon} size={18} /> {dm.label}
        </div>
        <div className="hidden flex-1 border-t border-dashed border-line-strong md:block" />
      </div>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title="Evidence source" width="max-w-md">
        {drawer && <SourceDetail rr={drawer.rr} applicantFact={applicantFact} />}
      </Drawer>
    </div>
  );
}

function ProofRow({
  rr,
  applicantFact,
  onOpen,
  decisionTone,
}: {
  rr: RuleResult;
  applicantFact: (id?: string) => string;
  onOpen: () => void;
  decisionTone: string;
}) {
  const cells = [
    { icon: 'edit', head: applicantFact(rr.factId) || rr.rule.label, sub: rr.rule.description },
    { icon: 'doc', head: rr.evidence ? `${rr.evidence.documentName} · p.${rr.evidence.page}` : 'No document', sub: rr.evidence?.snippet ?? 'No supporting evidence available' },
    { icon: 'scale', head: rr.rule.operatorExpr, sub: `Required: ${rr.rule.requiredValue}`, mono: true },
    { icon: 'route', head: rr.evaluationText, sub: rr.reason ? rr.reason.replace(/_/g, ' ').toLowerCase() : 'deterministic rule engine', mono: true },
  ];
  return (
    <Card interactive className="group cursor-pointer p-0" as="button" onClick={onOpen}>
      <div className="flex flex-col md:flex-row md:items-stretch">
        {cells.map((c, i) => (
          <div
            key={i}
            className={cx(
              'relative flex-1 px-4 py-3 text-left',
              i < cells.length - 1 && 'border-b border-line md:border-b-0 md:border-r',
            )}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
              <Icon name={c.icon} size={12} />
              {STAGES[i].label}
            </div>
            <p className={cx('text-sm font-medium text-ink leading-snug', c.mono && 'font-mono text-[13px]')}>{c.head}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{c.sub}</p>
            {i < cells.length - 1 && (
              <span className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-faint md:block">
                <Icon name="arrow" size={16} />
              </span>
            )}
          </div>
        ))}
        {/* Result cell */}
        <div className={cx(
          'flex items-center justify-between gap-2 px-4 py-3 md:w-36 md:flex-col md:items-start md:justify-center',
          decisionTone === 'pass' && 'bg-pass-050/40',
          decisionTone === 'fail' && 'bg-fail-050/40',
          decisionTone === 'review' && 'bg-review-050/40',
        )}>
          <div className="mb-1 hidden text-[11px] font-semibold uppercase tracking-wide text-faint md:block">Result</div>
          <div className="flex items-center gap-2">
            <RuleStatusIcon status={rr.result} />
            <span className="text-sm font-semibold text-ink">{rr.result}</span>
          </div>
          <span className="text-xs text-brand opacity-0 transition-opacity group-hover:opacity-100">View source →</span>
        </div>
      </div>
    </Card>
  );
}

function SourceDetail({ rr, applicantFact }: { rr: RuleResult; applicantFact: (id?: string) => string }) {
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Applicant value', value: rr.applicantValue },
    { label: 'Required condition', value: rr.rule.requiredValue },
    { label: 'Rule expression', value: rr.rule.operatorExpr, mono: true },
    { label: 'Evaluation', value: rr.evaluationText, mono: true },
  ];
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <RuleStatusIcon status={rr.result} />
          <h4 className="text-sm font-semibold text-ink">{rr.rule.label}</h4>
        </div>
        <p className="text-sm text-ink-700">{rr.rule.description}</p>
      </div>

      <dl className="divide-y divide-line rounded-[var(--radius)] border border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-faint">{r.label}</dt>
            <dd className={cx('text-right text-sm text-ink', r.mono && 'font-mono text-[13px]')}>{r.value}</dd>
          </div>
        ))}
      </dl>

      {rr.evidence ? (
        <EvidencePanel source={rr.evidence} />
      ) : (
        <div className="rounded-[var(--radius)] border border-dashed border-line-strong bg-surface-sunken p-4 text-sm text-muted">
          No supporting document was found for this fact, so the rule is routed for review rather than assumed.
        </div>
      )}

      <div className="rounded-[var(--radius)] bg-brand-050 p-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
          <Icon name="scale" size={13} /> Official source
        </div>
        <p className="text-sm text-ink">{rr.rule.sourceDocument} · page {rr.rule.sourcePage}</p>
        <p className="mt-1 border-l-2 border-[color:var(--color-brand)]/30 pl-3 text-sm italic text-ink-700">“{rr.rule.sourceText}”</p>
        <p className="mt-2 text-xs text-muted">Effective {rr.rule.effectiveFrom} · last verified {rr.rule.lastVerified}</p>
      </div>

      <p className="text-xs text-muted">Extracted applicant fact: <span className="font-medium text-ink">{applicantFact(rr.factId) || '—'}</span></p>
    </div>
  );
}

export function EvidencePanel({ source }: { source: EvidenceSource }) {
  return (
    <div className="rounded-[var(--radius)] border border-line p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-faint">
        <Icon name="doc" size={13} /> Document evidence
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded border border-line bg-surface-sunken text-faint">
          <Icon name="file" size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{source.documentName}</p>
          <p className="text-xs text-muted">Page {source.page}</p>
          <p className="mt-1.5 rounded bg-surface-sunken px-2 py-1 text-xs text-ink-700">“{source.snippet}”</p>
        </div>
      </div>
    </div>
  );
}
