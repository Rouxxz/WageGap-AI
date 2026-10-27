import uuid
from fastapi import APIRouter, HTTPException, status
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

# ROTAS DE AUTENTICAÇÃO (LOGIN / REGISTRO)

@router.post("/auth/login")
def login(data: LoginSchema):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            query = "SELECT id, nome, email, id_empresa FROM usuarios WHERE email = %s AND senha = %s"
            cursor.execute(query, (data.email, data.senha))
            user = cursor.fetchone()
        conn.close()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos."
            )

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

# ROTAS DO DASHBOARD

@router.get("/kpis")
def get_kpis():
    return {
        "disparidade_media": 23.4,
        "municipios_analisados": 350,
        "clusters_identificados": 6,
        "trabalhadores_cobertos": 1200000
    }

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
    return {
        "qualificacao": 0.42,
        "genero": 0.29,
        "localizacao": 0.17,
        "raca": 0.12
    }

@router.get("/ranking")
def get_ranking():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            query = """
                SELECT m.nome AS municipio, s.nome_setor AS setor, 
                       r.total_trabalhadores, r.indice_disparidade, r.prioridade_politica
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