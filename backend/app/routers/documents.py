from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from ..idp.extractor import SAMPLE_INCOME_CERTIFICATE, extract_document_bytes
from ..schemas import DocumentExtractResponse

router = APIRouter(prefix="/api/v1", tags=["idp"])

ALLOWED_SUFFIXES = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt"}
MAX_BYTES = 20 * 1024 * 1024


@router.post("/extract-document", response_model=DocumentExtractResponse)
async def extract_document(
    file: UploadFile | None = File(default=None),
    use_sample: bool = Query(default=False, description="Parse the bundled Indian Income Certificate sample"),
) -> DocumentExtractResponse:
    if file is None and not use_sample:
        raise HTTPException(status_code=400, detail="Upload a PDF or image, or set use_sample=true.")

    content = b""
    filename = "sample-income-certificate.txt"
    content_type = "text/plain"
    if file is not None:
        filename = file.filename or "upload.bin"
        suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if suffix not in ALLOWED_SUFFIXES:
            raise HTTPException(status_code=415, detail="Only PDF, PNG, JPG or TXT uploads are supported.")
        content = await file.read()
        if len(content) > MAX_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds the 20 MB limit.")
        content_type = file.content_type

    try:
        payload = extract_document_bytes(
            content=content if not use_sample else SAMPLE_INCOME_CERTIFICATE.encode("utf-8"),
            filename=filename if not use_sample else "income_certificate.txt",
            content_type=content_type,
            use_sample=use_sample,
        )
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=422, detail=f"Document could not be processed: {exc}") from exc

    return DocumentExtractResponse(**payload)
