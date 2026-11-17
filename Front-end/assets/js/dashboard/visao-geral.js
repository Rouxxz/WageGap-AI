/*
  visao-geral.js — tela "Visão geral": os 4 cartões de KPI (GET /api/kpis)
*/

function preencherKPI(id, valor, unidade = '') {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = valor;

    if (unidade) {
        const small = document.createElement('small');
        small.textContent = unidade;
        el.appendChild(small);
    }
}

// Busca os KPIs no FastAPI
async function loadKPIs() {
    try {
        const response = await fetch(`${API_URL}/kpis${queryRecorte()}`);
        if (!response.ok) throw new Error('Erro ao buscar KPIs');

        const kpis = await response.json();

        preencherKPI('kpi-disparidade', formatarNumero(kpis.disparidade_media, 1), '%');
        preencherKPI('kpi-municipios', formatarNumero(kpis.municipios_analisados));

        const estadosEl = document.getElementById('kpi-estados');
        if (estadosEl) {
            estadosEl.textContent = kpis.total_estados
                ? `em ${kpis.total_estados} ${kpis.total_estados === 1 ? 'estado' : 'estados'}`
                : '';
        }
        preencherKPI('kpi-clusters', formatarNumero(kpis.clusters_identificados));

        // abrevia (1,2M / 181K); o Number() tira o ",0"
        const total = kpis.trabalhadores_cobertos;
        if (total >= 1000000) {
            preencherKPI('kpi-trabalhadores', Number((total / 1000000).toFixed(1)).toLocaleString('pt-BR'), 'M');
        } else if (total >= 1000) {
            preencherKPI('kpi-trabalhadores', Number((total / 1000).toFixed(1)).toLocaleString('pt-BR'), 'K');
        } else {
            preencherKPI('kpi-trabalhadores', formatarNumero(total));
        }
    } catch (error) {
        console.error('Erro ao carregar KPIs:', error);
    }
}
