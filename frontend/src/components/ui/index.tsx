// Core UI primitives for the civic-tech design system. Tokens live in index.css.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* -------------------------------------------------- Button */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type BtnSize = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: {
  variant?: BtnVariant;
  size?: BtnSize;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  // Primary variant uses the shiny animated button
  if (variant === 'primary') {
    const sizeClass = { sm: 'shiny-sm', md: 'shiny-md', lg: 'shiny-lg' }[size];
    return (
      <button className={cx('shiny-cta', sizeClass, className)} {...rest}>
        <span>{children}</span>
      </button>
    );
  }

  const base =
    'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]';
  const sizes: Record<BtnSize, string> = {
    sm: 'text-[13px] px-3 h-8',
    md: 'text-sm px-4 h-10',
    lg: 'text-[15px] px-5 h-12',
  };
  const nonPrimaryVariants = {
    secondary: 'bg-surface text-ink border border-line-strong hover:border-brand hover:text-brand',
    ghost: 'text-ink-700 hover:bg-surface-sunken',
    danger: 'bg-fail text-white hover:brightness-95',
  };
  return (
    <button
      className={cx(base, sizes[size], nonPrimaryVariants[variant as 'secondary' | 'ghost' | 'danger'], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------- Card */
export function Card({
  className,
  children,
  as: As = 'div',
  interactive,
  ...rest
}: {
  className?: string;
  children: ReactNode;
  as?: React.ElementType;
  interactive?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={cx(
        'bg-surface border border-line rounded-[var(--radius)] shadow-[var(--shadow-card)]',
        interactive && 'transition-all hover:shadow-[var(--shadow-lift)] hover:border-line-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

/* -------------------------------------------------- Badge / status */
export function Badge({
  tone = 'neutral',
  children,
  className,
  icon,
}: {
  tone?: 'neutral' | 'brand' | 'accent' | 'pass' | 'fail' | 'review';
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-surface-sunken text-muted border-line',
    brand: 'bg-brand-050 text-brand border-[color:var(--color-brand)]/20',
    accent: 'bg-accent-050 text-accent border-[color:var(--color-accent)]/25',
    pass: 'bg-pass-050 text-pass border-[color:var(--color-pass)]/20',
    fail: 'bg-fail-050 text-fail border-[color:var(--color-fail)]/20',
    review: 'bg-review-050 text-review border-[color:var(--color-review)]/25',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* -------------------------------------------------- Tabs */
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-line overflow-x-auto">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              'relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
              active ? 'text-brand' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className="ml-2 rounded-full bg-surface-sunken px-1.5 text-xs text-muted">{t.count}</span>
            )}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------- Drawer */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[color:var(--color-ink)]/30 backdrop-blur-[1px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'fp-drawer-in absolute right-0 top-0 h-full w-full bg-surface shadow-[var(--shadow-drawer)] flex flex-col',
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-surface-sunken hover:text-ink">
            <Icon name="x" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- Modal */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[color:var(--color-ink)]/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="fp-fade-in relative w-full max-w-lg rounded-[var(--radius)] bg-surface shadow-[var(--shadow-lift)]">
        <div className="border-b border-line px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
        </div>
        <div className="px-6 py-5 text-sm text-ink-700">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------- Alert */
export function Alert({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: 'info' | 'warning' | 'error' | 'success';
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const map = {
    info: { c: 'bg-brand-050 border-[color:var(--color-brand)]/20 text-ink', i: 'info', ic: 'text-brand' },
    warning: { c: 'bg-review-050 border-[color:var(--color-review)]/25 text-ink', i: 'alert', ic: 'text-review' },
    error: { c: 'bg-fail-050 border-[color:var(--color-fail)]/20 text-ink', i: 'x-circle', ic: 'text-fail' },
    success: { c: 'bg-pass-050 border-[color:var(--color-pass)]/20 text-ink', i: 'check', ic: 'text-pass' },
  }[tone];
  return (
    <div className={cx('flex gap-3 rounded-[var(--radius)] border p-4', map.c)}>
      <span className={cx('mt-0.5 shrink-0', map.ic)}>
        <Icon name={map.i} />
      </span>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-ink">{title}</p>
        {children && <div className="mt-1 text-ink-700">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------- Empty / Skeleton */
export function EmptyState({ icon = 'inbox', title, children, action }: { icon?: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-faint">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('fp-pulse rounded-md bg-surface-sunken', className)} />;
}

/* -------------------------------------------------- Toast */
interface Toast { id: number; tone: 'info' | 'success' | 'error'; msg: string }
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = (t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3800);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'fp-fade-in flex items-center gap-2.5 rounded-[10px] border bg-surface px-4 py-3 text-sm shadow-[var(--shadow-lift)]',
              t.tone === 'success' && 'border-[color:var(--color-pass)]/25',
              t.tone === 'error' && 'border-[color:var(--color-fail)]/25',
              t.tone === 'info' && 'border-line',
            )}
          >
            <span className={cx(t.tone === 'success' && 'text-pass', t.tone === 'error' && 'text-fail', t.tone === 'info' && 'text-brand')}>
              <Icon name={t.tone === 'success' ? 'check' : t.tone === 'error' ? 'x-circle' : 'info'} />
            </span>
            <span className="text-ink">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* -------------------------------------------------- Icons (inline, stroke-based) */
const PATHS: Record<string, ReactNode> = {
  x: <path d="M6 6l12 12M18 6L6 18" />,
  'x-circle': <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  'check-circle': <><circle cx="12" cy="12" r="9" /><path d="M16 9.5l-5 5-2.5-2.5" /></>,
  alert: <><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17.5v.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></>,
  inbox: <><path d="M3 12h5l2 3h4l2-3h5" /><path d="M5 5h14l2 7v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" /></>,
  upload: <><path d="M12 15V4M8 8l4-4 4 4" /><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" /></>,
  file: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></>,
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
  flag: <><path d="M5 21V4h11l-1.5 3L16 10H5" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M21 12h-2M5 12H3M18 6l-1.5 1.5M7.5 16.5L6 18M18 18l-1.5-1.5M7.5 7.5L6 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  doc: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  shield: <><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9.5 12l2 2 3.5-4" /></>,
  link: <><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 10-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 105.66 5.66l1-1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  scale: <><path d="M12 3v18M6 8h12M6 8l-3 6a3 3 0 006 0zM18 8l-3 6a3 3 0 006 0z" /><path d="M5 21h14" /></>,
  route: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8 17h6a3 3 0 003-3V9" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  bell: <><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 004 0" /></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
};

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}
