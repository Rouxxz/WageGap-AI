"""Monta o diagnostico.md."""
import pandas as pd

from src.diagnostico import CORTE_ALTA, CORTE_MEDIA, ESCOLARIDADE_BAIXA_MAX, PESOS_INDICE

NOMES_COMPONENTES = {"desigualdade": "desigualdade", "qualificacao": "qualificação", "escala": "escala"}


def _num(valor, casas=1):
    # 1234.5 -> "1.234,5"
    if valor is None or pd.isna(valor):
        return "—"
    texto = f"{valor:,.{casas}f}"
    return texto.replace(",", "_").replace(".", ",").replace("_", ".")


def _reais(valor):
    if abs(valor) >= 1e9:
        return f"R$ {_num(valor / 1e9)} bilhões"
    if abs(valor) >= 1e6:
        return f"R$ {_num(valor / 1e6)} milhões"
    return f"R$ {_num(valor, 0)}"


def _tabela(linhas, cabecalho):
    saida = ["| " + " | ".join(cabecalho) + " |", "|" + "---|" * len(cabecalho)]
    saida += ["| " + " | ".join(str(c) for c in linha) + " |" for linha in linhas]
    return "\n".join(saida)


def gerar(nichos, perfis, totais, explicabilidade, resumo_limpeza, recorte):
    ano, regiao = recorte.split("_", 1)
    regressao = explicabilidade["regressao"][None]
    pesos = explicabilidade["shap"][None]["pesos"]
    elegiveis = nichos[nichos["indice_prioridade"].notna()]
    altas = elegiveis[elegiveis["prioridade"] == "Alta"]

    partes = [f"# Diagnóstico de disparidade salarial — RAIS {ano} · {regiao.replace('_', ' ').title()}", ""]

    partes += [
        "## Resumo em números", "",
        f"- **{_num(resumo_limpeza['vinculos_validos'], 0)} vínculos formais** analisados "
        f"(ativos em 31/12, com dados válidos).",
        f"- Mulheres ganham **{_num(regressao['genero']['ajustada'])}% a menos** que homens com o mesmo perfil "
        f"profissional (regressão; diferença bruta: {_num(-regressao['genero']['bruta'])}% "
        f"{'a favor delas' if regressao['genero']['bruta'] < 0 else 'contra elas'}).",
        f"- Pessoas negras ganham **{_num(regressao['raca']['ajustada'])}% a menos** que brancas com o mesmo perfil "
        f"(diferença bruta: {_num(regressao['raca']['bruta'])}%).",
        f"- Segundo o modelo, as mulheres deixam de receber **{_reais(totais['perda_mensal_genero'])} por mês** "
        f"em relação ao que receberiam com o mesmo perfil sendo homens.",
        f"- **{_num(totais['trabalhadores_baixa_qualificacao'], 0)} trabalhadores** não concluíram o ensino médio. "
        f"Se concluíssem, a renda deles subiria em média **{_num(totais['ganho_qualificacao_medio'])}%** "
        f"(+{_reais(totais['ganho_mensal_qualificacao'])} por mês).",
        f"- **{len(altas)} nichos** (município × setor) com prioridade **Alta** para capacitação, "
        f"somando {_num(altas['total_trabalhadores'].sum(), 0)} trabalhadores.",
        "",
    ]

    linhas = [
        (i + 1, f"{n.nome_municipio} ({n.uf})", n.setor, _num(n.total_trabalhadores, 0),
         f"{_num(n.disparidade_genero_ajustada)}%", f"{_num(n.disparidade_raca_ajustada)}%",
         f"{_num(n.perc_baixa_qualificacao)}%", f"{_num(n.indice_prioridade)}", n.publico_alvo)
        for i, n in enumerate(elegiveis.head(15).itertuples())
    ]
    partes += [
        "## Onde capacitar primeiro (15 nichos com maior índice)", "",
        _tabela(linhas, ["#", "Município", "Setor", "Trabalhadores", "Disp. gênero (aj.)", "Disp. raça (aj.)",
                         "Sem ensino médio", "Índice", "Público-alvo"]),
        "",
    ]

    linhas = [
        (p.nome_cluster, _num(p.total_trabalhadores, 0), f"{_num(p.disparidade_genero_ajustada)}%",
         f"{_num(p.disparidade_raca_ajustada)}%", f"{_num(p.perc_baixa_qualificacao)}%",
         f"{_num(p.ganho_qualificacao)}%", _num(p.indice_prioridade), p.publico_alvo)
        for p in perfis.itertuples()
    ]
    partes += [
        "## Perfis de trabalhadores prioritários", "",
        "Calculado só com quem está fora da administração pública (o público que a capacitação alcança).", "",
        _tabela(linhas, ["Perfil", "Trabalhadores", "Disp. gênero (aj.)", "Disp. raça (aj.)", "Sem ensino médio",
                         "Ganho c/ ensino médio", "Índice", "Público-alvo"]),
        "",
    ]

    partes += [
        "## Peso de cada fator na renda (SHAP)", "",
        _tabela([(grupo, f"{_num(peso)}%") for grupo, peso in pesos.items()], ["Fator", "Peso"]),
        "",
    ]

    partes += [
        "## Como o índice de prioridade é calculado", "",
        "O modelo LightGBM do passo 3 faz três simulações com cada trabalhador real, mudando uma única característica:",
        "",
        "1. **Desigualdade** — salário previsto de cada mulher *se fosse homem* e de cada pessoa negra *se fosse "
        "branca*. Em cada nicho: disparidade ajustada × participação do grupo.",
        f"2. **Retorno da qualificação** — salário previsto de quem tem até o ensino médio incompleto "
        f"(escolaridade ≤ {ESCOLARIDADE_BAIXA_MAX}) *se tivesse concluído o ensino médio*. Em cada nicho: "
        "ganho médio × participação desse público.",
        "3. **Escala** — número de trabalhadores do nicho.",
        "",
        "Cada componente vira um percentil (0 a 1) entre os nichos e o índice é a soma ponderada × 100: "
        + ", ".join(f"{NOMES_COMPONENTES[nome]} {round(peso * 100)}%" for nome, peso in PESOS_INDICE.items()) + ".",
        f"Prioridade **Alta** = {round((1 - CORTE_ALTA) * 100)}% maiores índices; "
        f"**Média** = {round((CORTE_ALTA - CORTE_MEDIA) * 100)}% seguintes; **Baixa** = restante.",
        "",
        "A **administração pública** fica fora do índice (prioridade \"Não se aplica\"): os salários são definidos "
        "por lei e plano de carreira, então cursos de capacitação não mudam a renda como no setor privado.",
        "",
        "## Limitações", "",
        "- A disparidade ajustada mede o que sobra comparando perfis iguais. Não prova discriminação (há fatores "
        "que a RAIS não registra) e não inclui a desigualdade de acesso à escolaridade e aos cargos.",
        "- O retorno da qualificação muda só a escolaridade, mantendo a ocupação. O ganho real tende a ser maior "
        "se a capacitação também permitir mudar de cargo.",
        "- A RAIS cobre apenas o mercado formal.",
        "- Os pesos do índice (40/35/25) são uma escolha de política pública e podem ser ajustados em "
        "`Pipeline/src/diagnostico.py`.",
        "",
    ]
    return "\n".join(partes)
