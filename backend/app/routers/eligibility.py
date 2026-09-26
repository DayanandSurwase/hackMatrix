from fastapi import APIRouter, HTTPException

from ..rules.engine import evaluate_profile
from ..rules.catalog import SCHEMES
from ..schemas import ApplicantProfile, EligibilityResponse

router = APIRouter(prefix="/api/v1", tags=["eligibility"])


@router.post("/evaluate-eligibility", response_model=EligibilityResponse)
async def evaluate_eligibility(profile: ApplicantProfile) -> EligibilityResponse:
    try:
        return evaluate_profile(profile)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=422, detail=f"Eligibility evaluation failed: {exc}") from exc


@router.get("/schemes")
async def list_schemes() -> list[dict]:
    return [
        {
            "scheme_id": s["scheme_id"],
            "scheme_name": s["scheme_name"],
            "ministry": s["ministry"],
            "purpose": s["purpose"],
        }
        for s in SCHEMES
    ]
