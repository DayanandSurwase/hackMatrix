import type { Decision, DocReadiness, RuleResultStatus } from '../../lib/types';
import { Badge, Icon, cx } from '../ui';

// Human labels + tones for the three canonical decision states. NEEDS_REVIEW is
// always visually distinct (amber) and never styled to look like a pass.
export const DECISION_META: Record<Decision, { label: string; tone: 'pass' | 'fail' | 'review'; icon: string }> = {
  ELIGIBLE: { label: 'Eligible', tone: 'pass', icon: 'check-circle' },
  NOT_ELIGIBLE: { label: 'Not eligible', tone: 'fail', icon: 'x-circle' },
  NEEDS_REVIEW: { label: 'Needs review', tone: 'review', icon: 'alert' },
};

export function DecisionBadge({ decision, size = 'md' }: { decision: Decision; size?: 'sm' | 'md' | 'lg' }) {
  const m = DECISION_META[decision];
  if (size === 'lg') {
    const bg = { pass: 'bg-pass-050 text-pass', fail: 'bg-fail-050 text-fail', review: 'bg-review-050 text-review' }[m.tone];
    return (
      <div className={cx('inline-flex items-center gap-2.5 rounded-[12px] px-4 py-2.5 font-display text-lg font-bold', bg)}>
        <Icon name={m.icon} size={22} />
        {m.label}
      </div>
    );
  }
  return (
    <Badge tone={m.tone} icon={<Icon name={m.icon} size={14} />}>
      {m.label}
    </Badge>
  );
}

const RULE_META: Record<RuleResultStatus, { tone: string; icon: string; label: string }> = {
  PASS: { tone: 'text-pass bg-pass-050', icon: 'check', label: 'Pass' },
  FAIL: { tone: 'text-fail bg-fail-050', icon: 'x', label: 'Fail' },
  REVIEW: { tone: 'text-review bg-review-050', icon: 'alert', label: 'Review' },
  NOT_APPLICABLE: { tone: 'text-faint bg-surface-sunken', icon: 'info', label: 'N/A' },
};

export function RuleStatusIcon({ status }: { status: RuleResultStatus }) {
  const m = RULE_META[status];
  return (
    <span
      className={cx('inline-flex h-6 w-6 items-center justify-center rounded-full', m.tone)}
      title={m.label}
      aria-label={m.label}
    >
      <Icon name={m.icon} size={15} />
    </span>
  );
}

export function ConfidenceIndicator({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.85 ? 'pass' : value >= 0.7 ? 'review' : 'fail';
  const label = value >= 0.85 ? 'High' : value >= 0.7 ? 'Medium' : 'Low';
  const bar = { pass: 'bg-pass', review: 'bg-review', fail: 'bg-fail' }[tone];
  const text = { pass: 'text-pass', review: 'text-review', fail: 'text-fail' }[tone];
  return (
    <span className="inline-flex items-center gap-1.5" title={`Extraction confidence ${pct}%`}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-sunken">
        <span className={cx('block h-full rounded-full', bar)} style={{ width: `${pct}%` }} />
      </span>
      <span className={cx('text-xs font-medium', text)}>{label} · {pct}%</span>
    </span>
  );
}

export const DOC_META: Record<DocReadiness, { label: string; tone: 'pass' | 'fail' | 'review' | 'neutral'; icon: string }> = {
  PRESENT: { label: 'Available', tone: 'pass', icon: 'check' },
  MISSING: { label: 'Missing', tone: 'review', icon: 'alert' },
  CONFLICTING: { label: 'Conflicting', tone: 'fail', icon: 'alert' },
  LOW_CONFIDENCE: { label: 'Needs verification', tone: 'review', icon: 'alert' },
  NOT_REQUIRED: { label: 'Not required', tone: 'neutral', icon: 'info' },
};
