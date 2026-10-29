"""
Roda o pipeline inteiro para um ano/região da RAIS:

  docker compose run --rm pipeline python -m src.run --ano 2024 --regiao NORTE
"""
import argparse
import json

import pandas as pd

from src import carregar, clusters, diagnostico, explicar, extrair, limpar, relatorio
from src.config import OUTPUT_DIR, PROCESSED_DIR, REGIOES
from src.referencias import ORDEM_ESCOLARIDADE_GRUPO


def passo_1(ano, regiao):
    print("\n[1/5] Coleta e limpeza dos dados")
    parquet = PROCESSED_DIR / f"rais_{ano}_{regiao.lower()}.parquet"
    if parquet.exists():
        print(f"  usando dados já limpos: {parquet.name}")
        return pd.read_parquet(parquet), json.loads(parquet.with_suffix(".json").read_text())

    arquivo_7z = extrair.baixar_rais(ano, regiao)
    csv = extrair.extrair_rais(arquivo_7z, ano)
    df, resumo = limpar.limpar_rais(csv)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_parquet(parquet, index=False)
    parquet.with_suffix(".json").write_text(json.dumps(resumo, indent=2))
    return df, resumo


def passo_2(df, k):
    print("\n[2/5] Segmentação de perfis (K-Means)")
    df, k, pontuacoes = clusters.agrupar(df, k)
    resumo_clusters = clusters.resumir_clusters(df)
    print("  calculando nichos (município x setor)")
    nichos = clusters.resumir_nichos(df)
    escolaridade = clusters.resumir_escolaridade(df, ORDEM_ESCOLARIDADE_GRUPO)
    return df, resumo_clusters, nichos, escolaridade, k, pontuacoes


def passo_3(df):
    print("\n[3/5] Regressão e explicabilidade (SHAP)")
    print("  regressão linear: disparidade bruta x ajustada")
    amostra = df.sample(min(len(df), explicar.AMOSTRA_TREINO), random_state=explicar.SEMENTE)
    regressoes = {None: explicar.regressao(amostra)}
    regressoes.update(explicar.regressao_por_cluster(df))

    print("  treinando LightGBM")
    modelo, tipos, metricas = explicar.treinar_modelo(df)
    print(f"  R² no teste: {metricas['r2_teste']}")

    print("  calculando valores SHAP")
    shap_resultados = explicar.explicar_shap(modelo, tipos, df)
    explicabilidade = {"regressao": regressoes, "shap": shap_resultados, "modelo": metricas}
    return explicabilidade, modelo, tipos


def passo_4(modelo, tipos, df, nichos, resumo_clusters, incluir_adm_publica):
    print("\n[4/5] Diagnóstico: prioridade para capacitação profissional")
    simulado = diagnostico.simular(modelo, tipos, df)
    nichos_priorizados = diagnostico.priorizar_nichos(simulado, nichos, incluir_adm_publica)
    perfis_priorizados = diagnostico.priorizar_clusters(simulado, resumo_clusters, incluir_adm_publica)
    return nichos_priorizados, perfis_priorizados, diagnostico.totais(simulado)


