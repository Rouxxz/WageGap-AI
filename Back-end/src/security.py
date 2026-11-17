# Senhas e autenticação em duas etapas. Nada aqui acessa o banco.
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

# AUTENTICAÇÃO EM DUAS ETAPAS

# {email: (codigo, expira_em)}, só em memória
CODIGOS_2FA = {}
CODIGO_VALIDADE_SEG = 300

def _enviar_codigo_2fa(email, codigo):
    # sem SMTP (dev), o código só aparece no log
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        print(f"[2FA] Código de acesso para {email}: {codigo}", flush=True)
        return

    msg = EmailMessage()
    msg["Subject"] = "WageGap AI - Código de acesso"
    msg["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@wagegap.ai"))
    msg["To"] = email
    msg.set_content(f"Seu código de acesso é {codigo}. Ele expira em 5 minutos.")

    with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", 587))) as smtp:
        smtp.starttls()
        if os.getenv("SMTP_USER"):
            smtp.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD", ""))
        smtp.send_message(msg)

def gerar_codigo_2fa(email):
    codigo = f"{secrets.randbelow(1000000):06d}"
    CODIGOS_2FA[email] = (codigo, time.time() + CODIGO_VALIDADE_SEG)
    _enviar_codigo_2fa(email, codigo)

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
