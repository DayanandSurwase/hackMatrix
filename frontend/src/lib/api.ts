import type { ExtractResponse, EligibilityResponse, ProcessingJob, ReviewCase } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return response.json() as Promise<T>;
}

export async function extractDocument(file?: File, useSample = false): Promise<ExtractResponse> {
  const params = useSample ? '?use_sample=true' : '';
  if (useSample && !file) {
    return request<ExtractResponse>(`/api/v1/extract-document${params}`, { method: 'POST' });
  }
  const form = new FormData();
  if (file) form.append('file', file);
  return request<ExtractResponse>(`/api/v1/extract-document${params}`, {
    method: 'POST',
    body: form,
  });
}

export async function evaluateEligibility(profile: Record<string, unknown>): Promise<EligibilityResponse> {
  return request<EligibilityResponse>('/api/v1/evaluate-eligibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

const JOB_STEPS = [
  { key: 'ingest', label: 'Ingest & virus scan' },
  { key: 'ocr', label: 'OCR / PDF text extraction' },
  { key: 'parse', label: 'Structured field extraction' },
  { key: 'index', label: 'Evidence indexing' },
];

export function makeJob(caseId: string): ProcessingJob {
  return {
    jobId: `job-${caseId.slice(-4)}-${Date.now().toString().slice(-4)}`,
    caseId,
    status: 'RUNNING',
    progress: 8,
    steps: JOB_STEPS.map((s, i) => ({ ...s, state: i === 0 ? 'active' : 'pending' })),
  };
}

export function tickJob(job: ProcessingJob): ProcessingJob {
  const next = { ...job, steps: job.steps.map((s) => ({ ...s })) };
  const active = next.steps.findIndex((s) => s.state === 'active');
  if (active >= 0) {
    next.steps[active].state = 'done';
    if (active + 1 < next.steps.length) next.steps[active + 1].state = 'active';
  }
  const done = next.steps.filter((s) => s.state === 'done').length;
  next.progress = Math.min(100, Math.round((done / next.steps.length) * 100));
  if (done === next.steps.length) {
    next.status = 'COMPLETED';
    next.progress = 100;
  }
  return next;
}

export async function listReviews(): Promise<ReviewCase[]> {
  return [
    {
      reviewId: 'rev-0417-1',
      title: 'Income near rent-subsidy cutoff',
      schemeName: 'Housing Choice Voucher / Rent Subsidy',
      reasonCode: 'LOW_CONFIDENCE',
      status: 'OPEN',
      explanation: 'Household income is within ±5% of the ₹3.0L cap, or document confidence is below 0.80. Manual Review Required.',
      affectedRule: 'RENT-R1',
      documentsInvolved: ['Income certificate'],
      history: [
        { actor: 'Rule engine', action: 'Flagged BORDERLINE_REVIEW', at: new Date().toISOString() },
      ],
    },
  ];
}
