"""Passo 1: download da RAIS (FTP do MTE) e da lista de municípios do IBGE."""
import json
import shutil
import urllib.request

import py7zr

from src.config import IBGE_MUNICIPIOS_URL, INTERIM_DIR, RAIS_FTP, RAW_DIR


def baixar(url, destino):
    # os arquivos da RAIS são grandes, então não baixa de novo
    if destino.exists():
        print(f"  já baixado: {destino.name}")
        return destino

    destino.parent.mkdir(parents=True, exist_ok=True)
    temporario = destino.with_suffix(destino.suffix + ".part")
    print(f"  baixando {url}")
    with urllib.request.urlopen(url) as resposta, open(temporario, "wb") as arquivo:
        shutil.copyfileobj(resposta, arquivo)
    temporario.rename(destino)
    return destino


def baixar_rais(ano, regiao):
    url = RAIS_FTP.format(ano=ano, regiao=regiao)
    return baixar(url, RAW_DIR / str(ano) / f"RAIS_VINC_PUB_{regiao}.7z")


def extrair_rais(arquivo_7z, ano):
    destino = INTERIM_DIR / str(ano)
    with py7zr.SevenZipFile(arquivo_7z) as z:
        nome = z.getnames()[0]
        csv = destino / nome
        if csv.exists():
            print(f"  já extraído: {nome}")
            return csv
        print(f"  extraindo {nome}")
        z.extractall(destino)
    return csv


def carregar_municipios_ibge():
    # a RAIS usa o código do IBGE sem o último dígito
    arquivo = baixar(IBGE_MUNICIPIOS_URL, RAW_DIR / "municipios_ibge.json")
    dados = json.loads(arquivo.read_text(encoding="utf-8"))
    return {m["id"] // 10: (m["nome"], _sigla_uf(m)) for m in dados}


def _sigla_uf(municipio):
    # municípios novos vêm sem microrregião
    if municipio.get("microrregiao"):
        return municipio["microrregiao"]["mesorregiao"]["UF"]["sigla"]
    return municipio["regiao-imediata"]["regiao-intermediaria"]["UF"]["sigla"]
