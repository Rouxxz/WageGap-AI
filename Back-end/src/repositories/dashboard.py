# Consultas do dashboard: filtros, KPIs, clusters, explicabilidade (SHAP) e ranking

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

def tabela_existe(cursor, nome):
    cursor.execute("SHOW TABLES LIKE %s", (nome,))
    return cursor.fetchone() is not None

# FILTROS

def listar_ufs(cursor):
    cursor.execute("""
        SELECT DISTINCT m.uf
        FROM registros_salariais r
        JOIN municipios m ON r.id_municipio = m.id_municipio
        ORDER BY m.uf
    """)
    return [row["uf"] for row in cursor.fetchall()]

def listar_setores(cursor):
    cursor.execute("SELECT id_setor, nome_setor FROM setores ORDER BY nome_setor")
    return cursor.fetchall()

def listar_anos(cursor):
    cursor.execute("SELECT DISTINCT ano FROM registros_salariais ORDER BY ano DESC")
    return [row["ano"] for row in cursor.fetchall()]

# KPIs

def resumo_registros(cursor, uf=None, setor=None, ano=None):
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
    return cursor.fetchone()

def contar_clusters(cursor):
    cursor.execute("SELECT COUNT(*) AS total FROM clusters")
    return cursor.fetchone()["total"]

# CLUSTERS

def listar_clusters(cursor):
    cursor.execute("SELECT * FROM clusters")
    return cursor.fetchall()

def listar_clusters_com_ajuste(cursor):
    # inclui a disparidade ajustada de cada perfil (vem da tabela efeitos_ajustados)
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
    return cursor.fetchall()

def buscar_cluster(cursor, cluster_id):
    cursor.execute("SELECT nome_cluster, numero, ano, regiao FROM clusters WHERE id = %s", (cluster_id,))
    return cursor.fetchone()

# EXPLICABILIDADE (SHAP)

def ultimo_recorte_shap(cursor):
    # ano/região do resultado mais recente do pipeline
    cursor.execute("SELECT ano, regiao FROM shap_pesos ORDER BY ano DESC, id DESC LIMIT 1")
    return cursor.fetchone()

def buscar_explicabilidade(cursor, ano, regiao, numero_cluster=None):
    # numero_cluster None = recorte inteiro
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

# RANKING

def listar_ranking(cursor, uf=None, setor=None, ano=None):
    where, params = _where_recorte(uf, setor, ano)
    cursor.execute(f"""
        SELECT m.nome AS municipio, m.uf, s.nome_setor AS setor,
               r.total_trabalhadores, r.indice_disparidade, r.prioridade_politica,
               r.indice_prioridade, r.disparidade_genero_ajustada, r.disparidade_raca_ajustada,
               r.perc_baixa_qualificacao, r.publico_alvo
        FROM registros_salariais r
        JOIN municipios m ON r.id_municipio = m.id_municipio
        JOIN setores s ON r.id_setor = s.id_setor
        {where}
        ORDER BY r.indice_prioridade IS NULL, r.indice_prioridade DESC, r.indice_disparidade DESC
    """, params)
    return cursor.fetchall()

def listar_ranking_export(cursor):
    # versão resumida usada no CSV de exportação
    cursor.execute("""
        SELECT m.nome AS municipio, m.uf, s.nome_setor AS setor,
               r.total_trabalhadores, r.indice_disparidade, r.prioridade_politica
        FROM registros_salariais r
        JOIN municipios m ON r.id_municipio = m.id_municipio
        JOIN setores s ON r.id_setor = s.id_setor
        ORDER BY r.indice_disparidade DESC
    """)
    return cursor.fetchall()
