/*
  filtros.js — filtros de UF, setor e ano (barra do topo)
  As opções vêm de GET /api/filtros. queryRecorte() monta a query usada
  pelos KPIs (visao-geral.js) e pelo ranking (ranking.js).
*/

// ---- Filtros ----

const UF_NOMES = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
    CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
    MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
    PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
    RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
    RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
    SE: 'Sergipe', TO: 'Tocantins'
};

const filtroUf = document.getElementById('f-uf');
const filtroSetor = document.getElementById('f-setor');
const filtroAno = document.getElementById('f-ano');


// as opções vêm do banco
async function loadFiltros() {
    try {
        const response = await fetch(`${API_URL}/filtros`);
        if (!response.ok) throw new Error('Erro ao buscar filtros');

        const filtros = await response.json();

        // deixa só o "Todos"
        [filtroUf, filtroSetor, filtroAno].forEach(select => {
            select.length = 1;
        });

        filtros.ufs.forEach(uf => {
            adicionarOpcao(filtroUf, uf, UF_NOMES[uf] ? `${UF_NOMES[uf]} (${uf})` : uf);
        });
        filtros.setores.forEach(setor => {
            adicionarOpcao(filtroSetor, setor.id_setor, setor.nome_setor);
        });
        filtros.anos.forEach(ano => {
            adicionarOpcao(filtroAno, ano, ano);
        });
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

// ex: "?uf=SP&ano=2024"
function queryRecorte() {
    const params = new URLSearchParams();
    if (filtroUf.value) params.set('uf', filtroUf.value);
    if (filtroSetor.value) params.set('setor', filtroSetor.value);
    if (filtroAno.value) params.set('ano', filtroAno.value);

    const query = params.toString();
    return query ? `?${query}` : '';
}

// texto do "Recorte ativo" na barra lateral
function atualizarRecorteAtivo() {
    const el = document.getElementById('recorte-ativo');
    if (!el) return;

    const partes = [];
    if (filtroUf.value) partes.push(UF_NOMES[filtroUf.value] || filtroUf.value);
    if (filtroSetor.value) partes.push(filtroSetor.selectedOptions[0].textContent);
    if (filtroAno.value) partes.push(filtroAno.value);

    el.textContent = partes.length ? partes.join(' · ') : t('filter.all');
}

document.getElementById('btn-apply-filters').addEventListener('click', () => {
    atualizarRecorteAtivo();
    loadKPIs();
    loadRanking();
});
