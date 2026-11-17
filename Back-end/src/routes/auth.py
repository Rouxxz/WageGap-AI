# ROTAS DE AUTENTICAÇÃO (LOGIN / REGISTRO / 2FA)
import uuid

from fastapi import APIRouter, HTTPException, status

from src.config import conexao
from src.repositories import empresas, preferencias, usuarios
from src.schemas import LoginSchema, SignupSchema, Verify2FASchema
from src.security import (gerar_codigo_2fa, hash_senha, precisa_atualizar_hash,
                          validar_codigo_2fa, verificar_senha)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login")
def login(data: LoginSchema):
    with conexao() as cursor:
        user = usuarios.buscar_por_email(cursor, data.email)
        if not user or not verificar_senha(data.senha, user["senha"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos."
            )
        # conta antiga com senha em texto puro: vira hash agora
        if precisa_atualizar_hash(user["senha"]):
            usuarios.atualizar_senha(cursor, user["id"], hash_senha(data.senha))
        prefs = preferencias.buscar(cursor, user["id"])

    del user["senha"]  # o hash não vai para o navegador

    # com 2FA, o login termina em /auth/verify-2fa
    if prefs["dois_fatores"]:
        gerar_codigo_2fa(user["email"])
        return {
            "message": "Código de verificação enviado por e-mail.",
            "requires_2fa": True
        }

    return {
        "message": "Login efetuado com sucesso!",
        "user": user
    }


@router.post("/signup")
def signup(data: SignupSchema):
    with conexao() as cursor:
        if usuarios.email_existe(cursor, data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está registrado."
            )

        id_empresa = None
        if data.razao_social:
            # Gera um CNPJ fictício único com no máximo 18 caracteres se não for enviado
            cnpj = data.cnpj if data.cnpj else f"00.{uuid.uuid4().hex[:8]}-01"
            id_empresa = empresas.criar(cursor, data.razao_social, cnpj)

        usuarios.criar(cursor, id_empresa, data.nome, data.email, hash_senha(data.senha))

    return {"message": "Usuário registrado com sucesso!"}


@router.post("/verify-2fa")
def verify_2fa(data: Verify2FASchema):
    erro = validar_codigo_2fa(data.email, data.codigo)
    if erro:
        raise HTTPException(status_code=401, detail=erro)

    with conexao() as cursor:
        user = usuarios.buscar_por_email(cursor, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    del user["senha"]
    return {"message": "Login efetuado com sucesso!", "user": user}
