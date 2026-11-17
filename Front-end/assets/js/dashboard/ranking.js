/*
  ranking.js — tela "Ranking" (GET /api/ranking)
  A tabela é montada com textContent para não interpretar HTML vindo do banco.
*/

// o banco grava sem acento
const PRIORIDADES = {
    'alta':  { classe: 'high', texto: 'Alta' },
    'media': { classe: 'mid',  texto: 'Média' },
    'média': { classe: 'mid',  texto: 'Média' },
    'baixa': { classe: 'low',  texto: 'Baixa' },
    'nao se aplica': { classe: 'na', texto: 'Não se aplica' }
};


function mensagemRanking(tbody, texto) {
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = criarCelula(texto);
    td.colSpan = 7;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

async function loadRanking() {
    const tbody = document.getElementById('ranking-body');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_URL}/ranking${queryRecorte()}`);
        if (!response.ok) throw new Error('Erro ao buscar Ranking');

        const ranking = await response.json();

        if (ranking.length === 0) {
            mensagemRanking(tbody, 'Nenhum registro encontrado para este recorte.');
            return;
        }

        tbody.innerHTML = '';

        ranking.forEach((item, index) => {
            const tr = document.createElement('tr');

            // destaque para o top 3
            if (index < 3 && item.indice_prioridade !== null) tr.classList.add('top');

            const tdRank = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = 'rank-badge';
            badge.textContent = index + 1;
            tdRank.appendChild(badge);
            tr.appendChild(tdRank);

            tr.appendChild(criarCelula(item.uf ? `${item.municipio} (${item.uf})` : item.municipio));
            const tdSetor = criarCelula(item.setor);
            if (item.publico_alvo) {
                const publico = document.createElement('div');
                publico.className = 'cell-sub';
                publico.textContent = `Público-alvo: ${item.publico_alvo}`;
                tdSetor.appendChild(publico);
            }
            tr.appendChild(tdSetor);

            tr.appendChild(criarCelula(formatarNumero(item.total_trabalhadores), 'num'));

            // ajustada se tiver, senão a bruta
            const disparidade = item.disparidade_genero_ajustada ?? item.indice_disparidade;
            tr.appendChild(criarCelula(formatarNumero(disparidade, 1) + '%', 'num'));
            tr.appendChild(criarCelula(
                item.indice_prioridade === null ? '—' : formatarNumero(item.indice_prioridade, 1), 'num'
            ));

            const prioridade = PRIORIDADES[String(item.prioridade_politica).toLowerCase()]
                || { classe: 'mid', texto: item.prioridade_politica };
            const tdPrioridade = document.createElement('td');
            const pill = document.createElement('span');
            pill.className = `pill ${prioridade.classe}`;
            pill.textContent = prioridade.texto;
            tdPrioridade.appendChild(pill);
            tr.appendChild(tdPrioridade);

            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar Ranking:', error);
        mensagemRanking(tbody, 'Não foi possível carregar o ranking. Verifique a conexão com a API.');
    }
}
