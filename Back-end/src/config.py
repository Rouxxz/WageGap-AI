import os
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