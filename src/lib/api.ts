// Mock API layer. Function names/shapes mirror the PRD backend contract (§13)
// so these can later be replaced with real fetch() calls. All functions are
// async and return typed data with a small artificial latency.

import type {
  AssessmentCase,
  ProcessingJob,
  ReviewCase,
  SchemeEvaluation,
} from './types';
import { demoCase, reviewCases } from './mock/data';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// GET /api/v1/cases/{case_id}
export async function getCase(_caseId: string): Promise<AssessmentCase> {
  await delay(320);
  return demoCase;
}

// GET /api/v1/cases  (dashboard + history)
export async function listCases(): Promise<AssessmentCase[]> {
  await delay(220);
  return [demoCase];
}

// GET /api/v1/evaluations/{evaluation_id}
export async function getEvaluation(schemeId: string): Promise<SchemeEvaluation | undefined> {
  await delay(260);
  return demoCase.evaluations.find((e) => e.schemeId === schemeId);
}

// GET /api/v1/reviews
export async function listReviews(): Promise<ReviewCase[]> {
  await delay(200);
  return reviewCases;
}

// GET /api/v1/jobs/{job_id} — simulated processing state machine.
const JOB_STEPS: ProcessingJob['steps'] = [
  { key: 'upload', label: 'Files received', state: 'pending' },
  { key: 'text', label: 'Text extraction (PyPDF)', state: 'pending' },
  { key: 'ocr', label: 'OCR on scanned pages (EasyOCR)', state: 'pending' },
  { key: 'classify', label: 'Document classification', state: 'pending' },
  { key: 'facts', label: 'Structured fact extraction', state: 'pending' },
];

export function makeJob(caseId: string): ProcessingJob {
  return {
    jobId: 'job-' + Math.random().toString(36).slice(2, 8),
    caseId,
    status: 'QUEUED',
    progress: 0,
    steps: JOB_STEPS.map((s) => ({ ...s })),
  };
}

// Advance a job by one tick. Pure function so callers control timing.
export function tickJob(job: ProcessingJob): ProcessingJob {
  const next: ProcessingJob = {
    ...job,
    steps: job.steps.map((s) => ({ ...s })),
  };
  const activeIdx = next.steps.findIndex((s) => s.state !== 'done');
  if (activeIdx === -1) {
    next.status = 'COMPLETED';
    next.progress = 100;
    return next;
  }
  next.status = 'PROCESSING';
  next.steps[activeIdx].state = 'done';
  const remaining = next.steps.filter((s) => s.state !== 'done').length;
  next.progress = Math.round(((next.steps.length - remaining) / next.steps.length) * 100);
  if (remaining > 0) next.steps[next.steps.findIndex((s) => s.state !== 'done')].state = 'active';
  else next.status = 'COMPLETED';
  return next;
}

export const currency = (n: number) => '₹' + n.toLocaleString('en-IN');
