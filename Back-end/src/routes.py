import csv
import io
import os
import secrets
import smtplib
import time
import uuid
from email.message import EmailMessage
from typing import Optional
from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel
from src.config import get_db_connection

router = APIRouter(prefix="/api", tags=["WageGap API"])

# SCHEMAS DE VALIDAÇÃO (PYDANTIC)

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
    notif_resumo: Optional[bool] = None
    dois_fatores: Optional[bool] = None

class DeleteAccountSchema(BaseModel):
    senha: str

# PREFERÊNCIAS

PREFS_PADRAO = {
    "idioma": "pt-BR",
    "tema": "light",
    "notif_dados": True,
    "notif_resumo": False,
    "dois_fatores": False,
}

def _ensure_prefs_table(cursor):
    # para bancos criados antes da tabela entrar no init.sql
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS preferencias (
            id_usuario INT PRIMARY KEY,
            idioma VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
            tema VARCHAR(10) NOT NULL DEFAULT 'light',
            notif_dados BOOLEAN NOT NULL DEFAULT TRUE,
            notif_resumo BOOLEAN NOT NULL DEFAULT FALSE,
            dois_fatores BOOLEAN NOT NULL DEFAULT FALSE,
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    """)

def _get_prefs(cursor, user_id):
    _ensure_prefs_table(cursor)
    cursor.execute(
        "SELECT idioma, tema, notif_dados, notif_resumo, dois_fatores FROM preferencias WHERE id_usuario = %s",
        (user_id,)
    )
    row = cursor.fetchone()
    if not row:
        return dict(PREFS_PADRAO)
    return {
        "idioma": row["idioma"],
        "tema": row["tema"],
        "notif_dados": bool(row["notif_dados"]),
        "notif_resumo": bool(row["notif_resumo"]),
        "dois_fatores": bool(row["dois_fatores"]),
    }

def _get_user_or_404(cursor, user_id):
    cursor.execute("SELECT id, nome, email, senha, id_empresa FROM usuarios WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user

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

# ROTAS DE AUTENTICAÇÃO (LOGIN / REGISTRO)

@router.post("/auth/login")
def login(data: LoginSchema):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            query = "SELECT id, nome, email, id_empresa FROM usuarios WHERE email = %s AND senha = %s"
            cursor.execute(query, (data.email, data.senha))
            user = cursor.fetchone()
            prefs = _get_prefs(cursor, user["id"]) if user else None
        conn.close()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos."
            )

        # com 2FA, o login termina em /auth/verify-2fa
        if prefs["dois_fatores"]:
            codigo = f"{secrets.randbelow(1000000):06d}"
            CODIGOS_2FA[user["email"]] = (codigo, time.time() + CODIGO_VALIDADE_SEG)
            _enviar_codigo_2fa(user["email"], codigo)
            return {
                "message": "Código de verificação enviado por e-mail.",
                "requires_2fa": True
            }

        return {
            "message": "Login efetuado com sucesso!",
            "user": user
        }
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/signup")
def signup(data: SignupSchema):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 1. Verifica se o e-mail já existe
            cursor.execute("SELECT id FROM usuarios WHERE email = %s", (data.email,))
            if cursor.fetchone():
                conn.close()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este e-mail já está registrado."
                )

            id_empresa = None
            # 2. Se informou a empresa, registra-a primeiro
            if data.razao_social:
                # Gera um CNPJ fictício único com no máximo 18 caracteres se não for enviado
                cnpj_final = data.cnpj if data.cnpj else f"00.{uuid.uuid4().hex[:8]}-01"
                
                cursor.execute(
                    "INSERT INTO empresas (razao_social, cnpj) VALUES (%s, %s)",
                    (data.razao_social, cnpj_final)
                )
                conn.commit()
                id_empresa = cursor.lastrowid

            # 3. Cria o novo usuário
            cursor.execute(
                "INSERT INTO usuarios (id_empresa, nome, email, senha) VALUES (%s, %s, %s, %s)",
                (id_empresa, data.nome, data.email, data.senha)
            )
            conn.commit()

        conn.close()
        return {"message": "Usuário registrado com sucesso!"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/verify-2fa")
def verify_2fa(data: Verify2FASchema):
    pendente = CODIGOS_2FA.get(data.email)
    if not pendente or time.time() > pendente[1]:
        CODIGOS_2FA.pop(data.email, None)
        raise HTTPException(status_code=401, detail="Código expirado. Faça login novamente.")
    if not secrets.compare_digest(pendente[0], data.codigo.strip()):
        raise HTTPException(status_code=401, detail="Código inválido.")

    CODIGOS_2FA.pop(data.email, None)
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, nome, email, id_empresa FROM usuarios WHERE email = %s", (data.email,))
            user = cursor.fetchone()
        conn.close()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        return {"message": "Login efetuado com sucesso!", "user": user}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ROTAS DA CONTA

@router.get("/users/{user_id}/preferences")
def get_preferences(user_id: int):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            _get_user_or_404(cursor, user_id)
            prefs = _get_prefs(cursor, user_id)
        conn.close()
        return prefs
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}/preferences")
def update_preferences(user_id: int, data: PreferencesSchema):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            _get_user_or_404(cursor, user_id)
            prefs = _get_prefs(cursor, user_id)
            prefs.update({k: v for k, v in data.dict().items() if v is not None})

            cursor.execute("""
                REPLACE INTO preferencias (id_usuario, idioma, tema, notif_dados, notif_resumo, dois_fatores)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, prefs["idioma"], prefs["tema"], prefs["notif_dados"],
                  prefs["notif_resumo"], prefs["dois_fatores"]))
        conn.commit()
        conn.close()
        return prefs
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}/password")
def change_password(user_id: int, data: PasswordChangeSchema):
    if len(data.nova_senha) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter ao menos 6 caracteres.")
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            user = _get_user_or_404(cursor, user_id)
            if user["senha"] != data.senha_atual:
                conn.close()
                raise HTTPException(status_code=401, detail="Senha atual incorreta.")

            cursor.execute("UPDATE usuarios SET senha = %s WHERE id = %s", (data.nova_senha, user_id))
        conn.commit()
        conn.close()
        return {"message": "Senha alterada com sucesso!"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/export")
def export_user_data(user_id: int):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            user = _get_user_or_404(cursor, user_id)
            prefs = _get_prefs(cursor, user_id)
            cursor.execute("""
                SELECT m.nome AS municipio, m.uf, s.nome_setor AS setor,
                       r.total_trabalhadores, r.indice_disparidade, r.prioridade_politica
                FROM registros_salariais r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                JOIN setores s ON r.id_setor = s.id_setor
                ORDER BY r.indice_disparidade DESC
            """)
            ranking = cursor.fetchall()
            cursor.execute("SELECT * FROM clusters")
            clusters = cursor.fetchall()
        conn.close()

        # ";" para abrir direto no Excel em português
        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=";")

        writer.writerow(["# Perfil"])
        writer.writerow(["nome", "email"])
        writer.writerow([user["nome"], user["email"]])
        writer.writerow([])

        writer.writerow(["# Preferências"])
        writer.writerow(list(prefs.keys()))
        writer.writerow(list(prefs.values()))
        writer.writerow([])

        writer.writerow(["# Ranking de disparidade"])
        writer.writerow(["municipio", "uf", "setor", "total_trabalhadores", "indice_disparidade", "prioridade_politica"])
        for r in ranking:
            writer.writerow([r["municipio"], r["uf"], r["setor"], r["total_trabalhadores"],
                             r["indice_disparidade"], r["prioridade_politica"]])
        writer.writerow([])

        writer.writerow(["# Clusters"])
        writer.writerow(["nome_cluster", "descricao", "media_salarial_homens", "media_salarial_mulheres", "disparidade_percentual"])
        for c in clusters:
            writer.writerow([c["nome_cluster"], c["descricao"], c["media_salarial_homens"],
                             c["media_salarial_mulheres"], c["disparidade_percentual"]])

        # BOM para o Excel ler os acentos
        conteudo = "﻿" + buffer.getvalue()
        return Response(
            content=conteudo.encode("utf-8"),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="wagegap-dados.csv"'}
        )
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
def delete_account(user_id: int, data: DeleteAccountSchema):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            user = _get_user_or_404(cursor, user_id)
            if user["senha"] != data.senha:
                conn.close()
                raise HTTPException(status_code=401, detail="Senha incorreta.")

            _ensure_prefs_table(cursor)
            cursor.execute("DELETE FROM preferencias WHERE id_usuario = %s", (user_id,))
            cursor.execute("DELETE FROM usuarios WHERE id = %s", (user_id,))
        conn.commit()
        conn.close()
        return {"message": "Conta excluída com sucesso."}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ROTAS DO DASHBOARD

