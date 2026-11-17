def criar(cursor, razao_social, cnpj):
    cursor.execute("INSERT INTO empresas (razao_social, cnpj) VALUES (%s, %s)", (razao_social, cnpj))
    return cursor.lastrowid
