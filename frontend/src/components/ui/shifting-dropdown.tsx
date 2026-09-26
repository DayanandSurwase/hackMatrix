import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cx } from './index';

/* ─── Context ──────────────────────────────────────────────────────────── */
interface DropdownCtx {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  registerAnchor: (id: string, el: HTMLElement | null) => void;
  contentsRef: React.MutableRefObject<Map<string, ReactNode>>;
}

const Ctx = createContext<DropdownCtx>({
  activeId: null,
  setActiveId: () => {},
  registerAnchor: () => {},
  contentsRef: { current: new Map() },
});

/* ─── Root ─────────────────────────────────────────────────────────────── */
export function ShiftingDropdown({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const anchors = useRef<Map<string, HTMLElement>>(new Map());
  const contentsRef = useRef<Map<string, ReactNode>>(new Map());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const registerAnchor = useCallback((id: string, el: HTMLElement | null) => {
    if (el) anchors.current.set(id, el);
    else anchors.current.delete(id);
  }, []);

  const measureLeft = useCallback((id: string) => {
    const el = anchors.current.get(id);
    const container = containerRef.current;
    if (el && container) {
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setPanelLeft(elRect.left - containerRect.left);
    }
  }, []);

  const setActiveId = useCallback(
    (id: string | null) => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (id === null) {
        closeTimer.current = setTimeout(() => setActiveIdRaw(null), 130);
      } else {
        setActiveIdRaw(id);
        measureLeft(id);
      }
    },
    [measureLeft],
  );

  useEffect(() => {
    if (!activeId) return;
    const update = () => measureLeft(activeId);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeId, measureLeft]);

  return (
    <Ctx.Provider value={{ activeId, setActiveId, registerAnchor, contentsRef }}>
      <div ref={containerRef} className={cx('relative flex items-center gap-1', className)}>
        {children}

        {/* Single shared panel rendered at root — slides between triggers */}
        <AnimatePresence>
          {activeId && (
            <motion.div
              key="shifting-panel"
              initial={{ opacity: 0, y: -6, left: panelLeft }}
              animate={{ opacity: 1, y: 0, left: panelLeft }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{
                left: { type: 'spring', stiffness: 380, damping: 34, mass: 0.5 },
                opacity: { duration: 0.18 },
                y: { duration: 0.18 },
                scale: { duration: 0.14 },
              }}
              className="absolute top-[calc(100%+6px)] z-50 min-w-[220px] overflow-hidden rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow-lift)]"
              onMouseEnter={() => {
                if (closeTimer.current) clearTimeout(closeTimer.current);
              }}
              onMouseLeave={() => setActiveId(null)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.13, ease: 'easeOut' }}
                >
                  {contentsRef.current.get(activeId)}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

/* ─── Item ─────────────────────────────────────────────────────────────── */
export function DropdownItem({
  id,
  label,
  children,
  icon,
}: {
  id: string;
  label: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  const { activeId, setActiveId, registerAnchor, contentsRef } = useContext(Ctx);
  const ref = useRef<HTMLButtonElement>(null);
  const isActive = activeId === id;

  // Write content during render so it's available before user hovers
  contentsRef.current.set(id, children);

  useEffect(() => {
    registerAnchor(id, ref.current);
    return () => registerAnchor(id, null);
  }, [id, registerAnchor]);

  return (
    <div
      onMouseEnter={() => setActiveId(id)}
      onMouseLeave={() => setActiveId(null)}
    >
      <button
        ref={ref}
        className={cx(
          'flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-surface-sunken text-ink'
            : 'text-ink-700 hover:bg-surface-sunken/70 hover:text-ink',
        )}
      >
        {icon && (
          <span className={cx('transition-colors', isActive ? 'text-brand' : 'text-faint')}>
            {icon}
          </span>
        )}
        {label}
        <motion.svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-0.5 text-faint"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>
    </div>
  );
}

/* ─── Panel section helpers ─────────────────────────────────────────────── */
export function DropdownSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="p-1.5">
      {title && (
        <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
          {title}
        </p>
      )}
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

export function DropdownLink({
  label,
  description,
  icon,
  onClick,
  href,
}: {
  label: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href}
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-surface-sunken"
    >
      {icon && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-brand-050 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
    </Tag>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-line" />;
}
