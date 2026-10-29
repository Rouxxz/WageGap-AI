"""
Passo 2: agrupamento dos trabalhadores em perfis (K-Means).

Sexo e raça não entram no agrupamento. Assim a diferença salarial dentro
de cada perfil não vem de escolaridade, cargo, setor etc.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import MiniBatchKMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from src.referencias import CBO_GRANDE_GRUPO, MACROSSETORES, SECAO_NOME

SEMENTE = 42
MINIMO_GRUPO = 30   # abaixo disso a mediana fica instável
MINIMO_NICHO = 100  # nichos são menores, então exigimos mais gente


def montar_caracteristicas(df):
    numericas = pd.DataFrame({
        "escolaridade": df["escolaridade"],
        "idade": df["idade"],
        "horas": df["horas"],
        "tamanho_estab": df["tamanho_estab"],
        "tempo_emprego": np.log1p(df["tempo_emprego"].clip(lower=0)),
    })
    escalador = StandardScaler()
    X_num = escalador.fit_transform(numericas)

    # one-hot de ocupação e setor
    X_cbo = pd.get_dummies(df["cbo_grupo"].astype(int)).reindex(columns=list(CBO_GRANDE_GRUPO), fill_value=0)
    X_setor = pd.get_dummies(df["macrossetor"]).reindex(columns=MACROSSETORES, fill_value=0)

    return np.hstack([X_num, X_cbo.to_numpy(float), X_setor.to_numpy(float)]).astype(np.float32)


def escolher_k(X, k_min=4, k_max=10, amostra=100_000):
    # testa k numa amostra e fica com o maior silhouette
    rng = np.random.default_rng(SEMENTE)
    idx = rng.choice(len(X), size=min(amostra, len(X)), replace=False)
    X_amostra = X[idx]
    idx_sil = rng.choice(len(X_amostra), size=min(10_000, len(X_amostra)), replace=False)

    pontuacoes = {}
    for k in range(k_min, k_max + 1):
        modelo = MiniBatchKMeans(n_clusters=k, random_state=SEMENTE, n_init=5, batch_size=4096)
        rotulos = modelo.fit_predict(X_amostra)
        pontuacoes[k] = float(silhouette_score(X_amostra[idx_sil], rotulos[idx_sil]))
        print(f"  k={k}: silhouette={pontuacoes[k]:.3f}")

    melhor = max(pontuacoes, key=pontuacoes.get)
    return melhor, pontuacoes


def agrupar(df, k=None):
    X = montar_caracteristicas(df)

    pontuacoes = {}
    if k is None:
        k, pontuacoes = escolher_k(X)
    print(f"  usando k={k}")

    modelo = MiniBatchKMeans(n_clusters=k, random_state=SEMENTE, n_init=10, batch_size=8192)
    rng = np.random.default_rng(SEMENTE)
    idx = rng.choice(len(X), size=min(300_000, len(X)), replace=False)
    modelo.fit(X[idx])

    df = df.copy()
    df["cluster"] = modelo.predict(X)
    return df, k, pontuacoes


def disparidade(referencia, comparada):
    # % que o grupo comparado ganha a menos que o de referência
    if not referencia or pd.isna(referencia) or pd.isna(comparada):
        return None
    return round((referencia - comparada) / referencia * 100, 2)


def _moda(serie):
    return serie.mode().iloc[0]


def _medianas_por_grupo(grupo, coluna, a, b, minimo=MINIMO_GRUPO):
    # mediana em vez de média para não ser puxada por poucos salários muito altos
    medianas = {}
    for valor in (a, b):
        sub = grupo.loc[grupo[coluna] == valor, "salario_hora"]
        medianas[valor] = sub.median() if len(sub) >= minimo else None
    return medianas[a], medianas[b]


def _traco_marcante(g):
    # complemento do nome do cluster
    if g["horas"].mean() < 30:
        return "jornada parcial"
    if g["idade"].mean() >= 45:
        return "experientes"
    if g["idade"].mean() < 33:
        return "jovens"
    return None


def resumir_clusters(df):
    linhas = []
    for cluster, g in df.groupby("cluster"):
        homens = g[g["sexo"] == 1]
        mulheres = g[g["sexo"] == 2]
        sh_h, sh_m = _medianas_por_grupo(g, "sexo", 1, 2)
        sh_branca, sh_negra = _medianas_por_grupo(g, "raca_grupo", "Branca", "Negra")

        ocupacao = CBO_GRANDE_GRUPO[int(_moda(g["cbo_grupo"]))]
        escolaridade = str(_moda(g["escolaridade_grupo"]))
        setor = SECAO_NOME[int(_moda(g["id_secao"]))]
        macrossetor = str(_moda(g["macrossetor"]))
        traco = _traco_marcante(g)

        linhas.append({
            "cluster": int(cluster),
            "nome_cluster": " · ".join(p for p in (ocupacao, macrossetor, traco) if p),
            "total_trabalhadores": len(g),
            "perc_mulheres": round(len(mulheres) / len(g) * 100, 1),
            "perc_negros": round((g["raca_grupo"] == "Negra").mean() * 100, 1),
            "idade_media": round(g["idade"].mean(), 1),
            "horas_semanais_media": round(g["horas"].mean(), 1),
            "macrossetor_predominante": macrossetor,
            "escolaridade_predominante": escolaridade,
            "ocupacao_predominante": ocupacao,
            "setor_predominante": setor,
            "media_salarial_homens": round(homens["remuneracao"].mean(), 2) if len(homens) else None,
            "media_salarial_mulheres": round(mulheres["remuneracao"].mean(), 2) if len(mulheres) else None,
            "mediana_hora_homens": round(sh_h, 2) if sh_h else None,
            "mediana_hora_mulheres": round(sh_m, 2) if sh_m else None,
            "disparidade_genero": disparidade(sh_h, sh_m),
            "disparidade_raca": disparidade(sh_branca, sh_negra),
        })

    resumo = pd.DataFrame(linhas).sort_values("disparidade_genero", ascending=False)
    resumo["descricao"] = resumo.apply(
        lambda r: (
            f"{_br(r.total_trabalhadores, 0)} trabalhadores, {_br(r.perc_mulheres)}% mulheres, "
            f"{_br(r.perc_negros)}% negros, idade média de {_br(r.idade_media)} anos, "
            f"{_br(r.horas_semanais_media)}h semanais. Escolaridade mais comum: {r.escolaridade_predominante}. "
            f"Setor mais comum: {r.setor_predominante}."
        ),
        axis=1,
    )
    return resumo


def _br(numero, casas=1):
    # 361173 -> "361.173"
    texto = f"{numero:,.{casas}f}"
    return texto.replace(",", "_").replace(".", ",").replace("_", ".")


def resumir_nichos(df, minimo=MINIMO_NICHO):
    # nicho = município x setor, com pelo menos `minimo` homens e `minimo` mulheres
    linhas = []
    for (municipio, uf, id_secao), g in df.groupby(["municipio", "uf", "id_secao"], observed=True):
        sh_h, sh_m = _medianas_por_grupo(g, "sexo", 1, 2, minimo)
        if sh_h is None or sh_m is None:
            continue
        sh_branca, sh_negra = _medianas_por_grupo(g, "raca_grupo", "Branca", "Negra", minimo)
        linhas.append({
            "municipio": int(municipio),
            "uf": uf,
            "id_secao": int(id_secao),
            "setor": SECAO_NOME[int(id_secao)],
            "total_trabalhadores": len(g),
            "perc_mulheres": round((g["sexo"] == 2).mean() * 100, 1),
            "mediana_hora_homens": round(sh_h, 2),
            "mediana_hora_mulheres": round(sh_m, 2),
            "salario_medio_homens": round(g.loc[g["sexo"] == 1, "remuneracao"].mean(), 2),
            "salario_medio_mulheres": round(g.loc[g["sexo"] == 2, "remuneracao"].mean(), 2),
            "disparidade_genero": disparidade(sh_h, sh_m),
            "disparidade_raca": disparidade(sh_branca, sh_negra),
        })
    return pd.DataFrame(linhas).sort_values("disparidade_genero", ascending=False)


def resumir_escolaridade(df, ordem):
    linhas = []
    for nivel in ordem:
        g = df[df["escolaridade_grupo"] == nivel]
        if g.empty:
            continue
        sh_h, sh_m = _medianas_por_grupo(g, "sexo", 1, 2)
        sh_branca, sh_negra = _medianas_por_grupo(g, "raca_grupo", "Branca", "Negra")
        linhas.append({
            "escolaridade": nivel,
            "total_trabalhadores": len(g),
            "mediana_salario_hora": round(g["salario_hora"].median(), 2),
            "disparidade_genero": disparidade(sh_h, sh_m),
            "disparidade_raca": disparidade(sh_branca, sh_negra),
        })
    return pd.DataFrame(linhas)
