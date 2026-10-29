# Pipeline de dados — WageGap AI

Transforma os microdados da RAIS em perfis de trabalhadores (clusters) e
nichos de mercado com disparidade salarial, e grava o resultado no MySQL
que o dashboard lê.

## Fontes de dados

| Dado | Link | Uso |
|---|---|---|
| RAIS Vínculos 2024 (microdados) | <ftp://ftp.mtps.gov.br/pdet/microdados/RAIS/2024/> | Um registro por vínculo de emprego formal |
| Dicionário de dados da RAIS | <ftp://ftp.mtps.gov.br/pdet/microdados/RAIS/Layouts/v%EDnculos/RAIS_vinculos_layout.xls> | Significado dos códigos (sexo, raça, escolaridade…) |
| Página oficial (MTE) | <https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/microdados-rais-e-caged> | Documentação e comunicados |
| Municípios (IBGE) | <https://servicodados.ibge.gov.br/api/v1/localidades/municipios> | Nome oficial e UF de cada código de município |
| Seções da CNAE 2.0 (IBGE/CONCLA) | <https://concla.ibge.gov.br/> | Agrupamento das atividades em 21 setores |

Os arquivos da RAIS são divididos por região: `NORTE` (196 MB), `CENTRO_OESTE`,
`NORDESTE`, `SUL`, `SP` (1 GB) e `MG_ES_RJ`. O script baixa sozinho o que precisar.

## Como rodar

Na raiz do projeto, com o Docker rodando:

```bash
docker compose run --rm pipeline python -m src.run --ano 2024 --regiao NORTE
```

Opções:

- `--regiao` — `NORTE`, `NORDESTE`, `CENTRO_OESTE`, `SUL`, `SP` ou `MG_ES_RJ`
- `--k` — número de clusters (padrão `8`) ou `auto` para escolher pelo silhouette
- `--sem-banco` — só gera os arquivos, sem gravar no MySQL
- `--incluir-adm-publica` — inclui a administração pública no índice de prioridade

## Etapas

1. **Coleta e limpeza** (`extrair.py`, `limpar.py`)
   - Mantém vínculos ativos em 31/12, com sexo, raça, escolaridade, jornada e remuneração válidos.
   - Exclui trabalho intermitente e valores extremos de salário/hora (abaixo de metade do 1º percentil e acima do 99,9º).
   - Calcula o **salário por hora** = remuneração média mensal ÷ (horas semanais × 4,345), para comparar jornadas diferentes.
   - Agrupa raça em Branca / Negra (preta + parda, convenção do IBGE) / outras.

2. **Segmentação de perfis** (`clusters.py`)
   - K-Means sobre escolaridade, idade, jornada, porte da empresa, tempo de emprego, grande grupo da ocupação (CBO) e macrossetor.
   - **Sexo e raça ficam fora do agrupamento de propósito**: cada cluster reúne perfis profissionais parecidos, e a diferença salarial entre homens e mulheres (ou brancos e negros) dentro dele não é explicada por esses fatores.
   - Disparidade = (mediana do salário/hora do grupo de referência − mediana do grupo comparado) ÷ mediana de referência. Usa mediana para que poucos salários muito altos não distorçam o resultado.
   - Nichos = município × setor, com pelo menos 100 homens e 100 mulheres.

3. **Regressão e explicabilidade** (`explicar.py`)
   - **Regressão linear (equação de Mincer, statsmodels)** sobre o log do salário/hora, numa amostra de 500 mil vínculos.
     - *Bruta*: só sexo e raça no modelo.
     - *Ajustada*: com escolaridade, idade, idade², tempo de emprego, jornada, ocupação (subgrupo CBO), setor, porte e UF.
     - Disparidade = `-(e^coeficiente - 1)`, com intervalo de confiança de 95%. Calculada no geral e em cada cluster.
   - **LightGBM + SHAP**: modelo de árvores treinado com os mesmos fatores (80% treino / 20% teste). O `shap.TreeExplainer` calcula a contribuição de cada fator para cada pessoa (2 mil por cluster).
     - O peso de cada grupo de fatores (qualificação, gênero, localização, raça, experiência, setor e empresa, jornada) é a média do |SHAP|, em % do total.

4. **Diagnóstico: onde capacitar** (`diagnostico.py`, `relatorio.py`)
   - O LightGBM do passo 3 faz três simulações com cada trabalhador real, mudando uma única característica:
     - mulheres *como se fossem homens*;
     - pessoas negras *como se fossem brancas*;
     - quem tem até ensino médio incompleto *como se tivesse concluído*.
   - Em cada nicho, isso vira três componentes, convertidos em percentil e combinados num **índice de prioridade (0–100)**:
     - desigualdade (40%): disparidade ajustada × participação do grupo;
     - retorno da qualificação (35%): ganho médio × participação do público;
     - escala (25%): nº de trabalhadores.
   - Prioridade: Alta = 20% maiores índices, Média = 30% seguintes, Baixa = resto.
   - A administração pública fica fora do índice ("Não se aplica"), porque os salários são definidos por lei; use `--incluir-adm-publica` para mudar isso.
   - Cada nicho recebe um **público-alvo** (ex: "Mulheres negras com até ensino médio incompleto") e estimativas em R$: perda mensal das mulheres e ganho mensal com a qualificação.
   - Pesos e limites ficam no topo de `diagnostico.py`.

5. **Resultados** (`carregar.py`)
   - `data/output/<ano>_<regiao>/`: **`diagnostico.md`** (relatório pronto para a apresentação), `nichos.csv` (com índice e público-alvo), `perfis_prioritarios.csv`, `clusters.csv`, `disparidade_escolaridade.csv`, `shap_pesos.csv`, `explicabilidade.json`, `resumo.json`.
   - MySQL: tabelas `clusters`, `municipios`, `setores`, `registros_salariais`, `shap_pesos` e `efeitos_ajustados`.

## Limitações conhecidas

- A disparidade dos nichos é **bruta**: compara homens e mulheres do mesmo município e setor, mas não do mesmo cargo. A ajustada existe no geral e por cluster (passo 3), ainda não por nicho.
- A disparidade ajustada mede o que **sobra** depois de comparar perfis iguais. Ela não prova discriminação, porque pode haver fatores que a RAIS não registra; mas também não captura a desigualdade no acesso à escolaridade e aos cargos, que já está "dentro" dos controles.
- O peso da **jornada** no SHAP é em parte mecânico, porque o salário é medido por hora.
- O retorno da qualificação muda só a escolaridade, mantendo o cargo; o ganho real tende a ser maior se a capacitação também permitir mudar de ocupação.
- Os pesos do índice (40/35/25) são uma escolha de política pública, não um resultado estatístico.
