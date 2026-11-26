# Formato dos dados que chegam nas rotas (validados pelo Pydantic)
from typing import Optional

from pydantic import BaseModel

class LoginSchema(BaseModel):
    email: str
    senha: str

class SignupSchema(BaseModel):
    nome: str
    email: str
    senha: str
    razao_social: str = None  # Opcional
    cnpj: str = None          # Opcional: aceita CNPJ do front ou gera automático

class Verify2FASchema(BaseModel):
    email: str
    codigo: str

class PasswordChangeSchema(BaseModel):
    senha_atual: str
    nova_senha: str

class PreferencesSchema(BaseModel):
    # tudo opcional: o front manda só o que mudou
    idioma: Optional[str] = None
    tema: Optional[str] = None
    notif_dados: Optional[bool] = None
    dois_fatores: Optional[bool] = None

class DeleteAccountSchema(BaseModel):
    senha: str

class ForgotPasswordSchema(BaseModel):
    email: str

class ResetPasswordSchema(BaseModel):
    token: str
    nova_senha: str