# FILTROS (UF / SETOR / ANO)

def _ensure_ano_column(cursor):
    # bancos antigos ainda não têm a coluna
    cursor.execute("SHOW COLUMNS FROM registros_salariais LIKE 'ano'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE registros_salariais ADD COLUMN ano INT NOT NULL DEFAULT 2024")

def _where_recorte(uf, setor, ano):
    # valores sempre como parâmetro, nunca colados no SQL
    condicoes, params = [], []
    if uf:
        condicoes.append("m.uf = %s")
        params.append(uf)
    if setor:
        condicoes.append("r.id_setor = %s")
        params.append(setor)
    if ano:
        condicoes.append("r.ano = %s")
        params.append(ano)
    where = ("WHERE " + " AND ".join(condicoes)) if condicoes else ""
    return where, params

@router.get("/filtros")
def get_filtros():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            _ensure_ano_column(cursor)

            cursor.execute("""
                SELECT DISTINCT m.uf
                FROM registros_salariais r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                ORDER BY m.uf
            """)
            ufs = [row["uf"] for row in cursor.fetchall()]

            cursor.execute("SELECT id_setor, nome_setor FROM setores ORDER BY nome_setor")
            setores = cursor.fetchall()

            cursor.execute("SELECT DISTINCT ano FROM registros_salariais ORDER BY ano DESC")
            anos = [row["ano"] for row in cursor.fetchall()]
        conn.close()
        return {"ufs": ufs, "setores": setores, "anos": anos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/kpis")
def get_kpis(uf: Optional[str] = None, setor: Optional[int] = None, ano: Optional[int] = None):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            _ensure_ano_column(cursor)
            where, params = _where_recorte(uf, setor, ano)
            cursor.execute(f"""
                SELECT SUM(r.indice_disparidade * r.total_trabalhadores) / SUM(r.total_trabalhadores) AS disparidade_media,
                       COUNT(DISTINCT r.id_municipio) AS municipios_analisados,
                       COUNT(DISTINCT m.uf) AS total_estados,
                       SUM(r.total_trabalhadores) AS trabalhadores_cobertos
                FROM registros_salariais r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                {where}
            """, params)
            registros = cursor.fetchone()

            cursor.execute("SELECT COUNT(*) AS total FROM clusters")
            clusters = cursor.fetchone()
        conn.close()

        # média ponderada pelo nº de trabalhadores; SUM vem NULL se o recorte estiver vazio
        return {
            "disparidade_media": round(float(registros["disparidade_media"] or 0), 1),
            "municipios_analisados": registros["municipios_analisados"],
            "total_estados": registros["total_estados"],
            "clusters_identificados": clusters["total"],
            "trabalhadores_cobertos": int(registros["trabalhadores_cobertos"] or 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clusters")
def get_clusters():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'efeitos_ajustados'")
            if cursor.fetchone():
                # inclui a disparidade ajustada de cada perfil
                cursor.execute("""
                    SELECT c.*,
                           g.ajustada AS disparidade_genero_ajustada,
                           r.ajustada AS disparidade_raca_ajustada
                    FROM clusters c
                    LEFT JOIN efeitos_ajustados g
                        ON g.ano = c.ano AND g.regiao = c.regiao
                       AND g.cluster_numero = c.numero AND g.variavel = 'genero'
                    LEFT JOIN efeitos_ajustados r
                        ON r.ano = c.ano AND r.regiao = c.regiao
                       AND r.cluster_numero = c.numero AND r.variavel = 'raca'
                    ORDER BY g.ajustada DESC
                """)
            else:
                cursor.execute("SELECT * FROM clusters")
            data = cursor.fetchall()
        conn.close()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shap")
def get_shap(cluster: Optional[int] = None):
    # sem `cluster` = recorte inteiro; com `cluster` = id da tabela clusters
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'shap_pesos'")
            if not cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=404, detail="Rode o pipeline para gerar a explicabilidade.")

            if cluster is not None:
                cursor.execute("SELECT nome_cluster, numero, ano, regiao FROM clusters WHERE id = %s", (cluster,))
                perfil = cursor.fetchone()
                if not perfil:
                    conn.close()
                    raise HTTPException(status_code=404, detail="Cluster não encontrado.")
                ano, regiao, numero = perfil["ano"], perfil["regiao"], perfil["numero"]
            else:
                # pega o resultado mais recente
                cursor.execute("SELECT ano, regiao FROM shap_pesos ORDER BY ano DESC, id DESC LIMIT 1")
                ultimo = cursor.fetchone()
                if not ultimo:
                    conn.close()
                    raise HTTPException(status_code=404, detail="Rode o pipeline para gerar a explicabilidade.")
                perfil, ano, regiao, numero = None, ultimo["ano"], ultimo["regiao"], None

            def buscar(numero_cluster):
                filtro = "cluster_numero IS NULL" if numero_cluster is None else "cluster_numero = %s"
                params = (ano, regiao) if numero_cluster is None else (ano, regiao, numero_cluster)
                cursor.execute(
                    f"SELECT grupo, peso_percentual FROM shap_pesos WHERE ano = %s AND regiao = %s AND {filtro} "
                    "ORDER BY id", params)
                pesos = [{"grupo": r["grupo"], "peso": float(r["peso_percentual"])} for r in cursor.fetchall()]
                cursor.execute(
                    f"SELECT variavel, bruta, ajustada, ic95_min, ic95_max, efeito_shap FROM efeitos_ajustados "
                    f"WHERE ano = %s AND regiao = %s AND {filtro}", params)
                efeitos = {
                    r["variavel"]: {k: (float(v) if v is not None else None) for k, v in r.items() if k != "variavel"}
                    for r in cursor.fetchall()
                }
                return pesos, efeitos

            pesos, efeitos = buscar(numero)
            pesos_recorte, efeitos_recorte = buscar(None)
        conn.close()

        return {
            "ano": ano,
            "regiao": regiao,
            "cluster": {"id": cluster, "nome": perfil["nome_cluster"]} if perfil else None,
            "pesos": pesos,
            "efeitos": efeitos,
            "recorte": {"pesos": pesos_recorte, "efeitos": efeitos_recorte},
        }
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ranking")
def get_ranking(uf: Optional[str] = None, setor: Optional[int] = None, ano: Optional[int] = None):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            _ensure_ano_column(cursor)
            where, params = _where_recorte(uf, setor, ano)
            query = f"""
                SELECT m.nome AS municipio, m.uf, s.nome_setor AS setor,
                       r.total_trabalhadores, r.indice_disparidade, r.prioridade_politica,
                       r.indice_prioridade, r.disparidade_genero_ajustada, r.disparidade_raca_ajustada,
                       r.perc_baixa_qualificacao, r.publico_alvo
                FROM registros_salariais r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                JOIN setores s ON r.id_setor = s.id_setor
                {where}
                ORDER BY r.indice_prioridade IS NULL, r.indice_prioridade DESC, r.indice_disparidade DESC;
            """
            cursor.execute(query, params)
            data = cursor.fetchall()
        conn.close()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))