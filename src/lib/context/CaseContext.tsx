import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AssessmentCase } from '../types';
import { getCase } from '../api';

interface CaseState {
  activeCase: AssessmentCase | null;
  loading: boolean;
  updateFact: (factId: string, value: string) => void;
}

const Ctx = createContext<CaseState>({ activeCase: null, loading: true, updateFact: () => {} });
export const useCase = () => useContext(Ctx);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [activeCase, setActiveCase] = useState<AssessmentCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCase('case-2025-0417').then((c) => {
      setActiveCase(c);
      setLoading(false);
    });
  }, []);

  const updateFact = (factId: string, value: string) => {
    setActiveCase((c) =>
      c
        ? { ...c, facts: c.facts.map((f) => (f.factId === factId ? { ...f, value, confidence: 1 } : f)) }
        : c,
    );
  };

  return <Ctx.Provider value={{ activeCase, loading, updateFact }}>{children}</Ctx.Provider>;
}
