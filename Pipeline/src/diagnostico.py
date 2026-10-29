"""
Passo 4: índice de prioridade para capacitação.

Com o modelo do passo 3, simulamos cada trabalhador mudando uma coisa só:
mulher -> homem, negro -> branco e sem ensino médio -> com ensino médio.
As diferenças viram o índice de cada nicho (ver calcular_indice).
"""
import numpy as np
import pandas as pd

from src.explicar import alinhar_categorias, montar_caracteristicas

PESOS_INDICE = {"desigualdade": 0.40, "qualificacao": 0.35, "escala": 0.25}

# Alta = 20% maiores índices, Média = 30% seguintes
CORTE_ALTA = 0.80
CORTE_MEDIA = 0.50

ESCOLARIDADE_ALVO = 7          # médio completo
ESCOLARIDADE_BAIXA_MAX = 6     # até médio incompleto
LIMITE_DISPARIDADE_ALVO = 5.0  # % a partir da qual o grupo entra no público-alvo
LIMITE_BAIXA_QUALIFICACAO = 25.0
MINIMO_NEGROS = 30
TAMANHO_LOTE = 500_000

# Salário de servidor é definido por lei, então curso de capacitação não mexe na renda.
# Esses nichos continuam no ranking, mas fora do índice.
SECOES_FORA_DO_INDICE = {15, 21}  # Administração pública; Organismos internacionais
PRIORIDADE_NAO_SE_APLICA = "Nao se aplica"


def _prever(modelo, X):
    # em lotes para não estourar a memória
    partes = [modelo.predict(X.iloc[i:i + TAMANHO_LOTE]) for i in range(0, len(X), TAMANHO_LOTE)]
    return np.concatenate(partes) if partes else np.array([])


def _contrafactual(modelo, X, mascara, coluna, novo_valor):
    # diferença no salário previsto (em log) ao trocar `coluna` por `novo_valor`
    original = X.loc[mascara]
    alterado = original.copy()
    if isinstance(original[coluna].dtype, pd.CategoricalDtype):
        alterado[coluna] = pd.Categorical([novo_valor] * len(alterado), categories=original[coluna].cat.categories)
    else:
        alterado[coluna] = novo_valor

    delta = pd.Series(np.nan, index=X.index)
    delta.loc[mascara] = _prever(modelo, alterado) - _prever(modelo, original)
    return delta


def simular(modelo, tipos, df):
    X = alinhar_categorias(montar_caracteristicas(df), tipos)

    mulheres = (df["sexo"] == 2).to_numpy()
    negros = (df["raca_grupo"] == "Negra").to_numpy()
    baixa_qualificacao = (df["escolaridade"] <= ESCOLARIDADE_BAIXA_MAX).to_numpy()

    print("  simulando: mulheres como homens")
    delta_genero = _contrafactual(modelo, X, mulheres, "sexo", "Masculino")
    print("  simulando: pessoas negras como brancas")
    delta_raca = _contrafactual(modelo, X, negros, "raca", "Branca")
    print("  simulando: ensino médio concluído")
    delta_qualificacao = _contrafactual(modelo, X, baixa_qualificacao, "escolaridade", ESCOLARIDADE_ALVO)

    simulado = df[["municipio", "uf", "id_secao", "cluster", "sexo", "raca_grupo", "escolaridade",
                   "cbo_grupo", "remuneracao"]].copy()
    simulado["delta_genero"] = delta_genero.to_numpy()
    simulado["delta_raca"] = delta_raca.to_numpy()
    simulado["delta_qualificacao"] = delta_qualificacao.to_numpy()
    return simulado


def _disparidade_contrafactual(deltas):
    # deltas em log -> % a menos
    deltas = deltas.dropna()
    if deltas.empty:
        return np.nan
    return (1 - np.exp(-deltas.mean())) * 100


def _metricas(g):
    mulheres = g["sexo"] == 2
    negros = g["raca_grupo"] == "Negra"
    baixa = g["escolaridade"] <= ESCOLARIDADE_BAIXA_MAX

    gap_genero = _disparidade_contrafactual(g.loc[mulheres, "delta_genero"])
    gap_raca = _disparidade_contrafactual(g.loc[negros, "delta_raca"]) if negros.sum() >= MINIMO_NEGROS else np.nan

    fator_qualificacao = np.exp(g.loc[baixa, "delta_qualificacao"]) - 1
    ganho_qualificacao = fator_qualificacao.mean() * 100 if baixa.any() else 0.0

    return pd.Series({
        "total_trabalhadores": len(g),
        "perc_mulheres": mulheres.mean() * 100,
        "perc_negros": negros.mean() * 100,
        "perc_baixa_qualificacao": baixa.mean() * 100,
        "trabalhadores_publico_alvo": int(baixa.sum()),
        "disparidade_genero_ajustada": gap_genero,
        "disparidade_raca_ajustada": gap_raca,
        "ganho_qualificacao": ganho_qualificacao,
        # R$/mês que as mulheres deixam de ganhar
        "perda_mensal_genero": (g.loc[mulheres, "remuneracao"] * (np.exp(g.loc[mulheres, "delta_genero"]) - 1)).sum(),
        # R$/mês a mais se concluíssem o ensino médio
        "ganho_mensal_qualificacao": (g.loc[baixa, "remuneracao"] * fator_qualificacao).sum(),
    })


