-- Seleciona e define o banco de dados 'wagegap_db' como o banco ativo para as operações seguintes
USE wagegap_db;

-- Cria a tabela 'empresas' para armazenar os dados das corporações clientes do SaaS (Multi-tenancy)
CREATE TABLE empresas (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo'))
);

-- Cria a tabela 'usuarios' para registrar o login e credenciais dos funcionários do RH vinculados às empresas
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, 
    perfil VARCHAR(20) DEFAULT 'Analista' CHECK (perfil IN ('Admin', 'Analista', 'Diretor')),
    status VARCHAR(10) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Suspenso')),
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso DATETIME,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE
);

-- Cria a tabela 'estados' para armazenar a sigla e o nome das Unidades Federativas
CREATE TABLE estados (
    id_uf VARCHAR(2) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

-- Cria a tabela 'setores' para armazenar os segmentos de atuação das empresas
CREATE TABLE setores (
    id_setor INT AUTO_INCREMENT PRIMARY KEY,
    nome_setor VARCHAR(100) NOT NULL
);

-- Cria a tabela 'municipios' para registrar as cidades associadas aos respectivos estados
CREATE TABLE municipios (
    id_municipio INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    id_uf VARCHAR(2) NOT NULL,
    FOREIGN KEY (id_uf) REFERENCES estados(id_uf)
);

-- Cria a tabela 'clusters' para armazenar os perfis socioeconômicos e pesos dos fatores SHAP gerados pela IA
CREATE TABLE clusters (
    id_cluster INT AUTO_INCREMENT PRIMARY KEY,
    codigo_cluster VARCHAR(10) NOT NULL,
    nome_perfil VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor_hex VARCHAR(7),
    impacto_qualificacao DECIMAL(4,2),
    impacto_genero DECIMAL(4,2),
    impacto_localizacao DECIMAL(4,2),
    impacto_raca DECIMAL(4,2)
);

-- Cria a tabela 'registros_salariais' para armazenar os dados de disparidade e renda média por empresa, setor e município
CREATE TABLE registros_salariais (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    ano INT NOT NULL,
    id_municipio INT NOT NULL,
    id_setor INT NOT NULL,
    id_cluster INT NOT NULL,
    total_trabalhadores INT NOT NULL,
    renda_media DECIMAL(10,2) NOT NULL,
    indice_disparidade DECIMAL(5,2) NOT NULL,
    prioridade_politica VARCHAR(10) CHECK (prioridade_politica IN ('Alta', 'Média', 'Baixa')),
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio),
    FOREIGN KEY (id_setor) REFERENCES setores(id_setor),
    FOREIGN KEY (id_cluster) REFERENCES clusters(id_cluster)
);

-- Insere os dados iniciais dos estados no banco de dados
INSERT INTO estados (id_uf, nome) VALUES 
('SP', 'São Paulo'),
('RJ', 'Rio de Janeiro'),
('BA', 'Bahia');

-- Insere os municípios vinculados aos estados cadastrados
INSERT INTO municipios (id_municipio, nome, id_uf) VALUES 
(1, 'São Paulo', 'SP'),
(2, 'Campinas', 'SP'),
(3, 'Salvador', 'BA');

-- Insere os setores de atuação inicial para classificação das métricas
INSERT INTO setores (id_setor, nome_setor) VALUES 
(1, 'Tecnologia da Informação'),
(2, 'Saúde e Serviços Sociais'),
(3, 'Indústria Transformadora');

-- Insere os perfis de clusters com suas repectivas métricas e pesos SHAP
INSERT INTO clusters (id_cluster, codigo_cluster, nome_perfil, descricao, cor_hex, impacto_qualificacao, impacto_genero, impacto_localizacao, impacto_raca) VALUES 
(1, 'Cluster A', 'Alta Qualificação / Desigualdade de Gênero Alta', 'Cargos técnicos e de gestão com disparidade de remuneração relevante entre homens e mulheres.', '#E74C3C', 0.45, 0.35, 0.10, 0.10),
(2, 'Cluster B', 'Serviços Gerais / Baixa Escolaridade', 'Setores operacionais com renda média mais reduzida e disparidade ligada a grau de instrução.', '#F39C12', 0.30, 0.20, 0.25, 0.25),
(3, 'Cluster C', 'Equidade Moderada', 'Setores com equilíbrio salarial mais próximo da média nacional.', '#2ECC71', 0.50, 0.15, 0.20, 0.15);

-- Insere uma empresa fictícia para testes do ambiente SaaS
INSERT INTO empresas (id_empresa, razao_social, cnpj, status) VALUES 
(1, 'TechCorp Soluções em Tecnologia Ltda', '12.345.678/0001-90', 'Ativo');

-- Insere usuários de teste (RH) vinculados à empresa criada para validação do login
INSERT INTO usuarios (id_usuario, id_empresa, nome, email, senha_hash, perfil, status) VALUES 
(1, 1, 'Ana Silva (RH)', 'ana.silva@techcorp.com.br', '$2a$12$eImiTXuWVxfM37uY4JANjOL.81F8R/Hj3Qy3fJ5q2tG3e1i7j2kK', 'Admin', 'Ativo'),
(2, 1, 'Carlos Oliveira (Analista)', 'carlos.oliveira@techcorp.com.br', '$2a$12$eImiTXuWVxfM37uY4JANjOL.81F8R/Hj3Qy3fJ5q2tG3e1i7j2kK', 'Analista', 'Ativo');

-- Insere registros de teste com dados de disparidade salarial vinculados à empresa fictícia
INSERT INTO registros_salariais (id_empresa, ano, id_municipio, id_setor, id_cluster, total_trabalhadores, renda_media, indice_disparidade, prioridade_politica) VALUES 
(1, 2025, 1, 1, 1, 150, 8500.00, 24.50, 'Alta'),
(1, 2025, 2, 1, 3, 80, 7200.00, 12.10, 'Baixa'),
(1, 2025, 3, 2, 2, 210, 3400.00, 18.30, 'Média');