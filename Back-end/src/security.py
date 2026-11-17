# Senhas, autenticação em duas etapas e recuperação de senha. Nada aqui acessa o banco.
import hashlib
import os
import secrets
import smtplib
import time
from email.message import EmailMessage

import bcrypt

# SENHAS
# O banco guarda só o hash bcrypt (ex: "$2b$12$..."), nunca a senha digitada.
# Contas criadas antes do hash ainda têm a senha em texto puro: elas continuam
# entrando normalmente e a senha vira hash no primeiro login (precisa_atualizar_hash).

SENHA_MINIMA = 6

def hash_senha(senha):
    # bcrypt só considera os primeiros 72 bytes da senha
    return bcrypt.hashpw(senha.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

def e_hash(armazenada):
    return armazenada.startswith(("$2a$", "$2b$", "$2y$"))

def precisa_atualizar_hash(armazenada):
    return not e_hash(armazenada)

def verificar_senha(senha, armazenada):
    if not armazenada:
        return False
    if e_hash(armazenada):
        return bcrypt.checkpw(senha.encode("utf-8")[:72], armazenada.encode("utf-8"))
    # conta antiga, senha ainda em texto puro
    return secrets.compare_digest(senha.encode("utf-8"), armazenada.encode("utf-8"))

# E-MAIL

def _enviar_email(destino, assunto, texto, aviso_log):
    # sem SMTP (dev), só aparece no log da API
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        print(aviso_log, flush=True)
        return

    msg = EmailMessage()
    msg["Subject"] = assunto
    msg["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@wagegap.ai"))
    msg["To"] = destino
    msg.set_content(texto)

    with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", 587))) as smtp:
        smtp.starttls()
        if os.getenv("SMTP_USER"):
            smtp.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD", ""))
        smtp.send_message(msg)

# AUTENTICAÇÃO EM DUAS ETAPAS

# {email: (codigo, expira_em)}, só em memória
CODIGOS_2FA = {}
CODIGO_VALIDADE_SEG = 300

def gerar_codigo_2fa(email):
    codigo = f"{secrets.randbelow(1000000):06d}"
    CODIGOS_2FA[email] = (codigo, time.time() + CODIGO_VALIDADE_SEG)
    _enviar_email(
        email,
        "WageGap AI - Código de acesso",
        f"Seu código de acesso é {codigo}. Ele expira em 5 minutos.",
        f"[2FA] Código de acesso para {email}: {codigo}",
    )

def validar_codigo_2fa(email, codigo):
    # Retorna None se o código estiver certo, ou a mensagem de erro.
    pendente = CODIGOS_2FA.get(email)
    if not pendente or time.time() > pendente[1]:
        CODIGOS_2FA.pop(email, None)
        return "Código expirado. Faça login novamente."
    if not secrets.compare_digest(pendente[0], codigo.strip()):
        return "Código inválido."
    CODIGOS_2FA.pop(email, None)
    return None

# RECUPERAÇÃO DE SENHA
# O link leva um token aleatório. O banco guarda só o SHA-256 dele: quem ler o
# banco não consegue montar um link válido. SHA-256 basta aqui (e não bcrypt)
# porque o token é aleatório e longo, impossível de adivinhar por tentativa.

RECUPERACAO_VALIDADE_MIN = 30

def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def gerar_token_recuperacao():
    # devolve (token que vai no link, hash que vai para o banco)
    token = secrets.token_urlsafe(32)
    return token, hash_token(token)

def enviar_link_recuperacao(email, token):
    frontend = os.getenv("FRONTEND_URL", "http://localhost:8080").rstrip("/")
    link = f"{frontend}/pages/reset-password.html?token={token}"
    _enviar_email(
        email,
        "WageGap AI - Criar nova senha",
        f"Recebemos um pedido para trocar a sua senha. Use o link abaixo em até "
        f"{RECUPERACAO_VALIDADE_MIN} minutos:\n\n{link}\n\n"
        f"Se não foi você, ignore este e-mail: a senha atual continua valendo.",
        f"[Recuperação] Link para {email}: {link}",
    )
