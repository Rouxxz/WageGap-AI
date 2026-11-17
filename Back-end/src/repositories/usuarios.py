def buscar_por_email(cursor, email):
    cursor.execute("SELECT id, nome, email, senha, id_empresa FROM usuarios WHERE email = %s", (email,))
    return cursor.fetchone()

def buscar_por_id(cursor, user_id):
    cursor.execute("SELECT id, nome, email, senha, id_empresa FROM usuarios WHERE id = %s", (user_id,))
    return cursor.fetchone()

def email_existe(cursor, email):
    cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
    return cursor.fetchone() is not None

def criar(cursor, id_empresa, nome, email, senha_hash):
    cursor.execute(
        "INSERT INTO usuarios (id_empresa, nome, email, senha) VALUES (%s, %s, %s, %s)",
        (id_empresa, nome, email, senha_hash)
    )
    return cursor.lastrowid

def atualizar_senha(cursor, user_id, senha_hash):
    cursor.execute("UPDATE usuarios SET senha = %s WHERE id = %s", (senha_hash, user_id))

def excluir(cursor, user_id):
    cursor.execute("DELETE FROM preferencias WHERE id_usuario = %s", (user_id,))
    cursor.execute("DELETE FROM usuarios WHERE id = %s", (user_id,))
