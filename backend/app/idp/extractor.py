from __future__ import annotations

import io
from pathlib import Path
from typing import Any

from pypdf import PdfReader

from .parser import parse_applicant_fields

SAMPLE_INCOME_CERTIFICATE = """
GOVERNMENT OF UTTAR PRADESH
DEPARTMENT OF REVENUE
INCOME CERTIFICATE
Certificate No: INC/LKO/2025/0417

This is to certify that Shri RAMESH KUMAR S/o Shri Suresh Kumar,
resident of Village Rampur, Tehsil Bakshi Ka Talab, District Lucknow,
State of Uttar Pradesh, belongs to OBC category.

His/her annual family income from all sources is Rs. 2,40,000/-
(Rupees Two Lakh Forty Thousand only).

Age: 34 years
Occupation: Farmer / Cultivator
Family members: 5
Land holding: 1.20 hectare
Education: 10th pass
Project cost: Rs. 8,00,000

This certificate is issued for the purpose of applying to Central /
State Government welfare schemes including PM-Kisan and PMEGP.
"""

REQUIRED_FIELDS = [
    "full_name",
    "gross_annual_income",
    "age",
    "state_of_residence",
    "category",
    "employment_status",
    "household_size",
]


def mock_extract_income_certificate() -> tuple[dict[str, Any], dict[str, float], list[str]]:
    """Deterministic fallback when OCR / PDF text is unreadable."""
    data = {
        "full_name": "Ramesh Kumar",
        "gross_annual_income": 240000.0,
        "age": 34,
        "state_of_residence": "Uttar Pradesh",
        "category": "OBC",
        "employment_status": "Farmer",
        "household_size": 5,
        "land_holding": 1.2,
        "education_level": "10th_pass",
        "project_cost": 800000.0,
        "is_institutional_landholder": False,
    }
    scores = {k: 0.62 for k in data}
    scores["gross_annual_income"] = 0.58
    warnings = [
        "OCR could not read the document reliably. Mock extractor returned sample Income Certificate values for review.",
    ]
    return data, scores, warnings


def _extract_pdf_text(content: bytes) -> str:
    text_parts: list[str] = []
    try:
        import pdfplumber

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
    except Exception:
        reader = PdfReader(io.BytesIO(content))
        for page in reader.pages:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts)


def _extract_image_text(content: bytes) -> str:
    try:
        from PIL import Image

        Image.open(io.BytesIO(content)).verify()
    except Exception:
        return ""
    return ""


def extract_document_bytes(
    content: bytes,
    filename: str,
    content_type: str | None = None,
    use_sample: bool = False,
) -> dict[str, Any]:
    warnings: list[str] = []
    mode: str = "regex"
    raw_text = ""

    if use_sample:
        raw_text = SAMPLE_INCOME_CERTIFICATE
        mode = "pdf_text"
    else:
        name = (filename or "").lower()
        is_pdf = name.endswith(".pdf") or (content_type or "").endswith("pdf")
        is_image = name.endswith((".png", ".jpg", ".jpeg", ".webp")) or (content_type or "").startswith("image/")
        if is_pdf:
            try:
                raw_text = _extract_pdf_text(content)
                mode = "pdf_text"
            except Exception as exc:
                warnings.append(f"PDF parser failed: {exc}")
                raw_text = ""
        elif is_image:
            raw_text = _extract_image_text(content)
            if not raw_text.strip():
                warnings.append("Image OCR is unavailable in this runtime; using mock extractor.")
        elif content:
            try:
                raw_text = content.decode("utf-8", errors="ignore")
            except Exception:
                raw_text = ""

    data, scores, parse_warnings = parse_applicant_fields(raw_text)
    warnings.extend(parse_warnings)

    readable = sum(1 for f in REQUIRED_FIELDS if data.get(f) not in (None, ""))
    if readable < 3:
        mock_data, mock_scores, mock_warnings = mock_extract_income_certificate()
        data = {**mock_data, **{k: v for k, v in data.items() if v not in (None, "")}}
        scores = {**mock_scores, **scores}
        warnings.extend(mock_warnings)
        mode = "mock_fallback"

    for field in REQUIRED_FIELDS:
        scores.setdefault(field, 0.5 if data.get(field) not in (None, "") else 0.2)

    confidences = [float(v) for v in scores.values()] or [0.0]
    overall = round(sum(confidences) / len(confidences), 4)
    low = any(v < 0.80 for v in scores.values())

    extracted = {k: data.get(k) for k in [
        *REQUIRED_FIELDS,
        "land_holding",
        "education_level",
        "project_cost",
        "is_institutional_landholder",
    ]}

    return {
        "extracted_data": extracted,
        "field_confidence_scores": {k: round(float(v), 4) for k, v in scores.items()},
        "overall_document_confidence": overall,
        "low_confidence_warning": low,
        "extractor_mode": mode,
        "warnings": warnings,
    }


def load_sample_text() -> str:
    sample_path = Path(__file__).resolve().parents[2] / "samples" / "income_certificate.txt"
    if sample_path.exists():
        return sample_path.read_text(encoding="utf-8")
    return SAMPLE_INCOME_CERTIFICATE
