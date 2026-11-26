# ROTAS DE AUTENTICAÇÃO (LOGIN / REGISTRO / 2FA / RECUPERAÇÃO DE SENHA)
import traceback

from fastapi import APIRouter, HTTPException, status

from src import cnpj
from src.config import conexao
from src.repositories import empresas, preferencias, recuperacao, usuarios
from src.schemas import (ForgotPasswordSchema, LoginSchema, ResetPasswordSchema, SignupSchema,
                         Verify2FASchema)
from src.security import (RECUPERACAO_VALIDADE_MIN, SENHA_MINIMA, enviar_link_recuperacao,
                          gerar_codigo_2fa, gerar_token_recuperacao, hash_senha, hash_token,
                          precisa_atualizar_hash, validar_codigo_2fa, verificar_senha)

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
    razao_social = data.razao_social.strip()
    if not razao_social:
        raise HTTPException(status_code=400, detail="Informe a razão social da empresa.")
    if len(razao_social) > 150:
        raise HTTPException(status_code=400, detail="A razão social deve ter no máximo 150 caracteres.")
    if not cnpj.valido(data.cnpj):
        raise HTTPException(status_code=400, detail="CNPJ inválido.")

    with conexao() as cursor:
        if usuarios.email_existe(cursor, data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está registrado."
            )

        # cada empresa tem uma conta só. Não vinculamos automaticamente a uma
        # empresa existente: o CNPJ é público e não prova vínculo com ela.
        cnpj_formatado = cnpj.formatar(data.cnpj)
        if empresas.cnpj_existe(cursor, cnpj_formatado):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esta empresa já está cadastrada. Fale com o responsável pela conta."
            )

        id_empresa = empresas.criar(cursor, razao_social, cnpj_formatado)
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


# RECUPERAÇÃO DE SENHA
# A resposta é sempre a mesma, exista o e-mail ou não. Assim ninguém usa esta
# rota para descobrir quais e-mails estão cadastrados (enumeração de usuários).

MSG_LINK_ENVIADO = "Se o e-mail estiver cadastrado, enviaremos um link para criar uma nova senha."


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordSchema):
    token = None
    with conexao() as cursor:
        user = usuarios.buscar_por_email(cursor, data.email.strip())
        if user:
            token, token_hash = gerar_token_recuperacao()
            recuperacao.criar(cursor, user["id"], token_hash, RECUPERACAO_VALIDADE_MIN)

    if token:
        try:
            enviar_link_recuperacao(user["email"], token)
        except Exception:
            # um erro aqui revelaria que o e-mail existe: registra no log e responde igual
            traceback.print_exc()

    return {"message": MSG_LINK_ENVIADO}


@router.post("/reset-password")
def reset_password(data: ResetPasswordSchema):
    if len(data.nova_senha) < SENHA_MINIMA:
        raise HTTPException(status_code=400, detail=f"A nova senha deve ter ao menos {SENHA_MINIMA} caracteres.")

    with conexao() as cursor:
        registro = recuperacao.buscar_valido(cursor, hash_token(data.token.strip()))
        if not registro:
            raise HTTPException(status_code=400, detail="Link inválido ou expirado. Peça um novo.")
        usuarios.atualizar_senha(cursor, registro["id_usuario"], hash_senha(data.nova_senha))
        # o link só vale uma vez
        recuperacao.excluir_do_usuario(cursor, registro["id_usuario"])

    return {"message": "Senha alterada com sucesso! Você já pode entrar."}
