from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import router as api_router

app = FastAPI(
    title="API Wage Gap",
    description="API para análise de disparidade salarial e indicadores",
    version="1.0.0"
)

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