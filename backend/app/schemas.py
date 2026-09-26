from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


Category = Literal["General", "OBC", "SC", "ST", "Unknown"]
EmploymentStatus = Literal["Salaried", "Self-Employed", "Unemployed", "Farmer"]
EligibilityStatus = Literal["ELIGIBLE", "INELIGIBLE", "BORDERLINE_REVIEW"]
RuleOutcome = Literal["PASS", "FAIL", "REVIEW", "NOT_APPLICABLE"]


class ExtractedApplicantData(BaseModel):
    full_name: str | None = None
    gross_annual_income: float | None = None
    age: int | None = None
    state_of_residence: str | None = None
    category: str | None = None
    employment_status: str | None = None
    household_size: int | None = None
    land_holding: float | None = Field(default=None, description="Cultivable land in hectares")
    education_level: str | None = None
    project_cost: float | None = None
    is_institutional_landholder: bool | None = False


class DocumentExtractResponse(BaseModel):
    extracted_data: dict[str, Any]
    field_confidence_scores: dict[str, float]
    overall_document_confidence: float = Field(ge=0.0, le=1.0)
    low_confidence_warning: bool
    extractor_mode: Literal["pdf_text", "regex", "mock_fallback"]
    warnings: list[str] = Field(default_factory=list)


class ApplicantProfile(BaseModel):
    full_name: str | None = None
    gross_annual_income: float = Field(ge=0)
    age: int = Field(ge=0, le=120)
    state_of_residence: str
    category: str
    employment_status: str
    household_size: int = Field(ge=1, le=30)
    land_holding: float = Field(default=0, ge=0, description="Land in hectares")
    document_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    education_level: str = "8th_pass"
    project_cost: float = 500_000
    is_institutional_landholder: bool = False
    uploaded_documents: list[str] = Field(default_factory=list)

    @field_validator("employment_status")
    @classmethod
    def normalize_employment(cls, value: str) -> str:
        aliases = {
            "farmer": "Farmer",
            "salaried": "Salaried",
            "self-employed": "Self-Employed",
            "self employed": "Self-Employed",
            "unemployed": "Unemployed",
        }
        return aliases.get(value.strip().lower(), value)


class SourceCitation(BaseModel):
    document_name: str
    page_number: int
    clause_number: str
    exact_text_excerpt: str


class RuleResultOut(BaseModel):
    rule_id: str
    label: str
    description: str
    result: RuleOutcome
    applicant_value: str
    required_value: str
    evaluation_text: str
    reason: str | None = None
    operator_expr: str
    source: SourceCitation
    fact_id: str | None = None


class SchemeMeta(BaseModel):
    ministry: str
    category: str
    purpose: str
    overview: str
    who_can_apply: list[str]
    eligibility_conditions: list[str]
    benefit_summary: str
    application_process: list[str]
    official_source: str
    last_verified: str
    application_url: str
    required_documents: list[dict[str, Any]]
    benefit_formula: str | None = None
    benefit_cap_label: str | None = None
    benefit_inputs: list[dict[str, str]] = Field(default_factory=list)


class SchemeEvaluationOut(BaseModel):
    scheme_id: str
    scheme_name: str
    status: EligibilityStatus
    match_score: float = Field(ge=0, le=100)
    estimated_benefit_amount: str
    estimated_benefit_numeric: float | None = None
    explanation: str
    source_citation: SourceCitation
    missing_documents: list[str]
    failed_rule_id: str | None = None
    failed_clause_text: str | None = None
    manual_review_required: bool = False
    rule_results: list[RuleResultOut]
    scheme_meta: SchemeMeta


class EligibilityResponse(BaseModel):
    results: list[SchemeEvaluationOut]
    overall_status_counts: dict[str, int]
    profile_used: dict[str, Any]
