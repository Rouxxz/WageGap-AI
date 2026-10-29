-- Criação da base de dados e seleção
CREATE DATABASE IF NOT EXISTS wagegap_db;
USE wagegap_db;

-- 1. Tabela de Empresas (B2B / Clientes)
CREATE TABLE IF NOT EXISTS empresas (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Usuários (com vínculo à Empresa)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE SET NULL
);

-- 2.1 Preferências do usuário
CREATE TABLE IF NOT EXISTS preferencias (
    id_usuario INT PRIMARY KEY,
    idioma VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    tema VARCHAR(10) NOT NULL DEFAULT 'light',
    notif_dados BOOLEAN NOT NULL DEFAULT TRUE,
    notif_resumo BOOLEAN NOT NULL DEFAULT FALSE,
    dois_fatores BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Tabela de Clusters
CREATE TABLE IF NOT EXISTS clusters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cluster VARCHAR(100) NOT NULL,
    descricao TEXT,
    media_salarial_homens DECIMAL(10,2),
    media_salarial_mulheres DECIMAL(10,2),
    disparidade_percentual DECIMAL(5,2),
    -- preenchidas pelo pipeline
    total_trabalhadores INT NULL,
    perc_mulheres DECIMAL(5,2) NULL,
    perc_negros DECIMAL(5,2) NULL,
    idade_media DECIMAL(5,1) NULL,
    escolaridade_predominante VARCHAR(60) NULL,
    ocupacao_predominante VARCHAR(80) NULL,
    setor_predominante VARCHAR(80) NULL,
    disparidade_raca DECIMAL(6,2) NULL,
    ano INT NULL,
    regiao VARCHAR(20) NULL,
    numero INT NULL
);

-- 4. Tabela de Municípios
CREATE TABLE IF NOT EXISTS municipios (
    id_municipio INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL
);

-- 5. Tabela de Setores
CREATE TABLE IF NOT EXISTS setores (
    id_setor INT AUTO_INCREMENT PRIMARY KEY,
    nome_setor VARCHAR(100) NOT NULL
);

-- 6. Tabela de Registros Salariais (para o Ranking)
CREATE TABLE IF NOT EXISTS registros_salariais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_municipio INT NOT NULL,
    id_setor INT NOT NULL,
    total_trabalhadores INT NOT NULL,
    indice_disparidade DECIMAL(5,2) NOT NULL,
    prioridade_politica VARCHAR(50) NOT NULL,
    ano INT NOT NULL DEFAULT 2024,
    salario_medio_homens DECIMAL(10,2) NULL,
    salario_medio_mulheres DECIMAL(10,2) NULL,
    disparidade_raca DECIMAL(6,2) NULL,
    -- diagnóstico (pipeline, passo 4)
    indice_prioridade DECIMAL(5,1) NULL,
    disparidade_genero_ajustada DECIMAL(6,2) NULL,
    disparidade_raca_ajustada DECIMAL(6,2) NULL,
    perc_baixa_qualificacao DECIMAL(5,2) NULL,
    ganho_qualificacao DECIMAL(6,2) NULL,
    publico_alvo VARCHAR(80) NULL,
    perda_mensal_genero DECIMAL(14,2) NULL,
    ganho_mensal_qualificacao DECIMAL(14,2) NULL,
    FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio),
    FOREIGN KEY (id_setor) REFERENCES setores(id_setor)
);

-- 7. Explicabilidade (pipeline). cluster_numero NULL = recorte inteiro
CREATE TABLE IF NOT EXISTS shap_pesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ano INT NOT NULL,
    regiao VARCHAR(20) NOT NULL,
    cluster_numero INT NULL,
    grupo VARCHAR(40) NOT NULL,
    peso_percentual DECIMAL(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS efeitos_ajustados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ano INT NOT NULL,
    regiao VARCHAR(20) NOT NULL,
    cluster_numero INT NULL,
    variavel VARCHAR(20) NOT NULL,
    bruta DECIMAL(6,2) NULL,
    ajustada DECIMAL(6,2) NULL,
    ic95_min DECIMAL(6,2) NULL,
    ic95_max DECIMAL(6,2) NULL,
    efeito_shap DECIMAL(6,2) NULL
);

-- INSERÇÃO DE DADOS DE TESTE (SEEDING)

-- Inserir Empresa de Teste
INSERT INTO empresas (razao_social, cnpj) VALUES
('Tech Corp Solucoes LTDA', '12.345.678/0001-90');

-- Inserir Usuário Administrador vinculado à Empresa
INSERT INTO usuarios (id_empresa, nome, email, senha) VALUES
(1, 'Administrador', 'admin@wagegap.ai', '123456');

-- Inserir Clusters
INSERT INTO clusters (nome_cluster, descricao, media_salarial_homens, media_salarial_mulheres, disparidade_percentual) VALUES
('Grupo 1 - Alta Tecnologia', 'Setor de TI e Engenharia com alta disparidade em cargos executivos', 8500.00, 6200.00, 27.06),
('Grupo 2 - Industria Transformadora', 'Industria pesada com predominio masculino e disparidade moderada', 4200.00, 3400.00, 19.05),
('Grupo 3 - Servicos e Comercio', 'Setor com elevada presenca feminina, mas disparidade em salarios base', 2800.00, 2200.00, 21.43),
('Grupo 4 - Saude e Educacao', 'Setor publico/privado com disparidade reduzida em cargos operacionais', 5100.00, 4700.00, 7.84);

-- Inserir Municípios
INSERT INTO municipios (nome, uf) VALUES
('Sao Paulo', 'SP'),
('Rio de Janeiro', 'RJ'),
('Belo Horizonte', 'MG'),
('Porto Alegre', 'RS'),
('Salvador', 'BA');

-- Inserir Setores
INSERT INTO setores (nome_setor) VALUES
('Tecnologia da Informacao'),
('Construcao Civil'),
('Comercio Varejista'),
('Saude e Medicina'),
('Educacao Superior');

-- Inserir Registros Salariais para o Ranking
INSERT INTO registros_salariais (id_municipio, id_setor, total_trabalhadores, indice_disparidade, prioridade_politica) VALUES
(1, 1, 45000, 31.50, 'Alta'),
(2, 2, 28000, 28.10, 'Alta'),
(1, 3, 62000, 22.40, 'Media'),
(3, 4, 19000, 15.80, 'Media'),
(4, 1, 15000, 24.90, 'Alta'),
(5, 5, 12000, 8.20, 'Baixa');