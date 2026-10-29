"""Códigos da RAIS (fonte: RAIS_vinculos_layout.xls) e seções da CNAE 2.0 (IBGE)."""

# colunas do CSV da RAIS 2024
COLUNAS_RAIS = {
    "Ind Vínculo Ativo 31/12 - Código": "ativo",
    "CBO 2002 Ocupação - Código": "cbo",
    "CNAE 2.0 Classe - Código": "cnae_classe",
    "Escolaridade Após 2005 - Código": "escolaridade",
    "Qtd Hora Contr": "horas",
    "Idade": "idade",
    "Município - Código": "municipio",
    "Raça Cor - Código": "raca",
    "Vl Rem Média Nom": "remuneracao",
    "Sexo - Código": "sexo",
    "Tamanho Estabelecimento - Código": "tamanho_estab",
    "Tempo Emprego": "tempo_emprego",
    "Ind Trabalho Intermitente - Código": "intermitente",
}

SEXO = {1: "Masculino", 2: "Feminino"}

RACA = {1: "Indígena", 2: "Branca", 4: "Preta", 6: "Amarela", 8: "Parda", 9: "Não identificada"}

# preta + parda = negra (padrão do IBGE)
RACA_GRUPO = {1: "Indígena", 2: "Branca", 4: "Negra", 6: "Amarela", 8: "Negra", 9: "Não informada"}

ESCOLARIDADE = {
    1: "Analfabeto",
    2: "Até 5º ano incompleto",
    3: "5º ano completo",
    4: "6º ao 9º ano",
    5: "Fundamental completo",
    6: "Médio incompleto",
    7: "Médio completo",
    8: "Superior incompleto",
    9: "Superior completo",
    10: "Mestrado",
    11: "Doutorado",
}

# faixas mais largas, para os relatórios
ESCOLARIDADE_GRUPO = {
    1: "Fundamental incompleto", 2: "Fundamental incompleto", 3: "Fundamental incompleto", 4: "Fundamental incompleto",
    5: "Fundamental completo", 6: "Fundamental completo",
    7: "Médio completo", 8: "Médio completo",
    9: "Superior completo",
    10: "Pós-graduação", 11: "Pós-graduação",
}

ORDEM_ESCOLARIDADE_GRUPO = [
    "Fundamental incompleto", "Fundamental completo", "Médio completo", "Superior completo", "Pós-graduação",
]

# grandes grupos da CBO (1º dígito)
CBO_GRANDE_GRUPO = {
    0: "Forças armadas, policiais e bombeiros",
    1: "Dirigentes e gerentes",
    2: "Profissionais das ciências e das artes",
    3: "Técnicos de nível médio",
    4: "Serviços administrativos",
    5: "Serviços e comércio",
    6: "Agropecuária, florestal e pesca",
    7: "Produção industrial",
    8: "Operação de máquinas industriais",
    9: "Manutenção e reparação",
}

# (id, letra, nome, divisão inicial, divisão final)
SECOES_CNAE = [
    (1, "A", "Agropecuária, produção florestal e pesca", 1, 3),
    (2, "B", "Indústrias extrativas", 5, 9),
    (3, "C", "Indústrias de transformação", 10, 33),
    (4, "D", "Eletricidade e gás", 35, 35),
    (5, "E", "Água, esgoto e gestão de resíduos", 36, 39),
    (6, "F", "Construção", 41, 43),
    (7, "G", "Comércio e reparação de veículos", 45, 47),
    (8, "H", "Transporte, armazenagem e correio", 49, 53),
    (9, "I", "Alojamento e alimentação", 55, 56),
    (10, "J", "Informação e comunicação", 58, 63),
    (11, "K", "Atividades financeiras e seguros", 64, 66),
    (12, "L", "Atividades imobiliárias", 68, 68),
    (13, "M", "Atividades profissionais, científicas e técnicas", 69, 75),
    (14, "N", "Atividades administrativas e serviços complementares", 77, 82),
    (15, "O", "Administração pública, defesa e seguridade social", 84, 84),
    (16, "P", "Educação", 85, 85),
    (17, "Q", "Saúde humana e serviços sociais", 86, 88),
    (18, "R", "Artes, cultura, esporte e recreação", 90, 93),
    (19, "S", "Outras atividades de serviços", 94, 96),
    (20, "T", "Serviços domésticos", 97, 97),
    (21, "U", "Organismos internacionais", 99, 99),
]

# divisão (2 dígitos) -> seção
DIVISAO_PARA_SECAO = {
    divisao: id_secao
    for id_secao, _, _, inicio, fim in SECOES_CNAE
    for divisao in range(inicio, fim + 1)
}

SECAO_NOME = {id_secao: nome for id_secao, _, nome, _, _ in SECOES_CNAE}

# macrossetores usados no clustering
MACROSSETOR = {
    1: "Agropecuária",
    2: "Indústria", 3: "Indústria", 4: "Indústria", 5: "Indústria",
    6: "Construção",
    7: "Comércio",
    15: "Administração pública",
}  # demais seções: "Serviços"

MACROSSETORES = ["Agropecuária", "Indústria", "Construção", "Comércio", "Serviços", "Administração pública"]

# 2 primeiros dígitos do município -> UF
UF_POR_CODIGO = {
    11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
    21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
    31: "MG", 32: "ES", 33: "RJ", 35: "SP",
    41: "PR", 42: "SC", 43: "RS",
    50: "MS", 51: "MT", 52: "GO", 53: "DF",
}
