// Frontend data contracts. Shaped to mirror the PRD data model (§14) and API
// contract (§13) so the mock layer in lib/mock can later be swapped for real
// fetch() calls without touching UI components.

export type Decision = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_REVIEW';
export type RuleResultStatus = 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_APPLICABLE';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type DocReadiness =
  | 'PRESENT'
  | 'MISSING'
  | 'CONFLICTING'
  | 'LOW_CONFIDENCE'
  | 'NOT_REQUIRED';
export type BenefitStatus = 'AVAILABLE' | 'ESTIMATE_UNAVAILABLE' | 'REVIEW';
export type ReviewReasonCode =
  | 'MISSING_FACT'
  | 'CONFLICTING_FACT'
  | 'LOW_CONFIDENCE'
  | 'RULE_AMBIGUITY'
  | 'SOURCE_STALE'
  | 'UNSUPPORTED_CASE';
export type ReviewStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface EvidenceSource {
  sourceId: string;
  documentId: string;
  documentName: string;
  page: number;
  snippet: string; // extracted text span shown to the user
}

export interface ExtractedFact {
  factId: string;
  field: string; // e.g. "applicant.age"
  label: string; // e.g. "Age"
  value: string;
  unit?: string;
  confidence: number; // 0..1
  source?: EvidenceSource;
  conflict?: { withValue: string; source: EvidenceSource };
  editable: boolean;
  group: 'identity' | 'economic' | 'business' | 'evidence';
}

export interface Document {
  documentId: string;
  caseId: string;
  fileName: string;
  mimeType: string;
  sizeLabel: string;
  pageCount: number;
  classification: string; // detected doc type
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED' | 'UNSUPPORTED';
  errorCode?: string;
}

export interface ProcessingJob {
  jobId: string;
  caseId: string;
  status: JobStatus;
  progress: number; // 0..100
  steps: { key: string; label: string; state: 'done' | 'active' | 'pending' | 'failed' }[];
  errorCode?: string;
  errorMessage?: string;
}

export interface EligibilityRule {
  ruleId: string;
  label: string;
  description: string; // plain language rule statement
  operatorExpr: string; // e.g. "age >= 18"
  requiredValue: string;
  sourceDocument: string;
  sourcePage: number;
  sourceText: string;
  effectiveFrom: string;
  lastVerified: string;
}

export interface RuleResult {
  ruleId: string;
  result: RuleResultStatus;
  applicantValue: string;
  evaluationText: string; // e.g. "24 >= 18 -> PASS"
  reason?: string;
  factId?: string;
  evidence?: EvidenceSource;
  rule: EligibilityRule;
}

export interface RequiredDocument {
  id: string;
  name: string;
  mandatory: boolean;
  readiness: DocReadiness;
  sourceRule: string;
  reason: string;
}

export interface BenefitCalculation {
  status: BenefitStatus;
  amountLabel?: string;
  formula: string;
  inputs: { label: string; value: string }[];
  capLabel?: string;
  sourceDocument: string;
  sourcePage: number;
  missingInputs?: string[];
}

export interface Scheme {
  schemeId: string;
  name: string;
  ministry: string;
  purpose: string;
  category: string;
  benefitType: string;
  applicationUrl: string;
  officialSource: string;
  lastVerified: string;
  overview: string;
  whoCanApply: string[];
  eligibilityConditions: string[];
  benefitSummary: string;
  requiredDocuments: RequiredDocument[];
  applicationProcess: string[];
}

export interface SchemeEvaluation {
  evaluationId: string;
  schemeId: string;
  decision: Decision;
  whyText: string; // source-grounded summary
  ruleResults: RuleResult[];
  benefit: BenefitCalculation;
  reviewReasons: ReviewReasonCode[];
  sourceStale?: boolean;
}

export interface ReviewCase {
  reviewId: string;
  evaluationId: string;
  schemeName: string;
  reasonCode: ReviewReasonCode;
  title: string;
  explanation: string;
  affectedRule: string;
  conflictingEvidence?: { source: EvidenceSource; value: string }[];
  documentsInvolved: string[];
  status: ReviewStatus;
  history: { at: string; actor: string; action: string }[];
}

export interface Applicant {
  name: string;
  age?: number;
  state?: string;
  district?: string;
  category?: string;
}

export interface AssessmentCase {
  caseId: string;
  title: string;
  status: Decision | 'PROCESSING' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
  applicant: Applicant;
  documents: Document[];
  facts: ExtractedFact[];
  schemes: Scheme[];
  evaluations: SchemeEvaluation[];
}
