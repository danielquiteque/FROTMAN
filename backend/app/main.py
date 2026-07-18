import os

from dotenv import load_dotenv

load_dotenv()  # carrega backend/.env em desenvolvimento local; em produção (Render), a variável já vem do ambiente

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from . import models
from .database import engine
from .routers import equipamentos, ocorrencias, ordens_servico, uploads, dashboard

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FROTMAN API",
    description=(
        "API de triagem de manutenção de equipamentos e frotas. "
        "Análise de ocorrências via LLM real (Claude/Anthropic), com fallback "
        "transparente por regras caso a IA não esteja configurada ou disponível."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # simplificado para o protótipo acadêmico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(equipamentos.router)
app.include_router(ocorrencias.router)
app.include_router(ordens_servico.router)
app.include_router(uploads.router)
app.include_router(dashboard.router)


@app.get("/api")
def raiz_api():
    return {
        "app": "FROTMAN API",
        "aviso": "Análise via LLM real (Claude), com fallback transparente por regras se a IA não estiver disponível.",
        "docs": "/docs",
    }


# ---------------------------------------------------------------------------
# Serve o build de produção do frontend (frontend/dist) quando presente.
# Usado no deploy em container único (Hugging Face Spaces / Docker).
# Em desenvolvimento local (npm run dev), essa pasta não existe e este bloco
# é simplesmente ignorado — o frontend roda separado na porta do Vite.
# ---------------------------------------------------------------------------
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="frontend-assets")

    @app.get("/{caminho_completo:path}")
    async def servir_frontend(caminho_completo: str):
        """Fallback de SPA: qualquer rota que não seja /api, /docs ou /uploads devolve o index.html
        do React, para o React Router assumir o roteamento no navegador."""
        arquivo_estatico = os.path.join(FRONTEND_DIST, caminho_completo)
        if caminho_completo and os.path.isfile(arquivo_estatico):
            return FileResponse(arquivo_estatico)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:

    @app.get("/")
    def raiz():
        return {
            "app": "FROTMAN API",
            "aviso": "Análise via LLM real (Claude), com fallback transparente por regras se a IA não estiver disponível.",
            "info": "frontend/dist não encontrado — rodando apenas a API (modo desenvolvimento).",
            "docs": "/docs",
        }
