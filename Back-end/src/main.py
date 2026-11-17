import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from src.routes import router as api_router

app = FastAPI(
    title="API Wage Gap",
    description="API para análise de disparidade salarial e indicadores",
    version="1.0.0"
)

# Erro inesperado em qualquer rota vira 500 com a mensagem em "detail"
# (antes cada rota repetia esse try/except). Fica registrado ANTES do CORS
# para a resposta de erro também receber os cabeçalhos de CORS.
@app.middleware("http")
async def erro_interno(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})

# Configuração do CORS para permitir chamadas do Front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão dos roteadores da aplicação
app.include_router(api_router)
