# Tokens de recuperação de senha. Guarda só o hash do token (ver security.py).
# O prazo usa o relógio do MySQL (NOW()) na criação e na conferência,
# para não depender do fuso horário do container da API.

def criar(cursor, user_id, token_hash, validade_min):
    # um link por vez: pedir de novo invalida o anterior
    excluir_do_usuario(cursor, user_id)
    cursor.execute(
        "INSERT INTO tokens_recuperacao (id_usuario, token_hash, expira_em) "
        "VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL %s MINUTE))",
        (user_id, token_hash, validade_min)
    )

def buscar_valido(cursor, token_hash):
    cursor.execute(
        "SELECT id, id_usuario FROM tokens_recuperacao WHERE token_hash = %s AND expira_em > NOW()",
        (token_hash,)
    )
    return cursor.fetchone()

def excluir_do_usuario(cursor, user_id):
    cursor.execute("DELETE FROM tokens_recuperacao WHERE id_usuario = %s", (user_id,))
