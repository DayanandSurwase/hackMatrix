import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface RouterCtx {
  path: string;
  navigate: (to: string) => void;
}

const Ctx = createContext<RouterCtx>({ path: '/', navigate: () => {} });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (to: string) => {
    if (to === path) return;
    window.history.pushState({}, '', to);
    setPath(to);
  };

  return <Ctx.Provider value={{ path, navigate }}>{children}</Ctx.Provider>;
}

export function useNavigate() {
  return useContext(Ctx).navigate;
}

export function useLocation() {
  return useContext(Ctx).path;
}

export function useParams(): Record<string, string> {
  const path = useLocation();
  const routes = [
    '/assessment/:id/schemes/:sid',
    '/assessment/:id/upload',
    '/assessment/:id/processing',
    '/assessment/:id/extraction',
    '/assessment/:id/schemes',
    '/assessment/:id/guidance',
  ];
  for (const pattern of routes) {
    const matched = match(pattern, path);
    if (matched) return matched;
  }
  return {};
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

function match(pattern: string, path: string): Record<string, string> | null {
  const pSeg = pattern.split('/').filter(Boolean);
  const aSeg = path.split('/').filter(Boolean);
  if (pSeg.length !== aSeg.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSeg.length; i++) {
    if (pSeg[i].startsWith(':')) params[pSeg[i].slice(1)] = decodeURIComponent(aSeg[i]);
    else if (pSeg[i] !== aSeg[i]) return null;
  }
  return params;
}

export function Routes({
  routes,
  fallback,
}: {
  routes: { path: string; element: ReactNode }[];
  fallback?: ReactNode;
}) {
  const path = useLocation();
  for (const route of routes) {
    if (match(route.path, path) || route.path === path) return <>{route.element}</>;
  }
  return <>{fallback ?? null}</>;
}
