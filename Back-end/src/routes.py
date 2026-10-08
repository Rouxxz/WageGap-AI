from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import pymysql
from src.config import get_db_connection

router = APIRouter(prefix="/api", tags=["Dashboard & Autenticação"])

# Schemas de Validação (Pydantic)
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class SignupRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ==========================================
# ROTAS DE AUTENTICAÇÃO
# ==========================================

@router.post("/login", status_code=200)
def login(data: LoginRequest):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id_usuario, nome, email, senha_hash, perfil, status FROM usuarios WHERE email = %s", 
                (data.email,)
            )
            user = cursor.fetchone()
            
            if not user or user['senha_hash'] != data.senha:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Credenciais inválidas"
                )

            if user['status'] != 'Ativo':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Utilizador inativo ou suspenso"
                )

            return {
                "message": "Login realizado com sucesso",
                "usuario": {
                    "id": user['id_usuario'],
                    "nome": user['nome'],
                    "email": user['email'],
                    "perfil": user['perfil']
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals() and conn.open:
            conn.close()


@router.post("/signup", status_code=201)
def signup(data: SignupRequest):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s", (data.email,))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="E-mail já cadastrado"
                )

            query = "INSERT INTO usuarios (id_empresa, nome, email, senha_hash, perfil) VALUES (1, %s, %s, %s, 'Analista')"
            cursor.execute(query, (data.nome, data.email, data.senha))
            conn.commit()

            return {"message": "Conta criada com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals() and conn.open:
            conn.close()


@router.post("/forgot-password", status_code=200)
def forgot_password(data: ForgotPasswordRequest):
    return {"message": "Link de recuperação enviado caso o e-mail exista"}


# ==========================================
# ROTAS DE DADOS E DASHBOARD
# ==========================================

@router.get("/kpis")
def get_kpis():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    ROUND(AVG(indice_disparidade), 1) AS disparidade_media,
                    COUNT(DISTINCT id_municipio) AS municipios_analisados,
                    COUNT(DISTINCT id_cluster) AS clusters_identificados,
                    SUM(total_trabalhadores) AS trabalhadores_cobertos
                FROM registros_salariais;
            """
            cursor.execute(query)
            data = cursor.fetchone()
            conn.close()
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters")
def get_clusters():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM clusters")
            data = cursor.fetchall()
            conn.close()
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shap")
def get_shap():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    ROUND(AVG(impacto_qualificacao), 2) AS qualificacao,
                    ROUND(AVG(impacto_genero), 2) AS genero,
                    ROUND(AVG(impacto_localizacao), 2) AS localizacao,
                    ROUND(AVG(impacto_raca), 2) AS raca
                FROM clusters;
            """
            cursor.execute(query)
            data = cursor.fetchone()
            conn.close()
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ranking")
def get_ranking():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    m.nome AS municipio, 
                    s.nome_setor AS setor, 
                    r.total_trabalhadores, 
                    r.indice_disparidade, 
                    r.prioridade_politica
                FROM registros_salariais r
                JOIN municipios m ON r.id_municipio = m.id_municipio
                JOIN setores s ON r.id_setor = s.id_setor
                ORDER BY r.indice_disparidade DESC;
            """
            cursor.execute(query)
            data = cursor.fetchall()
            conn.close()
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))