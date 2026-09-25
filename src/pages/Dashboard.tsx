import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCase } from '../lib/context/CaseContext';
import { Link, useNavigate } from '../lib/router';
import { Button, Card, Icon, Skeleton, cx } from '../components/ui';
import { DecisionBadge, DOC_META } from '../components/domain/decision';
import type { Decision } from '../lib/types';

export function Dashboard() {
  const { activeCase, loading } = useCase();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = ['/images/hero1.jpeg', '/images/hero2.jpeg'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !activeCase) return <DashboardSkeleton />;

  const evals = activeCase.evaluations;
  const count = (d: Decision) => evals.filter((e) => e.decision === d).length;
  const eligible = count('ELIGIBLE');
  const review = count('NEEDS_REVIEW');
  const notEligible = count('NOT_ELIGIBLE');
  const missingDocs = activeCase.schemes.flatMap((s) => s.requiredDocuments).filter((d) => d.readiness === 'MISSING').length;
  const totalBenefit = evals
    .filter((e) => e.benefit.status === 'AVAILABLE' && e.benefit.amountLabel)
    .map((e) => e.benefit.amountLabel!)
    .join(' + ');

  const stats = [
    { label: 'Schemes found', value: activeCase.schemes.length, icon: 'layers', tone: 'brand' },
    { label: 'Eligible', value: eligible, icon: 'check-circle', tone: 'pass' },
    { label: 'Needs review', value: review, icon: 'alert', tone: 'review' },
    { label: 'Not eligible', value: notEligible, icon: 'x-circle', tone: 'fail' },
  ];

  const categories = [
    { label: 'Business & Entrepreneurship', icon: 'scale' },
    { label: 'Banking, Financial Services', icon: 'layers' },
    { label: 'Skills & Employment', icon: 'route' },
    { label: 'Women & Child', icon: 'shield' },
    { label: 'Agriculture & Rural', icon: 'home' },
    { label: 'Education & Learning', icon: 'doc' },
  ];

  return (
    <div className="fp-fade-in">
      {/* myScheme-style hero band */}
      <div className="relative mb-6 flex min-h-[340px] items-center overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow-lift)]">
        
        {/* Full Image Background Carousel */}
        <div className="absolute inset-0 z-0 bg-white">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
              alt="Dashboard background"
            />
          </AnimatePresence>
          {/* Custom gradient ensures the right side is 100% untouched and HD, completely removing the whitish wash */}
          <div className="absolute inset-0 bg-white/70 lg:hidden" />
          <div 
            className="absolute inset-0 hidden lg:block" 
            style={{ 
              background: 'linear-gradient(to right, #ffffff 0%, #ffffff 45%, rgba(255,255,255,0.85) 55%, rgba(255,255,255,0) 75%)' 
            }}
          />
        </div>

        {/* Text Content */}
        <div className="relative z-10 w-full px-6 py-10 sm:px-10 lg:w-7/12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-black">
            <Icon name="shield" size={13} /> Verified government schemes
          </span>
          <h1 className="mt-4 max-w-2xl text-black">Find government schemes you're eligible for</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/80">
            Upload your documents once. We match you against verified scheme rules and explain every decision with full evidence — no guesswork.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => navigate('/assessment/new')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black/80"
            >
              <Icon name="upload" size={16} /> Start new assessment
            </button>
            <Link
              to={`/assessment/${activeCase.caseId}/schemes`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/30 bg-white/50 px-5 text-sm font-semibold text-black backdrop-blur-sm transition hover:bg-white/80"
            >
              Browse matched schemes <Icon name="arrow" size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Category tiles */}
      <div className="mb-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Find schemes based on categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.label}
              to={`/assessment/${activeCase.caseId}/schemes`}
              className="group flex flex-col items-start gap-3 rounded-[var(--radius)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-050 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <Icon name={c.icon} size={19} />
              </span>
              <span className="text-[13px] font-medium leading-snug text-ink-700">{c.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Active case banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-brand-050 text-brand">
              <Icon name="file" size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-ink">{activeCase.title}</h2>
                <DecisionBadge decision={activeCase.status as Decision} />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                Case <span className="font-mono text-[13px] text-ink-700">#2025-0417</span> · {activeCase.documents.length} documents processed · updated 24 Sep 2025
              </p>
            </div>
          </div>
          <Link to={`/assessment/${activeCase.caseId}/schemes`}>
            <Button variant="secondary">Open results <Icon name="arrow" size={15} /></Button>
          </Link>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className={cx('flex h-9 w-9 items-center justify-center rounded-[8px]',
                s.tone === 'brand' && 'bg-brand-050 text-brand',
                s.tone === 'pass' && 'bg-pass-050 text-pass',
                s.tone === 'review' && 'bg-review-050 text-review',
                s.tone === 'fail' && 'bg-fail-050 text-fail',
              )}>
                <Icon name={s.icon} size={18} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Secondary metrics */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 font-display text-base font-semibold text-ink">Scheme results</h3>
            <div className="space-y-2.5">
              {evals.map((e) => {
                const scheme = activeCase.schemes.find((s) => s.schemeId === e.schemeId)!;
                return (
                  <Link
                    key={e.schemeId}
                    to={`/assessment/${activeCase.caseId}/schemes/${e.schemeId}`}
                    className="flex items-center justify-between gap-3 rounded-[8px] border border-line px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-surface-sunken"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{scheme.name}</p>
                      <p className="truncate text-xs text-muted">{scheme.ministry}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {e.benefit.status === 'AVAILABLE' && (
                        <span className="hidden font-mono text-[13px] text-ink-700 sm:inline">{e.benefit.amountLabel}</span>
                      )}
                      <DecisionBadge decision={e.decision} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted">
              <Icon name="scale" size={15} className="text-accent" /> Estimated benefits
            </div>
            <p className="font-display text-2xl font-bold text-ink">{totalBenefit || '—'}</p>
            <p className="mt-1 text-xs text-muted">Estimates from verified benefit formulas. Final amounts are decided by the scheme authority.</p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-display text-base font-semibold text-ink">Document readiness</h3>
            {missingDocs > 0 ? (
              <div className="flex items-start gap-2 rounded-[8px] bg-review-050 p-3">
                <Icon name="alert" size={16} className="mt-0.5 text-review" />
                <p className="text-sm text-ink-700">
                  <span className="font-semibold text-ink">{missingDocs} required documents missing</span> across your matched schemes.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">All required documents are present.</p>
            )}
            <ul className="mt-3 space-y-2">
              {['PRESENT', 'MISSING', 'NOT_REQUIRED'].map((k) => {
                const m = DOC_META[k as keyof typeof DOC_META];
                const n = activeCase.schemes.flatMap((s) => s.requiredDocuments).filter((d) => d.readiness === k).length;
                return (
                  <li key={k} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-700">
                      <Icon name={m.icon} size={14} className={cx(m.tone === 'pass' && 'text-pass', m.tone === 'review' && 'text-review', m.tone === 'neutral' && 'text-faint')} />
                      {m.label}
                    </span>
                    <span className="font-medium text-ink">{n}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-9 w-72" />
      <Skeleton className="mb-6 h-24 w-full" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
