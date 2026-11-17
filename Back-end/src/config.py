import os
from contextlib import contextmanager

import pymysql

def get_db_connection():
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'database'), # 'database' é o serviço MySQL no Docker
        user=os.getenv('DB_USER', 'dev_user'),
        password=os.getenv('DB_PASSWORD', 'devpassword'),
        database=os.getenv('DB_NAME', 'wagegap_db'),
        port=int(os.getenv('DB_PORT', 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )

@contextmanager
def conexao():
    # Entrega um cursor pronto. Se o bloco terminar sem erro faz commit,
    # se der erro desfaz tudo (rollback). A conexão é sempre fechada.
    #
    #   with conexao() as cursor:
    #       cursor.execute("SELECT ...")
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
