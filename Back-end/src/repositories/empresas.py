def criar(cursor, razao_social, cnpj):
    cursor.execute("INSERT INTO empresas (razao_social, cnpj) VALUES (%s, %s)", (razao_social, cnpj))
    return cursor.lastrowid

def cnpj_existe(cursor, cnpj):
    cursor.execute("SELECT id_empresa FROM empresas WHERE cnpj = %s", (cnpj,))
    return cursor.fetchone() is not None

def excluir_se_sem_usuarios(cursor, id_empresa):
    # cada empresa tem um usuário: quando ele sai, a empresa sai junto
    cursor.execute(
        "DELETE FROM empresas WHERE id_empresa = %s "
        "AND NOT EXISTS (SELECT 1 FROM usuarios WHERE id_empresa = %s)",
        (id_empresa, id_empresa)
    )
