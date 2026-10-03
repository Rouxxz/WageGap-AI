USE wagegap_db;

CREATE TABLE estados (
    id_uf VARCHAR(2) PRIMARY KEY, 
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE setores (
    id_setor INT AUTO_INCREMENT PRIMARY KEY,
    nome_setor VARCHAR(100) NOT NULL
);

CREATE TABLE municipios (
    id_municipio INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    id_uf VARCHAR(2) NOT NULL,
    FOREIGN KEY (id_uf) REFERENCES estados(id_uf)
);

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

CREATE TABLE registros_salariais (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    ano INT NOT NULL,
    id_municipio INT NOT NULL,
    id_setor INT NOT NULL,
    id_cluster INT NOT NULL,
    total_trabalhadores INT NOT NULL,
    renda_media DECIMAL(10,2) NOT NULL,
    indice_disparidade DECIMAL(5,2) NOT NULL, 
    prioridade_politica VARCHAR(10) CHECK (prioridade_politica IN ('Alta', 'Média', 'Baixa')),
    FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio),
    FOREIGN KEY (id_setor) REFERENCES setores(id_setor),
    FOREIGN KEY (id_cluster) REFERENCES clusters(id_cluster)
);