from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_docs_root, is_docs_root_valid
from routers import projects, documents, presets
from routers import config as config_router

app = FastAPI(title="AgentLoop", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(config_router.router)
app.include_router(presets.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/config")
def get_config():
    return {"docs_root": str(get_docs_root()), "is_valid": is_docs_root_valid()}
