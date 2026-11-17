# Junta as rotas de cada assunto sob o prefixo /api.
# As rotas só recebem a requisição, chamam security/repositories e devolvem a resposta.
from fastapi import APIRouter

from src.routes import auth, conta, dashboard

router = APIRouter(prefix="/api")
router.include_router(auth.router)
router.include_router(conta.router)
router.include_router(dashboard.router)