def _acima_do_limite(valor):
    return pd.notna(valor) and valor >= LIMITE_DISPARIDADE_ALVO


def _publico_alvo(linha):
    genero = _acima_do_limite(linha["disparidade_genero_ajustada"])
    raca = _acima_do_limite(linha["disparidade_raca_ajustada"])

    if genero and raca:
        grupo = "Mulheres negras"
    elif genero:
        grupo = "Mulheres"
    elif raca:
        grupo = "Pessoas negras"
    else:
        grupo = "Trabalhadores"

    if linha["perc_baixa_qualificacao"] >= LIMITE_BAIXA_QUALIFICACAO:
        return f"{grupo} com até ensino médio incompleto"
    return f"{grupo} com ensino médio (qualificação técnica)"


def calcular_indice(tabela, elegiveis=None):
    # cada componente vira percentil e entra com o peso de PESOS_INDICE;
    # quem está fora de `elegiveis` fica como "Não se aplica"
    if elegiveis is None:
        elegiveis = pd.Series(True, index=tabela.index)
    fora = tabela.loc[~elegiveis].copy()
    tabela = tabela.loc[elegiveis].copy()

    # perda média por trabalhador, somando gênero e raça
    perda_genero = tabela["disparidade_genero_ajustada"].clip(lower=0).fillna(0) * tabela["perc_mulheres"] / 100
    perda_raca = tabela["disparidade_raca_ajustada"].clip(lower=0).fillna(0) * tabela["perc_negros"] / 100
    tabela["componente_desigualdade"] = (perda_genero + perda_raca).rank(pct=True)

    # ganho médio considerando o nicho inteiro
    ganho_medio = tabela["ganho_qualificacao"] * tabela["perc_baixa_qualificacao"] / 100
    tabela["componente_qualificacao"] = ganho_medio.rank(pct=True)

    tabela["componente_escala"] = tabela["total_trabalhadores"].rank(pct=True)

    tabela["indice_prioridade"] = 100 * (
        PESOS_INDICE["desigualdade"] * tabela["componente_desigualdade"]
        + PESOS_INDICE["qualificacao"] * tabela["componente_qualificacao"]
        + PESOS_INDICE["escala"] * tabela["componente_escala"]
    )

    posicao = tabela["indice_prioridade"].rank(pct=True)
    tabela["prioridade"] = np.where(posicao > CORTE_ALTA, "Alta", np.where(posicao > CORTE_MEDIA, "Media", "Baixa"))
    tabela["publico_alvo"] = tabela.apply(_publico_alvo, axis=1)

    if not fora.empty:
        fora["prioridade"] = PRIORIDADE_NAO_SE_APLICA
        fora["publico_alvo"] = None
        tabela = pd.concat([tabela, fora])
    return tabela.sort_values("indice_prioridade", ascending=False, na_position="last")


def priorizar_nichos(simulado, nichos, incluir_adm_publica=False):
    # só os nichos que passaram no filtro do passo 2
    chaves = nichos[["municipio", "id_secao"]]
    sub = simulado.merge(chaves, on=["municipio", "id_secao"])
    metricas = (
        sub.groupby(["municipio", "id_secao"], observed=True)
        .apply(_metricas, include_groups=False)
        .reset_index()
    )
    tabela = nichos.drop(columns=["total_trabalhadores", "perc_mulheres"]).merge(metricas, on=["municipio", "id_secao"])
    elegiveis = None if incluir_adm_publica else ~tabela["id_secao"].isin(SECOES_FORA_DO_INDICE)
    return calcular_indice(tabela, elegiveis)


def priorizar_clusters(simulado, resumo_clusters, incluir_adm_publica=False):
    # mesmo critério dos nichos
    if not incluir_adm_publica:
        simulado = simulado[~simulado["id_secao"].isin(SECOES_FORA_DO_INDICE)]
    metricas = simulado.groupby("cluster").apply(_metricas, include_groups=False).reset_index()
    tabela = resumo_clusters[["cluster", "nome_cluster"]].merge(metricas, on="cluster")
    return calcular_indice(tabela)


def totais(simulado):
    mulheres = simulado["sexo"] == 2
    negros = simulado["raca_grupo"] == "Negra"
    baixa = simulado["escolaridade"] <= ESCOLARIDADE_BAIXA_MAX
    return {
        "disparidade_genero_ajustada": round(float(_disparidade_contrafactual(simulado.loc[mulheres, "delta_genero"])), 2),
        "disparidade_raca_ajustada": round(float(_disparidade_contrafactual(simulado.loc[negros, "delta_raca"])), 2),
        "perda_mensal_genero": round(float(
            (simulado.loc[mulheres, "remuneracao"] * (np.exp(simulado.loc[mulheres, "delta_genero"]) - 1)).sum()), 2),
        "perda_mensal_raca": round(float(
            (simulado.loc[negros, "remuneracao"] * (np.exp(simulado.loc[negros, "delta_raca"]) - 1)).sum()), 2),
        "trabalhadores_baixa_qualificacao": int(baixa.sum()),
        "ganho_qualificacao_medio": round(float((np.exp(simulado.loc[baixa, "delta_qualificacao"]) - 1).mean() * 100), 2),
        "ganho_mensal_qualificacao": round(float(
            (simulado.loc[baixa, "remuneracao"] * (np.exp(simulado.loc[baixa, "delta_qualificacao"]) - 1)).sum()), 2),
    }
