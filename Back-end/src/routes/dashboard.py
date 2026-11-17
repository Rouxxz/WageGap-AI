# ROTAS DO DASHBOARD
from typing import Optional

from fastapi import APIRouter, HTTPException

from src.config import conexao
from src.repositories import dashboard

router = APIRouter(tags=["Dashboard"])

MSG_SEM_PIPELINE = "Rode o pipeline para gerar a explicabilidade."


@router.get("/filtros")
def get_filtros():
    with conexao() as cursor:
        return {
            "ufs": dashboard.listar_ufs(cursor),
            "setores": dashboard.listar_setores(cursor),
            "anos": dashboard.listar_anos(cursor),
        }


@router.get("/kpis")
def get_kpis(uf: Optional[str] = None, setor: Optional[int] = None, ano: Optional[int] = None):
    with conexao() as cursor:
        registros = dashboard.resumo_registros(cursor, uf, setor, ano)
        total_clusters = dashboard.contar_clusters(cursor)

    # média ponderada pelo nº de trabalhadores; SUM vem NULL se o recorte estiver vazio
    return {
        "disparidade_media": round(float(registros["disparidade_media"] or 0), 1),
        "municipios_analisados": registros["municipios_analisados"],
        "total_estados": registros["total_estados"],
        "clusters_identificados": total_clusters,
        "trabalhadores_cobertos": int(registros["trabalhadores_cobertos"] or 0)
    }


@router.get("/clusters")
def get_clusters():
    with conexao() as cursor:
        if dashboard.tabela_existe(cursor, "efeitos_ajustados"):
            return dashboard.listar_clusters_com_ajuste(cursor)
        return dashboard.listar_clusters(cursor)


@router.get("/shap")
def get_shap(cluster: Optional[int] = None):
    # sem `cluster` = recorte inteiro; com `cluster` = id da tabela clusters
    with conexao() as cursor:
        if not dashboard.tabela_existe(cursor, "shap_pesos"):
            raise HTTPException(status_code=404, detail=MSG_SEM_PIPELINE)

        if cluster is not None:
            perfil = dashboard.buscar_cluster(cursor, cluster)
            if not perfil:
                raise HTTPException(status_code=404, detail="Cluster não encontrado.")
            ano, regiao, numero = perfil["ano"], perfil["regiao"], perfil["numero"]
        else:
            ultimo = dashboard.ultimo_recorte_shap(cursor)
            if not ultimo:
                raise HTTPException(status_code=404, detail=MSG_SEM_PIPELINE)
            perfil, ano, regiao, numero = None, ultimo["ano"], ultimo["regiao"], None

        pesos, efeitos = dashboard.buscar_explicabilidade(cursor, ano, regiao, numero)
        pesos_recorte, efeitos_recorte = dashboard.buscar_explicabilidade(cursor, ano, regiao, None)

    return {
        "ano": ano,
        "regiao": regiao,
        "cluster": {"id": cluster, "nome": perfil["nome_cluster"]} if perfil else None,
        "pesos": pesos,
        "efeitos": efeitos,
        "recorte": {"pesos": pesos_recorte, "efeitos": efeitos_recorte},
    }


@router.get("/ranking")
def get_ranking(uf: Optional[str] = None, setor: Optional[int] = None, ano: Optional[int] = None):
    with conexao() as cursor:
        return dashboard.listar_ranking(cursor, uf, setor, ano)
