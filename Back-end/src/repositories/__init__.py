# Acesso ao banco. Cada função recebe um cursor aberto (ver config.conexao)
# e só executa SQL: nada de HTTP aqui. Por isso pode ser reaproveitada por
# scripts internos sem passar pela API.
