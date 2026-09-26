import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CaseRecord, ExtractResponse, Fact } from '../types';
import { caseFromEligibility, factsFromExtraction, profileFromFacts } from '../mappers';
import { evaluateEligibility, extractDocument } from '../api';

const CASE_ID = 'case-2025-0417';

const DEMO_PROFILE = {
  full_name: 'Ramesh Kumar',
  gross_annual_income: 240000,
  age: 34,
  state_of_residence: 'Uttar Pradesh',
  category: 'OBC',
  employment_status: 'Farmer',
  household_size: 5,
  land_holding: 1.2,
  document_confidence: 0.91,
  education_level: '10th_pass',
  project_cost: 800000,
  is_institutional_landholder: false,
  uploaded_documents: ['aadhaar_front.pdf', 'income_certificate.pdf', 'school_certificate.jpg'],
};

interface CaseCtx {
  activeCase: CaseRecord | null;
  loading: boolean;
  updateFact: (factId: string, value: string) => void;
  setStateFilter: (state: string) => void;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  lastExtract: ExtractResponse | null;
  runExtraction: (files: File[]) => Promise<void>;
  runEvaluation: () => Promise<void>;
}

const Ctx = createContext<CaseCtx | null>(null);

function emptyCase(): CaseRecord {
  return {
    caseId: CASE_ID,
    title: 'New assessment',
    status: 'NEEDS_REVIEW',
    facts: [],
    schemes: [],
    evaluations: [],
    documents: [],
  };
}

export function CaseProvider({ children }: { children: ReactNode }) {
  const [activeCase, setActiveCase] = useState<CaseRecord | null>(emptyCase);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [lastExtract, setLastExtract] = useState<ExtractResponse | null>(null);
  const caseRef = useRef(activeCase);
  const extractRef = useRef(lastExtract);
  caseRef.current = activeCase;
  extractRef.current = lastExtract;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const eligibility = await evaluateEligibility(DEMO_PROFILE);
        if (cancelled) return;
        const facts = factsFromExtraction(
          {
            extracted_data: DEMO_PROFILE,
            field_confidence_scores: {
              full_name: 0.92,
              gross_annual_income: 0.9,
              age: 0.93,
              state_of_residence: 0.88,
              category: 0.86,
              employment_status: 0.84,
              household_size: 0.87,
              land_holding: 0.85,
              education_level: 0.82,
              project_cost: 0.8,
              is_institutional_landholder: 0.7,
            },
            overall_document_confidence: 0.91,
            low_confidence_warning: true,
            extractor_mode: 'pdf_text',
            warnings: [],
          },
          'income_certificate.pdf',
        );
        setActiveCase(
          caseFromEligibility(CASE_ID, facts, eligibility, [
            { id: '1', name: 'aadhaar_front.pdf', type: 'Aadhaar card' },
            { id: '2', name: 'income_certificate.pdf', type: 'Income certificate' },
            { id: '3', name: 'school_certificate.jpg', type: 'Education certificate' },
          ]),
        );
      } catch {
        if (!cancelled) setActiveCase(emptyCase());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CaseCtx>(
    () => ({
      activeCase,
      loading,
      uploadedFiles,
      setUploadedFiles,
      lastExtract,
      updateFact: (factId, value) => {
        setActiveCase((current) => {
          if (!current) return current;
          return {
            ...current,
            facts: current.facts.map((f) => (f.factId === factId ? { ...f, value, confidence: Math.max(f.confidence, 0.9) } : f)),
          };
        });
      },
      setStateFilter: (state: string) => {
        sessionStorage.setItem('user_state', state);
        setActiveCase((current) => {
          if (!current) return current;
          const facts = current.facts.some((f) => f.factId === 'state_of_residence')
            ? current.facts.map((f) => (f.factId === 'state_of_residence' ? { ...f, value: state } : f))
            : current.facts;
          return { ...current, facts };
        });
      },
      runExtraction: async (files: File[]) => {
        setLoading(true);
        try {
          let extract: ExtractResponse;
          if (files.length === 0) {
            extract = await extractDocument(undefined, true);
          } else {
            const parts = await Promise.all(files.map((file) => extractDocument(file, false)));
            extract = mergeExtracts(parts);
          }
          setLastExtract(extract);
          const facts = factsFromExtraction(extract, files[0]?.name ?? 'Income certificate (sample)');
          setActiveCase({
            caseId: CASE_ID,
            title: 'Document assessment',
            status: extract.low_confidence_warning ? 'NEEDS_REVIEW' : 'ELIGIBLE',
            facts,
            schemes: [],
            evaluations: [],
            documents: (files.length ? files : [{ name: 'income_certificate.pdf' }]).map((f, i) => ({
              id: String(i + 1),
              name: f.name,
              type: 'certificate',
            })),
          });
        } finally {
          setLoading(false);
        }
      },
      runEvaluation: async () => {
        const current = caseRef.current;
        if (!current) return;
        setLoading(true);
        try {
          const confidence = extractRef.current?.overall_document_confidence ?? minConfidence(current.facts);
          const profile = profileFromFacts(
            current.facts,
            confidence,
            current.documents.map((d) => d.name),
          );
          const eligibility = await evaluateEligibility(profile);
          setActiveCase(caseFromEligibility(CASE_ID, current.facts, eligibility, current.documents));
        } finally {
          setLoading(false);
        }
      },
    }),
    [activeCase, loading, uploadedFiles, lastExtract],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCase() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCase must be used within CaseProvider');
  return ctx;
}

function minConfidence(facts: Fact[]) {
  if (!facts.length) return 0.6;
  return facts.reduce((m, f) => m + f.confidence, 0) / facts.length;
}

function mergeExtracts(parts: ExtractResponse[]): ExtractResponse {
  const extracted: Record<string, unknown> = {};
  const scores: Record<string, number> = {};
  const warnings: string[] = [];
  for (const part of parts) {
    warnings.push(...(part.warnings ?? []));
    for (const [k, v] of Object.entries(part.extracted_data)) {
      if (v === null || v === undefined || v === '') continue;
      const score = part.field_confidence_scores[k] ?? 0;
      if (!(k in extracted) || score >= (scores[k] ?? 0)) {
        extracted[k] = v;
        scores[k] = score;
      }
    }
  }
  const values = Object.values(scores);
  const overall = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return {
    extracted_data: extracted,
    field_confidence_scores: scores,
    overall_document_confidence: Number(overall.toFixed(4)),
    low_confidence_warning: values.some((v) => v < 0.8),
    extractor_mode: parts.some((p) => p.extractor_mode === 'mock_fallback') ? 'mock_fallback' : parts[0]?.extractor_mode ?? 'regex',
    warnings,
  };
}
