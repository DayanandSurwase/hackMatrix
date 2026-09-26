from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_extract_sample_income_certificate():
    response = client.post("/api/v1/extract-document?use_sample=true")
    assert response.status_code == 200
    body = response.json()
    data = body["extracted_data"]
    assert data["full_name"].lower().startswith("ramesh")
    assert data["gross_annual_income"] == 240000.0
    assert data["age"] == 34
    assert data["state_of_residence"] == "Uttar Pradesh"
    assert data["category"] == "OBC"
    assert data["employment_status"] == "Farmer"
    assert data["household_size"] == 5
    assert "gross_annual_income" in body["field_confidence_scores"]
    assert 0.0 <= body["overall_document_confidence"] <= 1.0
    assert body["low_confidence_warning"] == any(v < 0.80 for v in body["field_confidence_scores"].values())


def test_extract_unreadable_uses_mock_fallback():
    files = {"file": ("blank.pdf", b"%PDF-1.1 empty", "application/pdf")}
    response = client.post("/api/v1/extract-document", files=files)
    assert response.status_code == 200
    body = response.json()
    assert body["extractor_mode"] == "mock_fallback"
    assert body["extracted_data"]["full_name"]
    assert body["low_confidence_warning"] is True


def test_evaluate_clearly_eligible_pm_kisan():
    payload = {
        "full_name": "Ramesh Kumar",
        "gross_annual_income": 240000,
        "age": 34,
        "state_of_residence": "Uttar Pradesh",
        "category": "OBC",
        "employment_status": "Farmer",
        "household_size": 5,
        "land_holding": 1.2,
        "document_confidence": 0.91,
        "education_level": "10th_pass",
        "project_cost": 800000,
        "is_institutional_landholder": False,
        "uploaded_documents": ["aadhaar_front.pdf", "income_certificate.pdf", "land_records.pdf"],
    }
    response = client.post("/api/v1/evaluate-eligibility", json=payload)
    assert response.status_code == 200
    body = response.json()
    by_id = {row["scheme_id"]: row for row in body["results"]}
    assert by_id["PM_KISAN"]["status"] == "ELIGIBLE"
    assert by_id["RENT_SUBSIDY"]["status"] == "ELIGIBLE"
    assert by_id["PMEGP"]["status"] in {"ELIGIBLE", "BORDERLINE_REVIEW"}
    assert by_id["PM_KISAN"]["source_citation"]["clause_number"]
    assert "scheme_id" in by_id["PM_KISAN"]


def test_evaluate_ineligible_income_cap():
    payload = {
        "gross_annual_income": 900000,
        "age": 40,
        "state_of_residence": "Maharashtra",
        "category": "General",
        "employment_status": "Salaried",
        "household_size": 3,
        "land_holding": 0,
        "document_confidence": 0.95,
    }
    response = client.post("/api/v1/evaluate-eligibility", json=payload)
    body = response.json()
    rent = next(r for r in body["results"] if r["scheme_id"] == "RENT_SUBSIDY")
    assert rent["status"] == "INELIGIBLE"
    assert rent["failed_rule_id"] == "RENT-R1"
    assert "₹3,00,000" in rent["failed_clause_text"]


def test_evaluate_borderline_income_and_low_confidence():
    payload = {
        "gross_annual_income": 295000,
        "age": 29,
        "state_of_residence": "Bihar",
        "category": "SC",
        "employment_status": "Salaried",
        "household_size": 4,
        "document_confidence": 0.72,
        "education_level": "graduate",
        "project_cost": 400000,
    }
    response = client.post("/api/v1/evaluate-eligibility", json=payload)
    rent = next(r for r in response.json()["results"] if r["scheme_id"] == "RENT_SUBSIDY")
    assert rent["status"] == "BORDERLINE_REVIEW"
    assert rent["manual_review_required"] is True
