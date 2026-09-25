// Minimal client-side router built on the History API. Used because package
// installation is unavailable in this environment; the API (Link, useNavigate,
// useParams, Routes/Route) mirrors react-router closely so a later swap is
// mechanical.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface RouterCtx {
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const Ctx = createContext<RouterCtx>({ path: '/', navigate: () => {} });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) window.history.replaceState({}, '', to);
    else window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useNavigate = () => useContext(Ctx).navigate;
export const useLocation = () => useContext(Ctx).path;

// Pattern matching: "/assessment/:id/schemes/:sid"
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const ap = path.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    else if (pp[i] !== ap[i]) return null;
  }
  return params;
}

const ParamsCtx = createContext<Record<string, string>>({});
export const useParams = () => useContext(ParamsCtx);

export interface RouteDef {
  path: string;
  element: ReactNode;
}

export function Routes({ routes, fallback }: { routes: RouteDef[]; fallback: ReactNode }) {
  const path = useLocation();
  for (const r of routes) {
    const params = matchPath(r.path, path);
    if (params) {
      return <ParamsCtx.Provider value={params}>{r.element}</ParamsCtx.Provider>;
    }
  }
  return <>{fallback}</>;
}

export function Link({
  to,
  className,
  children,
  ...rest
}: {
  to: string;
  className?: string;
  children: ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
