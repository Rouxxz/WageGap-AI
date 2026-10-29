"""
Passo 3: regressão e explicabilidade, sobre o log do salário/hora.

- Regressão linear (Mincer): disparidade bruta e ajustada de gênero e raça.
- LightGBM + SHAP: peso de cada grupo de fatores na renda, geral e por cluster.
"""
import numpy as np
import pandas as pd
import shap
import statsmodels.formula.api as smf
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, r2_score

SEMENTE = 42
AMOSTRA_TREINO = 500_000
AMOSTRA_SHAP_POR_CLUSTER = 2_000
AMOSTRA_REGRESSAO_CLUSTER = 100_000

# grupos que aparecem no dashboard
GRUPOS = {
    "sexo": "Gênero",
    "raca": "Raça",
    "escolaridade": "Qualificação/cargo",
    "ocupacao": "Qualificação/cargo",
    "municipio": "Localização",
    "uf": "Localização",
    "idade": "Experiência",
    "tempo_emprego": "Experiência",
    "horas": "Jornada",
    "setor": "Setor e empresa",
    "porte": "Setor e empresa",
}

ORDEM_GRUPOS = ["Qualificação/cargo", "Gênero", "Localização", "Raça", "Experiência", "Setor e empresa", "Jornada"]


def montar_caracteristicas(df):
    return pd.DataFrame({
        "sexo": df["sexo"].map({1: "Masculino", 2: "Feminino"}).astype("category"),
        "raca": df["raca_grupo"].astype(str).astype("category"),
        "escolaridade": df["escolaridade"].astype(int),
        # subgrupo principal da CBO (2 dígitos)
        "ocupacao": (df["cbo"] // 10000).astype("category"),
        "municipio": df["municipio"].astype("category"),
        "uf": df["uf"].astype(str).astype("category"),
        "idade": df["idade"].astype(int),
        "tempo_emprego": df["tempo_emprego"].astype(float),
        "horas": df["horas"].astype(int),
        "setor": df["id_secao"].astype("category"),
        "porte": df["tamanho_estab"].astype(int),
    }, index=df.index)


def alinhar_categorias(X, tipos):
    # precisa das mesmas categorias (e na mesma ordem) do treino
    for coluna, tipo in tipos.items():
        if isinstance(tipo, pd.CategoricalDtype):
            X[coluna] = pd.Categorical(X[coluna], categories=tipo.categories)
    return X


def _efeito_percentual(coeficiente):
    # coeficiente em log -> % a menos
    return round(float(-(np.exp(coeficiente) - 1) * 100), 2)


# Regressão linear

FORMULA_CONTROLES = (
    " + C(escolaridade) + idade + I(idade ** 2) + np.log1p(tempo_emprego) + horas"
    " + C(ocupacao) + C(setor) + C(porte) + C(uf)"
)


def _preparar_regressao(df):
    dados = montar_caracteristicas(df)
    dados["log_salario_hora"] = np.log(df["salario_hora"])
    dados["mulher"] = (df["sexo"] == 2).astype(int)
    dados["raca"] = pd.Categorical(dados["raca"].astype(str))
    return dados


def regressao(df):
    # bruta = só sexo e raça; ajustada = com os controles
    dados = _preparar_regressao(df)
    referencia_raca = "C(raca, Treatment(reference='Branca'))"

    bruta = smf.ols(f"log_salario_hora ~ mulher + {referencia_raca}", data=dados).fit()
    ajustada = smf.ols(f"log_salario_hora ~ mulher + {referencia_raca}{FORMULA_CONTROLES}", data=dados).fit()

    termo_negra = f"{referencia_raca}[T.Negra]"
    resultado = {}
    for variavel, termo in (("genero", "mulher"), ("raca", termo_negra)):
        ic_baixo, ic_alto = ajustada.conf_int().loc[termo]
        resultado[variavel] = {
            "bruta": _efeito_percentual(bruta.params[termo]),
            "ajustada": _efeito_percentual(ajustada.params[termo]),
            # limites invertidos: coeficiente maior = efeito menor
            "ajustada_ic95": [_efeito_percentual(ic_alto), _efeito_percentual(ic_baixo)],
            "p_valor": float(ajustada.pvalues[termo]),
        }
    resultado["r2_ajustado"] = round(float(ajustada.rsquared_adj), 3)
    resultado["observacoes"] = int(ajustada.nobs)
    return resultado


def regressao_por_cluster(df):
    resultados = {}
    for cluster, g in df.groupby("cluster"):
        amostra = g.sample(min(len(g), AMOSTRA_REGRESSAO_CLUSTER), random_state=SEMENTE)
        try:
            resultados[int(cluster)] = regressao(amostra)
        except Exception as erro:  # cluster sem negros ou sem variação suficiente
            print(f"  cluster {cluster}: regressão não estimada ({erro})")
    return resultados


# LightGBM + SHAP

def treinar_modelo(df):
    amostra = df.sample(min(len(df), AMOSTRA_TREINO), random_state=SEMENTE)
    X = montar_caracteristicas(amostra)
    y = np.log(amostra["salario_hora"])

    corte = int(len(X) * 0.8)
    X_treino, X_teste = X.iloc[:corte], X.iloc[corte:]
    y_treino, y_teste = y.iloc[:corte], y.iloc[corte:]

    modelo = LGBMRegressor(
        n_estimators=300,
        learning_rate=0.08,
        num_leaves=63,
        min_child_samples=100,
        subsample=0.8,
        subsample_freq=1,
        colsample_bytree=0.9,
        random_state=SEMENTE,
        verbose=-1,
    )
    modelo.fit(X_treino, y_treino)

    previsto = modelo.predict(X_teste)
    metricas = {
        "r2_teste": round(float(r2_score(y_teste, previsto)), 3),
        # MAE em log ≈ erro percentual
        "erro_medio_percentual": round(float((np.exp(mean_absolute_error(y_teste, previsto)) - 1) * 100), 1),
        "amostra_treino": len(X_treino),
        "amostra_teste": len(X_teste),
    }
    return modelo, X.dtypes, metricas


def _amostra_estratificada(df):
    # mesma quantidade de gente por cluster
    partes = [
        g.sample(min(len(g), AMOSTRA_SHAP_POR_CLUSTER), random_state=SEMENTE)
        for _, g in df.groupby("cluster")
    ]
    return pd.concat(partes)


def _pesos_por_grupo(valores_shap, colunas, pesos_linhas):
    # média do |SHAP| somada por grupo, em %
    importancia = np.average(np.abs(valores_shap), axis=0, weights=pesos_linhas)
    por_grupo = pd.Series(importancia, index=colunas).groupby(GRUPOS).sum()
    por_grupo = por_grupo / por_grupo.sum() * 100
    return por_grupo.reindex(ORDEM_GRUPOS).round(2)


def _efeito_shap(valores_shap, colunas, amostra, coluna, grupo_a, grupo_b):
    # diferença média de SHAP entre dois grupos, em %
    i = list(colunas).index(coluna)
    a = valores_shap[(amostra[coluna] == grupo_a).to_numpy(), i]
    b = valores_shap[(amostra[coluna] == grupo_b).to_numpy(), i]
    if len(a) == 0 or len(b) == 0:
        return None
    return _efeito_percentual(a.mean() - b.mean())


def explicar_shap(modelo, tipos, df):
    amostra_df = _amostra_estratificada(df)
    X = alinhar_categorias(montar_caracteristicas(amostra_df), tipos)

    explicador = shap.TreeExplainer(modelo)
    valores = explicador.shap_values(X)

    # reescala a amostra para o tamanho real de cada cluster
    tamanhos = df["cluster"].value_counts()
    contagem_amostra = amostra_df["cluster"].value_counts()
    pesos_linhas = amostra_df["cluster"].map(tamanhos / contagem_amostra).to_numpy()

    resultado = {
        None: {
            "pesos": _pesos_por_grupo(valores, X.columns, pesos_linhas),
            "efeito_genero": _efeito_shap(valores, X.columns, X, "sexo", "Feminino", "Masculino"),
            "efeito_raca": _efeito_shap(valores, X.columns, X, "raca", "Negra", "Branca"),
        }
    }
    for cluster in sorted(amostra_df["cluster"].unique()):
        mascara = (amostra_df["cluster"] == cluster).to_numpy()
        resultado[int(cluster)] = {
            "pesos": _pesos_por_grupo(valores[mascara], X.columns, None),
            "efeito_genero": _efeito_shap(valores[mascara], X.columns, X[mascara], "sexo", "Feminino", "Masculino"),
            "efeito_raca": _efeito_shap(valores[mascara], X.columns, X[mascara], "raca", "Negra", "Branca"),
        }
    return resultado
