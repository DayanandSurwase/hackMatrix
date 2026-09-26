from __future__ import annotations

import re
from typing import Any


INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
]

CATEGORY_MAP = {
    "general": "General",
    "gen": "General",
    "obc": "OBC",
    "other backward": "OBC",
    "sc": "SC",
    "scheduled caste": "SC",
    "st": "ST",
    "scheduled tribe": "ST",
}

EMPLOYMENT_MAP = {
    "farmer": "Farmer",
    "agricultur": "Farmer",
    "cultivat": "Farmer",
    "salaried": "Salaried",
    "government servant": "Salaried",
    "self-employed": "Self-Employed",
    "self employed": "Self-Employed",
    "business": "Self-Employed",
    "unemployed": "Unemployed",
}


def _clean(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text.replace("\u00a0", " "))


def _parse_amount(raw: str) -> float | None:
    cleaned = raw.upper().replace(",", "").replace("RS.", "").replace("INR", "").replace("₹", "")
    cleaned = cleaned.replace("/-", "").strip()
    lakh = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*LAKH", cleaned)
    if lakh:
        return float(lakh.group(1)) * 100_000
    crore = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*CRORE", cleaned)
    if crore:
        return float(crore.group(1)) * 10_000_000
    number = re.search(r"([0-9]+(?:\.[0-9]+)?)", cleaned)
    if not number:
        return None
    return float(number.group(1))


def parse_applicant_fields(text: str) -> tuple[dict[str, Any], dict[str, float], list[str]]:
    """Regex-extract IDP fields from Indian income / identity / ITR text."""
    blob = _clean(text)
    upper = blob.upper()
    data: dict[str, Any] = {}
    scores: dict[str, float] = {}
    warnings: list[str] = []

    name_match = re.search(
        r"(?:SHRI|SMT\.?|KUMARI|NAME\s*[:\-]|THIS IS TO CERTIFY THAT)\s*[:\-]?\s*([A-Z][A-Z .]{2,40})",
        blob,
        re.IGNORECASE,
    )
    if name_match:
        name = re.sub(r"\s+", " ", name_match.group(1)).strip(" .")
        name = re.sub(r"\b(S/O|D/O|W/O|SON|DAUGHTER|RESIDENT).*$", "", name, flags=re.I).strip()
        if name:
            data["full_name"] = name.title()
            scores["full_name"] = 0.92

    income_match = re.search(
        r"(?:ANNUAL(?: FAMILY)? INCOME|GROSS(?: TOTAL)? INCOME|TOTAL INCOME)[^\d₹]{0,40}(?:RS\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?(?:\s*LAKH)?)",
        blob,
        re.IGNORECASE,
    )
    if not income_match:
        income_match = re.search(r"(?:RS\.?|INR|₹)\s*([0-9,]{4,}(?:\.[0-9]+)?)", blob, re.IGNORECASE)
    if income_match:
        amount = _parse_amount(income_match.group(1))
        if amount is not None:
            data["gross_annual_income"] = amount
            scores["gross_annual_income"] = 0.9

    age_match = re.search(r"\bAGE\s*[:\-]?\s*(\d{1,3})\b", blob, re.IGNORECASE)
    dob = re.search(r"\b(?:DOB|DATE OF BIRTH)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})", blob, re.IGNORECASE)
    if age_match:
        data["age"] = int(age_match.group(1))
        scores["age"] = 0.93
    elif dob:
        data["age"] = None
        warnings.append("Date of birth found but age was not computed.")
        scores["age"] = 0.45

    for state in sorted(INDIAN_STATES, key=len, reverse=True):
        if state.upper() in upper:
            data["state_of_residence"] = state
            scores["state_of_residence"] = 0.88
            break

    for key, label in CATEGORY_MAP.items():
        if re.search(rf"\b{re.escape(key)}\b", blob, re.IGNORECASE):
            data["category"] = label
            scores["category"] = 0.86
            break

    for key, label in EMPLOYMENT_MAP.items():
        if key.upper() in upper:
            data["employment_status"] = label
            scores["employment_status"] = 0.84
            break

    hh = re.search(r"(?:HOUSEHOLD SIZE|FAMILY MEMBERS|FAMILY SIZE|NO\.? OF MEMBERS)\s*[:\-]?\s*(\d{1,2})", blob, re.IGNORECASE)
    if hh:
        data["household_size"] = int(hh.group(1))
        scores["household_size"] = 0.87

    land = re.search(r"(?:LAND HOLDING|CULTIVABLE LAND|LAND)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:HA|HECTARE)", blob, re.IGNORECASE)
    if land:
        data["land_holding"] = float(land.group(1))
        scores["land_holding"] = 0.85

    if re.search(r"INSTITUTIONAL LAND|COMPANY|TRUST|SOCIETY OWNED", blob, re.IGNORECASE):
        data["is_institutional_landholder"] = True
        scores["is_institutional_landholder"] = 0.8
    else:
        data["is_institutional_landholder"] = False
        scores["is_institutional_landholder"] = 0.7

    if re.search(r"GRADUATE|B\.?TECH|B\.?A\.|B\.?SC|B\.?COM", blob, re.IGNORECASE):
        data["education_level"] = "graduate"
        scores["education_level"] = 0.82
    elif re.search(r"(12TH|CLASS XII|HIGHER SECONDARY|HSC)", blob, re.IGNORECASE):
        data["education_level"] = "12th_pass"
        scores["education_level"] = 0.82
    elif re.search(r"(10TH|CLASS X|MATRIC|SSC)", blob, re.IGNORECASE):
        data["education_level"] = "10th_pass"
        scores["education_level"] = 0.82
    elif re.search(r"(8TH|VIII|CLASS 8)", blob, re.IGNORECASE):
        data["education_level"] = "8th_pass"
        scores["education_level"] = 0.8

    project = re.search(r"(?:PROJECT COST|PROJECT OUTLAY)\s*[:\-]?\s*(?:RS\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?(?:\s*LAKH)?)", blob, re.IGNORECASE)
    if project:
        amount = _parse_amount(project.group(1))
        if amount is not None:
            data["project_cost"] = amount
            scores["project_cost"] = 0.8

    return data, scores, warnings
