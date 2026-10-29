"""Grava os resultados do pipeline no MySQL do dashboard."""
import pandas as pd

from src.config import get_db_connection
from src.referencias import SECOES_CNAE

# ids abaixo disso são os dados de exemplo do init.sql
ID_MINIMO_MUNICIPIO_REAL = 100000


def _garantir_colunas(cursor, tabela, colunas):
    for nome, tipo in colunas.items():
        cursor.execute(f"SHOW COLUMNS FROM {tabela} LIKE %s", (nome,))
        if not cursor.fetchone():
            cursor.execute(f"ALTER TABLE {tabela} ADD COLUMN {nome} {tipo}")


def _garantir_esquema(cursor):
    _garantir_colunas(cursor, "registros_salariais", {
        "ano": "INT NOT NULL DEFAULT 2024",
        "salario_medio_homens": "DECIMAL(10,2) NULL",
        "salario_medio_mulheres": "DECIMAL(10,2) NULL",
        "disparidade_raca": "DECIMAL(6,2) NULL",
        "indice_prioridade": "DECIMAL(5,1) NULL",
        "disparidade_genero_ajustada": "DECIMAL(6,2) NULL",
        "disparidade_raca_ajustada": "DECIMAL(6,2) NULL",
        "perc_baixa_qualificacao": "DECIMAL(5,2) NULL",
        "ganho_qualificacao": "DECIMAL(6,2) NULL",
        "publico_alvo": "VARCHAR(80) NULL",
        "perda_mensal_genero": "DECIMAL(14,2) NULL",
        "ganho_mensal_qualificacao": "DECIMAL(14,2) NULL",
    })
    _garantir_colunas(cursor, "clusters", {
        "total_trabalhadores": "INT NULL",
        "perc_mulheres": "DECIMAL(5,2) NULL",
        "perc_negros": "DECIMAL(5,2) NULL",
        "idade_media": "DECIMAL(5,1) NULL",
        "escolaridade_predominante": "VARCHAR(60) NULL",
        "ocupacao_predominante": "VARCHAR(80) NULL",
        "setor_predominante": "VARCHAR(80) NULL",
        "disparidade_raca": "DECIMAL(6,2) NULL",
        "ano": "INT NULL",
        "regiao": "VARCHAR(20) NULL",
        "numero": "INT NULL",
    })
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shap_pesos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ano INT NOT NULL,
            regiao VARCHAR(20) NOT NULL,
            cluster_numero INT NULL,
            grupo VARCHAR(40) NOT NULL,
            peso_percentual DECIMAL(5,2) NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS efeitos_ajustados (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ano INT NOT NULL,
            regiao VARCHAR(20) NOT NULL,
            cluster_numero INT NULL,
            variavel VARCHAR(20) NOT NULL,
            bruta DECIMAL(6,2) NULL,
            ajustada DECIMAL(6,2) NULL,
            ic95_min DECIMAL(6,2) NULL,
            ic95_max DECIMAL(6,2) NULL,
            efeito_shap DECIMAL(6,2) NULL
        )
    """)


def _remover_dados_ficticios(cursor):
    cursor.execute("DELETE FROM registros_salariais WHERE id_municipio < %s", (ID_MINIMO_MUNICIPIO_REAL,))
    cursor.execute("DELETE FROM municipios WHERE id_municipio < %s", (ID_MINIMO_MUNICIPIO_REAL,))
    cursor.execute("DELETE FROM clusters WHERE ano IS NULL")


def _valor(v):
    # NaN -> NULL
    return None if pd.isna(v) else v


def _arredondar(v, casas=2):
    return None if pd.isna(v) else round(float(v), casas)


def _carregar_explicabilidade(cursor, explicabilidade, ano, regiao):
    for tabela in ("shap_pesos", "efeitos_ajustados"):
        cursor.execute(f"DELETE FROM {tabela} WHERE ano = %s AND regiao = %s", (ano, regiao))

    linhas_pesos, linhas_efeitos = [], []
    for cluster, resultado in explicabilidade["shap"].items():
        for grupo, peso in resultado["pesos"].items():
            linhas_pesos.append((ano, regiao, cluster, grupo, float(peso)))

        regressao = explicabilidade["regressao"].get(cluster)
        for variavel in ("genero", "raca"):
            r = regressao[variavel] if regressao else None
            linhas_efeitos.append((
                ano, regiao, cluster, variavel,
                r["bruta"] if r else None,
                r["ajustada"] if r else None,
                r["ajustada_ic95"][0] if r else None,
                r["ajustada_ic95"][1] if r else None,
                _valor(resultado[f"efeito_{variavel}"]),
            ))

    cursor.executemany(
        "INSERT INTO shap_pesos (ano, regiao, cluster_numero, grupo, peso_percentual) VALUES (%s, %s, %s, %s, %s)",
        linhas_pesos,
    )
    cursor.executemany(
        "INSERT INTO efeitos_ajustados (ano, regiao, cluster_numero, variavel, bruta, ajustada, ic95_min, ic95_max, "
        "efeito_shap) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        linhas_efeitos,
    )


def carregar(nichos, clusters, explicabilidade, municipios_ibge, ano, regiao):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            _garantir_esquema(cursor)
            _remover_dados_ficticios(cursor)

            cursor.executemany(
                "INSERT INTO setores (id_setor, nome_setor) VALUES (%s, %s) "
                "ON DUPLICATE KEY UPDATE nome_setor = VALUES(nome_setor)",
                [(id_secao, nome) for id_secao, _, nome, _, _ in SECOES_CNAE],
            )

            # id do município = código IBGE de 6 dígitos, o mesmo da RAIS
            codigos = sorted(nichos["municipio"].unique())
            cursor.executemany(
                "INSERT INTO municipios (id_municipio, nome, uf) VALUES (%s, %s, %s) "
                "ON DUPLICATE KEY UPDATE nome = VALUES(nome), uf = VALUES(uf)",
                [(int(c), *municipios_ibge.get(int(c), (str(c), "??"))) for c in codigos],
            )

            # apaga o que já existe dessa região/ano antes de inserir
            ufs = sorted(nichos["uf"].astype(str).unique())
            marcadores = ", ".join(["%s"] * len(ufs))
            cursor.execute(
                f"DELETE r FROM registros_salariais r JOIN municipios m ON r.id_municipio = m.id_municipio "
                f"WHERE r.ano = %s AND m.uf IN ({marcadores})",
                (ano, *ufs),
            )
            cursor.executemany(
                "INSERT INTO registros_salariais (id_municipio, id_setor, total_trabalhadores, indice_disparidade, "
                "prioridade_politica, ano, salario_medio_homens, salario_medio_mulheres, disparidade_raca, "
                "indice_prioridade, disparidade_genero_ajustada, disparidade_raca_ajustada, perc_baixa_qualificacao, "
                "ganho_qualificacao, publico_alvo, perda_mensal_genero, ganho_mensal_qualificacao) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                [
                    (int(n.municipio), int(n.id_secao), int(n.total_trabalhadores), float(n.disparidade_genero),
                     n.prioridade, ano, _valor(n.salario_medio_homens), _valor(n.salario_medio_mulheres),
                     _valor(n.disparidade_raca), _arredondar(n.indice_prioridade, 1),
                     _arredondar(n.disparidade_genero_ajustada), _arredondar(n.disparidade_raca_ajustada),
                     _arredondar(n.perc_baixa_qualificacao), _arredondar(n.ganho_qualificacao),
                     _valor(n.publico_alvo), _arredondar(n.perda_mensal_genero),
                     _arredondar(n.ganho_mensal_qualificacao))
                    for n in nichos.itertuples()
                ],
            )

            cursor.execute("DELETE FROM clusters WHERE ano = %s AND regiao = %s", (ano, regiao))
            cursor.executemany(
                "INSERT INTO clusters (nome_cluster, descricao, media_salarial_homens, media_salarial_mulheres, "
                "disparidade_percentual, total_trabalhadores, perc_mulheres, perc_negros, idade_media, "
                "escolaridade_predominante, ocupacao_predominante, setor_predominante, disparidade_raca, ano, regiao, "
                "numero) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                [
                    (c.nome_cluster, c.descricao, _valor(c.media_salarial_homens), _valor(c.media_salarial_mulheres),
                     _valor(c.disparidade_genero), int(c.total_trabalhadores), c.perc_mulheres, c.perc_negros,
                     c.idade_media, c.escolaridade_predominante, c.ocupacao_predominante, c.setor_predominante,
                     _valor(c.disparidade_raca), ano, regiao, int(c.cluster))
                    for c in clusters.itertuples()
                ],
            )

            _carregar_explicabilidade(cursor, explicabilidade, ano, regiao)
        conn.commit()
    finally:
        conn.close()
