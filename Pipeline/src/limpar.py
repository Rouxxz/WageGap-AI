"""Passo 1: limpeza da RAIS. Fica só com vínculos ativos em 31/12 e calcula o salário por hora."""
import numpy as np
import pandas as pd

from src.referencias import (
    COLUNAS_RAIS, DIVISAO_PARA_SECAO, ESCOLARIDADE_GRUPO, MACROSSETOR, RACA_GRUPO, UF_POR_CODIGO,
)

SEMANAS_POR_MES = 4.345


def _ler_em_partes(csv, tamanho_parte=500_000):
    # arquivo grande: só as colunas usadas, em partes
    return pd.read_csv(
        csv,
        sep=",",
        encoding="latin-1",
        usecols=list(COLUNAS_RAIS.keys()),
        dtype=str,
        chunksize=tamanho_parte,
    )


def _limpar_parte(df):
    df = df.rename(columns=COLUNAS_RAIS)

    # alguns códigos vêm com espaço, tipo " 86305"
    for coluna in df.columns:
        df[coluna] = pd.to_numeric(df[coluna].str.strip(), errors="coerce")

    filtro = (
        (df["ativo"] == 1)
        & df["sexo"].isin([1, 2])
        & df["raca"].isin(RACA_GRUPO.keys())
        & df["escolaridade"].between(1, 11)
        & df["horas"].between(1, 60)
        & df["idade"].between(14, 80)
        & df["tamanho_estab"].between(1, 10)
        & (df["remuneracao"] > 0)
        & (df["intermitente"] != 1)
        & df["cnae_classe"].notna()
        & df["municipio"].notna()
        & df["cbo"].notna()
    )
    df = df.loc[filtro].copy()

    df["salario_hora"] = df["remuneracao"] / (df["horas"] * SEMANAS_POR_MES)
    df["tempo_emprego"] = df["tempo_emprego"].fillna(0)

    divisao = (df["cnae_classe"] // 1000).astype(int)
    df["id_secao"] = divisao.map(DIVISAO_PARA_SECAO)
    df["macrossetor"] = df["id_secao"].map(MACROSSETOR).fillna("Serviços")
    df["cbo_grupo"] = (df["cbo"] // 100000).astype(int)
    df["uf"] = (df["municipio"] // 10000).astype(int).map(UF_POR_CODIGO)
    df["raca_grupo"] = df["raca"].map(RACA_GRUPO)
    df["escolaridade_grupo"] = df["escolaridade"].map(ESCOLARIDADE_GRUPO)

    df = df.dropna(subset=["id_secao", "uf"])

    colunas_finais = [
        "municipio", "uf", "id_secao", "macrossetor", "cbo", "cbo_grupo",
        "sexo", "raca", "raca_grupo", "escolaridade", "escolaridade_grupo",
        "idade", "horas", "tamanho_estab", "tempo_emprego", "remuneracao", "salario_hora",
    ]
    return df[colunas_finais]


def limpar_rais(csv):
    partes, lidas = [], 0
    for parte in _ler_em_partes(csv):
        lidas += len(parte)
        partes.append(_limpar_parte(parte))
        print(f"  {lidas:,} linhas lidas".replace(",", "."))

    df = pd.concat(partes, ignore_index=True)

    # corta salário/hora extremo (erro de digitação, jornada mal declarada)
    minimo = df["salario_hora"].quantile(0.01) / 2
    maximo = df["salario_hora"].quantile(0.999)
    df = df[df["salario_hora"].between(minimo, maximo)]

    # tipos menores para economizar memória
    for coluna in ["municipio", "cbo"]:
        df[coluna] = df[coluna].astype(np.int32)
    for coluna in ["id_secao", "cbo_grupo", "sexo", "raca", "escolaridade", "idade", "horas", "tamanho_estab"]:
        df[coluna] = df[coluna].astype(np.int16)
    for coluna in ["uf", "macrossetor", "raca_grupo", "escolaridade_grupo"]:
        df[coluna] = df[coluna].astype("category")

    resumo = {
        "linhas_lidas": lidas,
        "vinculos_validos": len(df),
        "salario_hora_min": round(float(minimo), 2),
        "salario_hora_max": round(float(maximo), 2),
    }
    return df.reset_index(drop=True), resumo
