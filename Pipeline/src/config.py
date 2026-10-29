import os
from pathlib import Path

import pymysql

# Pastas

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"              # downloads (RAIS, IBGE)
INTERIM_DIR = BASE_DIR / "data" / "interim"      # CSV extraído do .7z
PROCESSED_DIR = BASE_DIR / "data" / "processed"  # microdados limpos (.parquet)
OUTPUT_DIR = BASE_DIR / "data" / "output"        # resultados (vão para o git)

# Fontes

RAIS_FTP = "ftp://ftp.mtps.gov.br/pdet/microdados/RAIS/{ano}/RAIS_VINC_PUB_{regiao}.7z"
IBGE_MUNICIPIOS_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"

REGIOES = ["NORTE", "NORDESTE", "CENTRO_OESTE", "SUL", "SP", "MG_ES_RJ"]

# Banco (mesmas variáveis do back-end)

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "database"),
        user=os.getenv("DB_USER", "dev_user"),
        password=os.getenv("DB_PASSWORD", "devpassword"),
        database=os.getenv("DB_NAME", "wagegap_db"),
        port=int(os.getenv("DB_PORT", 3306)),
        cursorclass=pymysql.cursors.DictCursor,
    )
