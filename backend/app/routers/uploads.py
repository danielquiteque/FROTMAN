import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

EXTENSOES_PERMITIDAS = {".png", ".jpg", ".jpeg", ".webp", ".mp3", ".wav", ".m4a"}
TAMANHO_MAXIMO_MB = 10


@router.post("")
async def enviar_arquivo(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise HTTPException(status_code=400, detail=f"Extensão não permitida: {ext}")

    conteudo = await file.read()
    if len(conteudo) > TAMANHO_MAXIMO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Arquivo maior que {TAMANHO_MAXIMO_MB}MB")

    nome_unico = f"{uuid.uuid4().hex}{ext}"
    caminho = os.path.join(UPLOAD_DIR, nome_unico)
    with open(caminho, "wb") as f:
        f.write(conteudo)

    return {"url": f"/uploads/{nome_unico}", "nome_original": file.filename}
