export type Decision = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_REVIEW';
export type DocReadiness = 'PRESENT' | 'MISSING' | 'CONFLICTING' | 'LOW_CONFIDENCE' | 'NOT_REQUIRED';
export type RuleResultStatus = 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_APPLICABLE';

export interface EvidenceSource {
  documentName: string;
  page: number;
  snippet: string;
}

export interface PolicyRule {
  label: string;
  description: string;
  requiredValue: string;
  operatorExpr: string;
  sourceDocument: string;
  sourcePage: number;
  sourceText: string;
  lastVerified: string;
  effectiveFrom: string;
}

export interface RuleResult {
  ruleId: string;
  result: RuleResultStatus;
  rule: PolicyRule;
  applicantValue: string;
  evaluationText: string;
  reason?: string;
  evidence?: EvidenceSource;
  factId?: string;
}

export interface BenefitEstimate {
  status: 'AVAILABLE' | 'REVIEW' | 'UNAVAILABLE';
  amountLabel?: string;
  formula?: string;
  inputs: { label: string; value: string }[];
  capLabel?: string;
  missingInputs?: string[];
  sourceDocument: string;
  sourcePage: number;
}

export interface SchemeEvaluation {
  schemeId: string;
  decision: Decision;
  whyText: string;
  ruleResults: RuleResult[];
  benefit: BenefitEstimate;
  sourceStale?: boolean;
  matchScore?: number;
}

export interface RequiredDocument {
  id: string;
  name: string;
  mandatory: boolean;
  reason: string;
  readiness: DocReadiness;
}

export interface Scheme {
  schemeId: string;
  name: string;
  ministry: string;
  category: string;
  purpose: string;
  overview: string;
  whoCanApply: string[];
  eligibilityConditions: string[];
  benefitSummary: string;
  applicationProcess: string[];
  officialSource: string;
  lastVerified: string;
  applicationUrl: string;
  requiredDocuments: RequiredDocument[];
}

export interface Fact {
  factId: string;
  label: string;
  value: string;
  unit?: string;
  confidence: number;
  group: 'identity' | 'economic' | 'business' | 'evidence';
  source?: EvidenceSource;
  editable?: boolean;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
}

export interface CaseRecord {
  caseId: string;
  title: string;
  status: Decision | string;
  facts: Fact[];
  schemes: Scheme[];
  evaluations: SchemeEvaluation[];
  documents: CaseDocument[];
}

export interface ProcessingJob {
  jobId: string;
  caseId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  steps: { key: string; label: string; state: 'pending' | 'active' | 'done' | 'failed' }[];
}

export interface ReviewCase {
  reviewId: string;
  title: string;
  schemeName: string;
  reasonCode: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  explanation: string;
  affectedRule: string;
  documentsInvolved: string[];
  conflictingEvidence?: { value: string; source: EvidenceSource }[];
  history: { actor: string; action: string; at: string }[];
}

export interface ExtractResponse {
  extracted_data: Record<string, unknown>;
  field_confidence_scores: Record<string, number>;
  overall_document_confidence: number;
  low_confidence_warning: boolean;
  extractor_mode: string;
  warnings: string[];
}

export interface SourceCitation {
  document_name: string;
  page_number: number;
  clause_number: string;
  exact_text_excerpt: string;
}

export interface SchemeEvaluationApi {
  scheme_id: string;
  scheme_name: string;
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'BORDERLINE_REVIEW';
  match_score: number;
  estimated_benefit_amount: string;
  estimated_benefit_numeric: number | null;
  explanation: string;
  source_citation: SourceCitation;
  missing_documents: string[];
  failed_rule_id: string | null;
  failed_clause_text: string | null;
  manual_review_required: boolean;
  rule_results: {
    rule_id: string;
    label: string;
    description: string;
    result: RuleResultStatus;
    applicant_value: string;
    required_value: string;
    evaluation_text: string;
    reason: string | null;
    operator_expr: string;
    source: SourceCitation;
    fact_id: string | null;
  }[];
  scheme_meta: {
    ministry: string;
    category: string;
    purpose: string;
    overview: string;
    who_can_apply: string[];
    eligibility_conditions: string[];
    benefit_summary: string;
    application_process: string[];
    official_source: string;
    last_verified: string;
    application_url: string;
    required_documents: RequiredDocument[];
    benefit_formula?: string | null;
    benefit_cap_label?: string | null;
    benefit_inputs?: { label: string; value: string }[];
  };
}

export interface EligibilityResponse {
  results: SchemeEvaluationApi[];
  overall_status_counts: Record<string, number>;
  profile_used: Record<string, unknown>;
}
