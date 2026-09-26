from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.documents import router as documents_router
from app.routers.eligibility import router as eligibility_router

app = FastAPI(
    title="SchemeSetu FIN-03 API",
    description="IDP extraction and hybrid JsonLogic eligibility engine.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(eligibility_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "schemesetu-fin-03"}
