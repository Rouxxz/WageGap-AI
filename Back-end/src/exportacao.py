# Monta o CSV de "exportar meus dados"
import csv
import io

def gerar_csv_export(user, prefs, ranking, clusters):
    # ";" para abrir direto no Excel em português
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")

    writer.writerow(["# Perfil"])
    writer.writerow(["nome", "email", "razao_social", "cnpj"])
    writer.writerow([user["nome"], user["email"], user.get("razao_social") or "", user.get("cnpj") or ""])
    writer.writerow([])

    writer.writerow(["# Preferências"])
    writer.writerow(list(prefs.keys()))
    writer.writerow(list(prefs.values()))
    writer.writerow([])

    writer.writerow(["# Ranking de disparidade"])
    writer.writerow(["municipio", "uf", "setor", "total_trabalhadores", "indice_disparidade", "prioridade_politica"])
    for r in ranking:
        writer.writerow([r["municipio"], r["uf"], r["setor"], r["total_trabalhadores"],
                         r["indice_disparidade"], r["prioridade_politica"]])
    writer.writerow([])

    writer.writerow(["# Clusters"])
    writer.writerow(["nome_cluster", "descricao", "media_salarial_homens", "media_salarial_mulheres", "disparidade_percentual"])
    for c in clusters:
        writer.writerow([c["nome_cluster"], c["descricao"], c["media_salarial_homens"],
                         c["media_salarial_mulheres"], c["disparidade_percentual"]])

    # BOM para o Excel ler os acentos
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")
