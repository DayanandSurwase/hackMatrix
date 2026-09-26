from __future__ import annotations

from typing import Any

from ..schemas import (
    ApplicantProfile,
    EligibilityResponse,
    RuleResultOut,
    SchemeEvaluationOut,
    SchemeMeta,
    SourceCitation,
)
from .catalog import KNOWN_CATEGORIES, SCHEMES
from .jsonlogic import jsonlogic

CONFIDENCE_FLOOR = 0.80
BOUNDARY_RATIO = 0.05


def _citation(raw: dict[str, Any]) -> SourceCitation:
    return SourceCitation(**raw)


def _is_near_threshold(profile: dict[str, Any], spec: dict[str, Any] | None) -> bool:
    if not spec:
        return False
    field = spec["field"]
    threshold = float(spec["value"])
    if threshold == 0:
        return False
    try:
        value = float(profile.get(field) or 0)
    except (TypeError, ValueError):
        return False
    return abs(value - threshold) / abs(threshold) <= BOUNDARY_RATIO


def _evaluate_rule(rule: dict[str, Any], profile: dict[str, Any]) -> RuleResultOut:
    passed = bool(jsonlogic(rule["jsonlogic"], profile))
    near = _is_near_threshold(profile, rule.get("numeric_threshold"))
    applicant_raw = profile.get(rule.get("fact_id") or "")
    applicant_value = "—" if applicant_raw is None else str(applicant_raw)

    if near:
        result = "REVIEW"
        reason = "INCOME_NEAR_CUTOFF" if "income" in (rule.get("fact_id") or "") else "NEAR_THRESHOLD_BOUNDARY"
        evaluation = f"{applicant_value} is within ±5% of {rule['required_value']}"
    elif passed:
        result = "PASS"
        reason = None
        evaluation = f"{applicant_value} satisfies {rule['operator_expr']}"
    else:
        result = "FAIL"
        reason = "STRICT_RULE_FAILED"
        evaluation = f"{applicant_value} fails {rule['operator_expr']}"

    source = _citation(rule["source"])
    return RuleResultOut(
        rule_id=rule["rule_id"],
        label=rule["label"],
        description=rule["description"],
        result=result,
        applicant_value=applicant_value,
        required_value=rule["required_value"],
        evaluation_text=evaluation,
        reason=reason,
        operator_expr=rule["operator_expr"],
        source=source,
        fact_id=rule.get("fact_id"),
    )


def _missing_docs(catalog: list[dict[str, Any]], uploaded: list[str]) -> tuple[list[str], list[dict[str, Any]]]:
    uploaded_l = {u.lower() for u in uploaded}
    missing: list[str] = []
    enriched: list[dict[str, Any]] = []
    for doc in catalog:
        name = doc["name"]
        tokens = [doc["id"], name.lower(), *[t for t in name.lower().replace("/", " ").split() if len(t) > 3]]
        present = any(any(tok in u for tok in tokens) for u in uploaded_l) if uploaded_l else False
        readiness = "PRESENT" if present else ("MISSING" if doc.get("mandatory") else "NOT_REQUIRED")
        if doc.get("mandatory") and not present:
            missing.append(name)
        enriched.append({**doc, "readiness": readiness})
    return missing, enriched


def _classify(
    rule_results: list[RuleResultOut],
    profile: ApplicantProfile,
    category: str,
) -> tuple[str, str | None, str | None, bool, str]:
    failed = [r for r in rule_results if r.result == "FAIL"]
    review = [r for r in rule_results if r.result == "REVIEW"]
    ambiguous_category = category not in KNOWN_CATEGORIES
    low_conf = profile.document_confidence < CONFIDENCE_FLOOR

    if failed:
        first = failed[0]
        return (
            "INELIGIBLE",
            first.rule_id,
            first.source.exact_text_excerpt,
            False,
            f"Fails strict rule {first.rule_id} ({first.label}): {first.evaluation_text}.",
        )

    if review or low_conf or ambiguous_category:
        reasons = []
        if review:
            reasons.append(review[0].evaluation_text)
        if low_conf:
            reasons.append(f"Overall document confidence {profile.document_confidence:.2f} is below 0.80")
        if ambiguous_category:
            reasons.append(f"Category '{category}' is ambiguous and needs manual confirmation")
        explanation = "Manual Review Required. " + "; ".join(reasons) + "."
        return "BORDERLINE_REVIEW", None, None, True, explanation

    return (
        "ELIGIBLE",
        None,
        None,
        False,
        "All binary rules passed and document confidence is at least 0.80.",
    )


def evaluate_profile(profile: ApplicantProfile) -> EligibilityResponse:
    data = profile.model_dump()
    results: list[SchemeEvaluationOut] = []

    for scheme in SCHEMES:
        rule_results = [_evaluate_rule(rule, data) for rule in scheme["rules"]]
        status, failed_id, failed_text, manual, explanation = _classify(rule_results, profile, profile.category)
        missing, docs = _missing_docs(scheme["required_document_catalog"], profile.uploaded_documents)

        scored = [r for r in rule_results if r.result != "NOT_APPLICABLE"]
        passes = sum(1 for r in scored if r.result == "PASS")
        match = round(100 * (passes / len(scored)), 1) if scored else 0.0
        match *= profile.document_confidence
        match = round(min(100.0, match), 1)

        benefit_amount = scheme["benefit_amount"]
        benefit_numeric = scheme["benefit_numeric"]
        if status == "INELIGIBLE":
            benefit_numeric = 0
        elif status == "BORDERLINE_REVIEW":
            benefit_amount = "Pending review"

        primary_source = rule_results[0].source if rule_results else _citation(scheme["rules"][0]["source"])
        if failed_id:
            for rr in rule_results:
                if rr.rule_id == failed_id:
                    primary_source = rr.source
                    break

        meta = SchemeMeta(
            ministry=scheme["ministry"],
            category=scheme["category"],
            purpose=scheme["purpose"],
            overview=scheme["overview"],
            who_can_apply=scheme["who_can_apply"],
            eligibility_conditions=scheme["eligibility_conditions"],
            benefit_summary=scheme["benefit_summary"],
            application_process=scheme["application_process"],
            official_source=scheme["official_source"],
            last_verified=scheme["last_verified"],
            application_url=scheme["application_url"],
            required_documents=docs,
            benefit_formula=scheme.get("benefit_formula"),
            benefit_cap_label=scheme.get("benefit_cap_label"),
            benefit_inputs=scheme.get("benefit_inputs") or [],
        )

        results.append(
            SchemeEvaluationOut(
                scheme_id=scheme["scheme_id"],
                scheme_name=scheme["scheme_name"],
                status=status,
                match_score=match,
                estimated_benefit_amount=benefit_amount,
                estimated_benefit_numeric=float(benefit_numeric) if status == "ELIGIBLE" else None,
                explanation=explanation,
                source_citation=primary_source,
                missing_documents=missing,
                failed_rule_id=failed_id,
                failed_clause_text=failed_text,
                manual_review_required=manual,
                rule_results=rule_results,
                scheme_meta=meta,
            )
        )

    counts = {
        "ELIGIBLE": sum(1 for r in results if r.status == "ELIGIBLE"),
        "INELIGIBLE": sum(1 for r in results if r.status == "INELIGIBLE"),
        "BORDERLINE_REVIEW": sum(1 for r in results if r.status == "BORDERLINE_REVIEW"),
    }
    return EligibilityResponse(results=results, overall_status_counts=counts, profile_used=data)
