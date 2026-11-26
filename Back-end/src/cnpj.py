# Validação de CNPJ. Nada aqui acessa o banco.
# Aceita o formato numérico e o alfanumérico (Receita Federal, a partir de 2026):
# 12 caracteres de letras ou números + 2 dígitos verificadores numéricos.
# Cada caractere vale o código ASCII menos 48 ("0" = 0, "A" = 17), então o
# cálculo é o mesmo para os dois formatos.
import re

_PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
_PESOS_DV2 = [6] + _PESOS_DV1


def _digito(base):
    pesos = _PESOS_DV1 if len(base) == 12 else _PESOS_DV2
    soma = sum((ord(c) - 48) * p for c, p in zip(base, pesos))
    resto = soma % 11
    return "0" if resto < 2 else str(11 - resto)


def normalizar(cnpj):
    # "12.abc.345/01de-35" -> "12ABC34501DE35" (sem pontuação, maiúsculo)
    return re.sub(r"[.\-/\s]", "", cnpj or "").upper()


def valido(cnpj):
    limpo = normalizar(cnpj)
    if not re.fullmatch(r"[0-9A-Z]{12}[0-9]{2}", limpo):
        return False
    if len(set(limpo)) == 1:  # 00000000000000, 11111111111111...
        return False
    dv1 = _digito(limpo[:12])
    dv2 = _digito(limpo[:12] + dv1)
    return limpo[12:] == dv1 + dv2


def formatar(cnpj):
    # forma guardada no banco: "12.345.678/0001-95" (18 caracteres)
    c = normalizar(cnpj)
    return f"{c[:2]}.{c[2:5]}.{c[5:8]}/{c[8:12]}-{c[12:]}"
