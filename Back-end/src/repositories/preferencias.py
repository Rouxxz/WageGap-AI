PREFS_PADRAO = {
    "idioma": "pt-BR",
    "tema": "light",
    "notif_dados": True,
    "notif_resumo": False,
    "dois_fatores": False,
}

def buscar(cursor, user_id):
    # usuário sem linha na tabela usa os valores padrão
    cursor.execute(
        "SELECT idioma, tema, notif_dados, notif_resumo, dois_fatores FROM preferencias WHERE id_usuario = %s",
        (user_id,)
    )
    row = cursor.fetchone()
    if not row:
        return dict(PREFS_PADRAO)
    return {
        "idioma": row["idioma"],
        "tema": row["tema"],
        "notif_dados": bool(row["notif_dados"]),
        "notif_resumo": bool(row["notif_resumo"]),
        "dois_fatores": bool(row["dois_fatores"]),
    }

def salvar(cursor, user_id, prefs):
    cursor.execute("""
        REPLACE INTO preferencias (id_usuario, idioma, tema, notif_dados, notif_resumo, dois_fatores)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (user_id, prefs["idioma"], prefs["tema"], prefs["notif_dados"],
          prefs["notif_resumo"], prefs["dois_fatores"]))