def salvar_resultados(pasta, resumo_limpeza, resumo_clusters, nichos, escolaridade, k, pontuacoes,
                      explicabilidade, perfis_priorizados, totais, municipios_ibge):
    pasta.mkdir(parents=True, exist_ok=True)
    resumo_clusters.to_csv(pasta / "clusters.csv", index=False, sep=";", encoding="utf-8-sig")
    escolaridade.to_csv(pasta / "disparidade_escolaridade.csv", index=False, sep=";", encoding="utf-8-sig")

    nichos = nichos.copy()
    nichos.insert(1, "nome_municipio", nichos["municipio"].map(lambda c: municipios_ibge.get(c, (str(c),))[0]))
    nichos.round(2).to_csv(pasta / "nichos.csv", index=False, sep=";", encoding="utf-8-sig")
    perfis_priorizados.round(2).to_csv(pasta / "perfis_prioritarios.csv", index=False, sep=";", encoding="utf-8-sig")

    (pasta / "diagnostico.md").write_text(
        relatorio.gerar(nichos, perfis_priorizados, totais, explicabilidade, resumo_limpeza, pasta.name),
        encoding="utf-8",
    )

    (pasta / "resumo.json").write_text(json.dumps({
        **resumo_limpeza,
        "k_escolhido": k,
        "silhouette_por_k": pontuacoes,
        "clusters": len(resumo_clusters),
        "nichos": len(nichos),
        "diagnostico": totais,
    }, indent=2, ensure_ascii=False), encoding="utf-8")

    # uma linha por perfil ("Todos" = recorte inteiro)
    pesos = pd.DataFrame({
        ("Todos" if c is None else c): r["pesos"] for c, r in explicabilidade["shap"].items()
    }).T
    pesos.index.name = "cluster"
    pesos.to_csv(pasta / "shap_pesos.csv", sep=";", encoding="utf-8-sig")

    (pasta / "explicabilidade.json").write_text(json.dumps({
        "modelo_lightgbm": explicabilidade["modelo"],
        "regressao": {("todos" if c is None else str(c)): r for c, r in explicabilidade["regressao"].items()},
        "efeitos_shap": {
            ("todos" if c is None else str(c)): {"genero": r["efeito_genero"], "raca": r["efeito_raca"]}
            for c, r in explicabilidade["shap"].items()
        },
    }, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Pipeline RAIS -> clusters -> SHAP -> MySQL")
    parser.add_argument("--ano", type=int, default=2024)
    parser.add_argument("--regiao", choices=REGIOES, default="NORTE")
    # 8 por padrão: o silhouette quase não muda entre 4 e 10, então fomos pelo mais fácil de interpretar
    parser.add_argument("--k", default="8", help="número de clusters ou 'auto' (padrão: 8)")
    parser.add_argument("--sem-banco", action="store_true", help="não grava no MySQL")
    parser.add_argument("--incluir-adm-publica", action="store_true",
                        help="inclui a administração pública no índice de prioridade (padrão: fica de fora)")
    args = parser.parse_args()

    df, resumo_limpeza = passo_1(args.ano, args.regiao)
    print(f"  {resumo_limpeza['vinculos_validos']:,} vínculos válidos de {resumo_limpeza['linhas_lidas']:,} lidos"
          .replace(",", "."))

    k = None if args.k == "auto" else int(args.k)
    df, resumo_clusters, nichos, escolaridade, k, pontuacoes = passo_2(df, k)
    explicabilidade, modelo, tipos = passo_3(df)
    nichos, perfis_priorizados, totais = passo_4(modelo, tipos, df, nichos, resumo_clusters,
                                                 args.incluir_adm_publica)

    print("\n[5/5] Salvando resultados")
    municipios_ibge = extrair.carregar_municipios_ibge()
    pasta = OUTPUT_DIR / f"{args.ano}_{args.regiao.lower()}"
    salvar_resultados(pasta, resumo_limpeza, resumo_clusters, nichos, escolaridade, k, pontuacoes,
                      explicabilidade, perfis_priorizados, totais, municipios_ibge)
    print(f"  arquivos em {pasta}")

    if not args.sem_banco:
        carregar.carregar(nichos, resumo_clusters, explicabilidade, municipios_ibge, args.ano, args.regiao)
        print("  MySQL atualizado")

    pd.set_option("display.width", 200)
    pd.set_option("display.max_columns", 20)
    print("\nClusters (ordenados pela disparidade de gênero):")
    print(resumo_clusters[["nome_cluster", "total_trabalhadores", "perc_mulheres", "perc_negros",
                           "disparidade_genero", "disparidade_raca"]].to_string(index=False))
    print("\nDisparidade por escolaridade:")
    print(escolaridade.to_string(index=False))

    geral = explicabilidade["regressao"][None]
    print("\nDisparidade bruta x ajustada (regressão):")
    for variavel, nome in (("genero", "Mulheres x homens"), ("raca", "Negros x brancos")):
        r = geral[variavel]
        print(f"  {nome}: bruta {r['bruta']}% | ajustada {r['ajustada']}% (IC95% {r['ajustada_ic95']})")
    print("\nPeso de cada fator na renda (SHAP, %):")
    print(explicabilidade["shap"][None]["pesos"].to_string())

    print("\nNichos prioritários para capacitação (top 10):")
    print(nichos[["municipio", "uf", "setor", "total_trabalhadores", "indice_prioridade", "publico_alvo"]]
          .head(10).round(1).to_string(index=False))
    print(f"\nRelatório completo: {pasta / 'diagnostico.md'}")


if __name__ == "__main__":
    main()
