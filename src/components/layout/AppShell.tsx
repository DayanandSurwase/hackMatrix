import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from '../../lib/router';
import { useCase } from '../../lib/context/CaseContext';
import { Icon, cx } from '../ui';
import { DecisionBadge } from '../domain/decision';
import type { Decision } from '../../lib/types';
import {
  ShiftingDropdown,
  DropdownItem,
  DropdownSection,
  DropdownLink,
  DropdownDivider,
} from '../ui/shifting-dropdown';
import { LayoutDashboard, FileText, BookOpen, Scale, ShieldCheck } from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/assessment/case-2025-0417/schemes', label: 'Schemes', icon: 'layers' },
  { to: '/reviews', label: 'Needs review', icon: 'flag', badge: 1 },
  { to: '/history', label: 'History', icon: 'clock' },
  { to: '/settings', label: 'Settings', icon: 'gear' },
];

export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <img src="/images/logo-final-3.jpeg" alt="Logo" className="h-8 w-8 rounded-[8px] object-cover shadow-[var(--shadow-card)]" />
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-bold text-ink">SchemeGuide</span>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-faint">Civic-tech · FIN-03</span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavList = () => (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const isActive =
          path === n.to ||
          (n.label === 'Schemes' && path.includes('/schemes')) ||
          (n.label === 'Needs review' && path.startsWith('/reviews'));
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setMobileOpen(false)}
            className={cx(
              'group flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-050 text-brand' : 'text-ink-700 hover:bg-surface-sunken',
            )}
          >
            <Icon name={n.icon} size={18} className={isActive ? 'text-brand' : 'text-faint group-hover:text-ink'} />
            <span className="flex-1">{n.label}</span>
            {n.badge && (
              <span className="rounded-full bg-review-050 px-1.5 text-[11px] font-semibold text-review">{n.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <div className="px-2">
          <Wordmark />
        </div>
        <div className="mt-8 flex-1">
          <NavList />
        </div>
        <div className="rounded-[var(--radius)] border border-line bg-surface-sunken p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Icon name="shield" size={13} className="text-accent" /> Evidence-backed
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Decisions come from a verified rule set, not an AI guess. Every result links to its source.
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[color:var(--color-ink)]/40" onClick={() => setMobileOpen(false)} />
          <aside className="fp-drawer-in absolute inset-y-0 left-0 w-72 bg-surface px-4 py-5">
            <Wordmark />
            <div className="mt-8">
              <NavList />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-[color:var(--color-surface)]/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button onClick={onMenu} className="rounded-md p-2 text-ink-700 hover:bg-surface-sunken lg:hidden" aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <div className="lg:hidden">
        <Wordmark compact />
      </div>

      {/* Shifting dropdown nav — hidden on small screens */}
      <div className="ml-6 hidden md:block">
        <ShiftingDropdown>
          <DropdownItem id="assessment" label="Assessment" icon={<LayoutDashboard size={14} />}>
            <DropdownSection title="Start">
              <DropdownLink
                label="New assessment"
                description="Upload documents and evaluate schemes"
                icon={<FileText size={14} />}
                href="/assessment/new"
              />
              <DropdownLink
                label="Dashboard"
                description="View all active cases"
                icon={<LayoutDashboard size={14} />}
                href="/dashboard"
              />
            </DropdownSection>
          </DropdownItem>

          <DropdownItem id="schemes" label="Schemes" icon={<BookOpen size={14} />}>
            <DropdownSection title="Browse">
              <DropdownLink
                label="PMEGP"
                description="Employment generation subsidy"
                icon={<Scale size={14} />}
                href="/assessment/case-2025-0417/schemes/PMEGP"
              />
              <DropdownLink
                label="MUDRA Shishu"
                description="Collateral-free micro loans"
                icon={<Scale size={14} />}
                href="/assessment/case-2025-0417/schemes/MUDRA"
              />
              <DropdownLink
                label="Stand-Up India"
                description="Loans for SC/ST and women"
                icon={<Scale size={14} />}
                href="/assessment/case-2025-0417/schemes/STANDUP"
              />
            </DropdownSection>
            <DropdownDivider />
            <DropdownSection>
              <DropdownLink
                label="All matched schemes"
                icon={<BookOpen size={14} />}
                href="/assessment/case-2025-0417/schemes"
              />
            </DropdownSection>
          </DropdownItem>

          <DropdownItem id="review" label="Review" icon={<ShieldCheck size={14} />}>
            <DropdownSection title="Queue">
              <DropdownLink
                label="Needs review"
                description="Cases with missing or conflicting evidence"
                icon={<ShieldCheck size={14} />}
                href="/reviews"
              />
              <DropdownLink
                label="Application guidance"
                description="Next steps for eligible schemes"
                icon={<FileText size={14} />}
                href="/assessment/case-2025-0417/guidance"
              />
            </DropdownSection>
          </DropdownItem>
        </ShiftingDropdown>
      </div>

      {/* Global scheme search */}
      <div className="ml-4 flex flex-1 justify-center px-1">
        <SchemeSearch />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="rounded-md p-2 text-ink-700 hover:bg-surface-sunken" aria-label="Notifications">
          <Icon name="bell" />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-050 text-xs font-semibold text-accent">AR</span>
          <span className="hidden text-sm font-medium text-ink sm:inline">Ananya R.</span>
        </div>
        <button onClick={() => navigate('/')} className="rounded-md p-2 text-ink-700 hover:bg-surface-sunken" aria-label="Sign out" title="Sign out">
          <Icon name="logout" />
        </button>
      </div>
    </header>
  );
}

/* Global scheme search — live dropdown with keyboard nav + ⌘K */
export function SchemeSearch() {
  const { activeCase } = useCase();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const schemes = activeCase?.schemes ?? [];
    const term = q.trim().toLowerCase();
    const decisionOf = (id: string): Decision | undefined =>
      activeCase?.evaluations.find((e) => e.schemeId === id)?.decision;
    const list = term
      ? schemes.filter((s) =>
          [s.name, s.ministry, s.category, s.purpose, s.schemeId].some((f) => f.toLowerCase().includes(term)),
        )
      : schemes;
    return list.slice(0, 6).map((s) => ({ s, decision: decisionOf(s.schemeId) }));
  }, [q, activeCase]);

  useEffect(() => setActive(0), [q]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  // ⌘K / Ctrl+K to focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (schemeId: string) => {
    if (!activeCase) return;
    setOpen(false);
    setQ('');
    navigate(`/assessment/${activeCase.caseId}/schemes/${schemeId}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active].s.schemeId); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl">
      <div className={cx(
        'flex items-center gap-2 rounded-full border bg-surface px-3.5 py-2 transition-colors',
        open ? 'border-brand ring-2 ring-[color:var(--color-brand)]/15' : 'border-line hover:border-line-strong',
      )}>
        <Icon name="search" size={16} className="shrink-0 text-faint" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search schemes…"
          aria-label="Search schemes"
          className="w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
        />
        <kbd className="hidden shrink-0 rounded border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">⌘K</kbd>
      </div>

      {open && (
        <div className="fp-fade-in absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow-lift)]">
          <p className="border-b border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
            {q.trim() ? `${results.length} match${results.length === 1 ? '' : 'es'}` : 'Matched schemes'}
          </p>
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">No schemes match “{q}”.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map(({ s, decision }, i) => (
                <li key={s.schemeId}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => { e.preventDefault(); go(s.schemeId); }}
                    onClick={() => go(s.schemeId)}
                    className={cx(
                      'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors',
                      i === active ? 'bg-brand-050' : 'hover:bg-surface-sunken',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{s.name}</span>
                      <span className="block truncate text-xs text-muted">{s.ministry} · {s.category}</span>
                    </span>
                    {decision && <DecisionBadge decision={decision} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* Page header helper */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-muted">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {b.to ? (
                <Link to={b.to} className="hover:text-brand">{b.label}</Link>
              ) : (
                <span className="text-ink-700">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <Icon name="chevron" size={13} className="text-faint" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* Workflow stepper for the assessment flow */
const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'processing', label: 'Processing' },
  { key: 'extraction', label: 'Review facts' },
  { key: 'schemes', label: 'Schemes' },
];
export function Stepper({ current, caseId }: { current: string; caseId: string }) {
  const navigate = useNavigate();
  const curIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto rounded-[var(--radius)] border border-line bg-surface p-2">
      {STEPS.map((s, i) => {
        const done = i < curIdx;
        const active = i === curIdx;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => done && navigate(`/assessment/${caseId}/${s.key}`)}
              className={cx(
                'flex flex-1 items-center gap-2 rounded-[8px] px-3 py-2 text-sm transition-colors',
                active && 'bg-brand-050 font-semibold text-brand',
                done && 'text-ink-700 hover:bg-surface-sunken',
                !active && !done && 'text-faint',
              )}
            >
              <span className={cx(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                done && 'bg-pass text-white',
                active && 'bg-brand text-white',
                !active && !done && 'border border-line-strong text-faint',
              )}>
                {done ? <Icon name="check" size={13} /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <Icon name="chevron" size={14} className="shrink-0 text-faint" />}
          </li>
        );
      })}
    </ol>
  );
}
