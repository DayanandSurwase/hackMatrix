import type {
  CaseRecord,
  EligibilityResponse,
  ExtractResponse,
  Fact,
  Scheme,
  SchemeEvaluation,
  SchemeEvaluationApi,
} from './types';

const FACT_META: Record<string, { label: string; group: Fact['group']; unit?: string }> = {
  full_name: { label: 'Full name', group: 'identity' },
  age: { label: 'Age', group: 'identity' },
  state_of_residence: { label: 'State of residence', group: 'identity' },
  category: { label: 'Category', group: 'identity' },
  gross_annual_income: { label: 'Gross annual income', group: 'economic', unit: 'INR' },
  employment_status: { label: 'Employment status', group: 'economic' },
  household_size: { label: 'Household size', group: 'economic' },
  land_holding: { label: 'Land holding', group: 'evidence', unit: 'ha' },
  education_level: { label: 'Education', group: 'business' },
  project_cost: { label: 'Project cost', group: 'business', unit: 'INR' },
  is_institutional_landholder: { label: 'Institutional landholder', group: 'evidence' },
};

const STATUS_MAP = {
  ELIGIBLE: 'ELIGIBLE',
  INELIGIBLE: 'NOT_ELIGIBLE',
  BORDERLINE_REVIEW: 'NEEDS_REVIEW',
} as const;

export function factsFromExtraction(extract: ExtractResponse, documentName = 'Uploaded document'): Fact[] {
  const data = extract.extracted_data;
  const scores = extract.field_confidence_scores;
  return Object.keys(FACT_META).map((key) => {
    const meta = FACT_META[key];
    const raw = data[key];
    return {
      factId: key,
      label: meta.label,
      value: raw === null || raw === undefined ? '' : String(raw),
      unit: meta.unit,
      confidence: scores[key] ?? extract.overall_document_confidence,
      group: meta.group,
      editable: true,
      source: {
        documentName,
        page: 1,
        snippet: `${meta.label}: ${raw ?? '—'}`,
      },
    };
  });
}

export function profileFromFacts(facts: Fact[], documentConfidence: number, uploaded: string[]) {
  const get = (id: string) => facts.find((f) => f.factId === id)?.value ?? '';
  const num = (id: string, fallback = 0) => {
    const v = Number(String(get(id)).replace(/,/g, ''));
    return Number.isFinite(v) && get(id) !== '' ? v : fallback;
  };
  return {
    full_name: get('full_name') || 'Applicant',
    gross_annual_income: num('gross_annual_income'),
    age: Math.round(num('age', 18)),
    state_of_residence: get('state_of_residence') || 'Uttar Pradesh',
    category: get('category') || 'Unknown',
    employment_status: get('employment_status') || 'Unemployed',
    household_size: Math.max(1, Math.round(num('household_size', 1))),
    land_holding: num('land_holding'),
    document_confidence: documentConfidence,
    education_level: get('education_level') || '8th_pass',
    project_cost: num('project_cost', 500000),
    is_institutional_landholder: String(get('is_institutional_landholder')).toLowerCase() === 'true',
    uploaded_documents: uploaded,
  };
}

function mapScheme(row: SchemeEvaluationApi): Scheme {
  return {
    schemeId: row.scheme_id,
    name: row.scheme_name,
    ministry: row.scheme_meta.ministry,
    category: row.scheme_meta.category,
    purpose: row.scheme_meta.purpose,
    overview: row.scheme_meta.overview,
    whoCanApply: row.scheme_meta.who_can_apply,
    eligibilityConditions: row.scheme_meta.eligibility_conditions,
    benefitSummary: row.scheme_meta.benefit_summary,
    applicationProcess: row.scheme_meta.application_process,
    officialSource: row.scheme_meta.official_source,
    lastVerified: row.scheme_meta.last_verified,
    applicationUrl: row.scheme_meta.application_url,
    requiredDocuments: row.scheme_meta.required_documents,
  };
}

function mapEvaluation(row: SchemeEvaluationApi): SchemeEvaluation {
  const decision = STATUS_MAP[row.status];
  const benefitStatus = decision === 'ELIGIBLE' ? 'AVAILABLE' : decision === 'NEEDS_REVIEW' ? 'REVIEW' : 'UNAVAILABLE';
  return {
    schemeId: row.scheme_id,
    decision,
    whyText: row.explanation,
    matchScore: row.match_score,
    sourceStale: false,
    benefit: {
      status: benefitStatus,
      amountLabel: benefitStatus === 'AVAILABLE' ? row.estimated_benefit_amount : undefined,
      formula: row.scheme_meta.benefit_formula ?? undefined,
      inputs: row.scheme_meta.benefit_inputs ?? [],
      capLabel: row.scheme_meta.benefit_cap_label ?? undefined,
      missingInputs: row.missing_documents,
      sourceDocument: row.source_citation.document_name,
      sourcePage: row.source_citation.page_number,
    },
    ruleResults: row.rule_results.map((rr) => ({
      ruleId: rr.rule_id,
      result: rr.result,
      applicantValue: rr.applicant_value,
      evaluationText: rr.evaluation_text,
      reason: rr.reason ?? undefined,
      factId: rr.fact_id ?? undefined,
      evidence: {
        documentName: rr.source.document_name,
        page: rr.source.page_number,
        snippet: rr.source.exact_text_excerpt,
      },
      rule: {
        label: rr.label,
        description: rr.description,
        requiredValue: rr.required_value,
        operatorExpr: rr.operator_expr,
        sourceDocument: rr.source.document_name,
        sourcePage: rr.source.page_number,
        sourceText: `Clause ${rr.source.clause_number}: ${rr.source.exact_text_excerpt}`,
        lastVerified: row.scheme_meta.last_verified,
        effectiveFrom: '2024-04-01',
      },
    })),
  };
}

export function caseFromEligibility(
  caseId: string,
  facts: Fact[],
  eligibility: EligibilityResponse,
  documents: { id: string; name: string; type: string }[],
): CaseRecord {
  const evaluations = eligibility.results.map(mapEvaluation);
  const headline = evaluations.some((e) => e.decision === 'ELIGIBLE')
    ? 'ELIGIBLE'
    : evaluations.some((e) => e.decision === 'NEEDS_REVIEW')
      ? 'NEEDS_REVIEW'
      : 'NOT_ELIGIBLE';
  return {
    caseId,
    title: 'FIN-03 eligibility case',
    status: headline,
    facts,
    schemes: eligibility.results.map(mapScheme),
    evaluations,
    documents,
  };
}
