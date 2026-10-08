from fastapi import APIRouter, HTTPException
from src.config import get_db_connection

router = APIRouter(prefix="/api", tags=["Dashboard"])

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