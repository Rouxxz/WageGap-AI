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

-- 3. Tabela de Clusters
CREATE TABLE IF NOT EXISTS clusters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_cluster VARCHAR(100) NOT NULL,
    descricao TEXT,
    media_salarial_homens DECIMAL(10,2),
    media_salarial_mulheres DECIMAL(10,2),
    disparidade_percentual DECIMAL(5,2)
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
    FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio),
    FOREIGN KEY (id_setor) REFERENCES setores(id_setor)
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