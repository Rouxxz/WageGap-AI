/*
  clusters.js — tela "Clusters de perfis" (GET /api/clusters)
  Gráfico de bolhas em SVG desenhado à mão, cartões e conclusão em texto.
*/

// ---- Clusters ----

const SVG_NS = 'http://www.w3.org/2000/svg';

// margens dentro do viewBox
const GRAFICO = { largura: 480, altura: 320, esquerda: 46, direita: 14, topo: 14, base: 40 };

function criarSvg(tag, atributos) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(atributos).forEach(([nome, valor]) => el.setAttribute(nome, valor));
    return el;
}

// usa a ajustada; se não tiver, a bruta
function disparidadesDoPerfil(perfil) {
    return {
        genero: Number(perfil.disparidade_genero_ajustada ?? perfil.disparidade_percentual ?? 0),
        raca: Number(perfil.disparidade_raca_ajustada ?? perfil.disparidade_raca ?? 0)
    };
}

// arredonda para múltiplos de 5
function limitesEixo(valores) {
    const minimo = Math.min(0, Math.floor(Math.min(...valores) / 5) * 5);
    const maximo = Math.ceil((Math.max(...valores) + 1) / 5) * 5;
    return [minimo, maximo];
}

function destacarPerfil(numero, ativo) {
    document.querySelectorAll(`[data-perfil="${numero}"]`).forEach(el => el.classList.toggle('is-ativo', ativo));
}

function desenharGraficoClusters(perfis) {
    const svg = document.getElementById('cluster-chart');
    const tooltip = document.getElementById('cluster-tooltip');
    svg.innerHTML = '';

    const g = GRAFICO;
    const larguraUtil = g.largura - g.esquerda - g.direita;
    const alturaUtil = g.altura - g.topo - g.base;

    const pontos = perfis.map(disparidadesDoPerfil);
    const [xMin, xMax] = limitesEixo(pontos.map(p => p.genero));
    const [yMin, yMax] = limitesEixo(pontos.map(p => p.raca));
    const x = v => g.esquerda + (v - xMin) / (xMax - xMin) * larguraUtil;
    const y = v => g.topo + alturaUtil - (v - yMin) / (yMax - yMin) * alturaUtil;

    // grade a cada 5%
    for (let v = xMin; v <= xMax; v += 5) {
        svg.appendChild(criarSvg('line', { x1: x(v), y1: g.topo, x2: x(v), y2: g.topo + alturaUtil, class: 'chart-grid' }));
        const texto = criarSvg('text', { x: x(v), y: g.topo + alturaUtil + 14, 'text-anchor': 'middle', class: 'chart-eixo-texto' });
        texto.textContent = `${v}%`;
        svg.appendChild(texto);
    }
    for (let v = yMin; v <= yMax; v += 5) {
        svg.appendChild(criarSvg('line', { x1: g.esquerda, y1: y(v), x2: g.esquerda + larguraUtil, y2: y(v), class: 'chart-grid' }));
        const texto = criarSvg('text', { x: g.esquerda - 6, y: y(v) + 3, 'text-anchor': 'end', class: 'chart-eixo-texto' });
        texto.textContent = `${v}%`;
        svg.appendChild(texto);
    }

    const tituloX = criarSvg('text', { x: g.esquerda + larguraUtil / 2, y: g.altura - 6, 'text-anchor': 'middle', class: 'chart-eixo-texto' });
    tituloX.textContent = 'Disparidade de gênero ajustada →';
    svg.appendChild(tituloX);

    const tituloY = criarSvg('text', {
        x: 0, y: 0, 'text-anchor': 'middle', class: 'chart-eixo-texto',
        transform: `translate(11 ${g.topo + alturaUtil / 2}) rotate(-90)`
    });
    tituloY.textContent = 'Disparidade racial ajustada →';
    svg.appendChild(tituloY);

    // área da bolha proporcional ao nº de trabalhadores
    const maiorTotal = Math.max(...perfis.map(p => p.total_trabalhadores || 0));
    const raio = total => 8 + 16 * Math.sqrt((total || 0) / maiorTotal);

    // as maiores primeiro, para as pequenas ficarem por cima
    const ordem = perfis.map((perfil, i) => ({ perfil, i })).sort((a, b) => b.perfil.total_trabalhadores - a.perfil.total_trabalhadores);

    ordem.forEach(({ perfil, i }) => {
        const numero = i + 1;
        const { genero, raca } = pontos[i];
        const cx = x(genero);
        const cy = y(raca);

        const bolha = criarSvg('circle', { cx, cy, r: raio(perfil.total_trabalhadores), class: 'chart-bolha', 'data-perfil': numero, tabindex: 0 });
        const titulo = criarSvg('title', {});
        titulo.textContent = `${numero}. ${perfil.nome_cluster}`;
        bolha.appendChild(titulo);

        const rotulo = criarSvg('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'chart-bolha-numero' });
        rotulo.textContent = numero;

        const mostrar = () => {
            destacarPerfil(numero, true);
            tooltip.innerHTML = '';
            const nome = document.createElement('strong');
            nome.textContent = `${numero}. ${perfil.nome_cluster}`;
            tooltip.appendChild(nome);
            tooltip.append(
                `${formatarNumero(perfil.total_trabalhadores)} trabalhadores`,
                document.createElement('br'),
                `Gênero: ${formatarNumero(genero, 1)}% · Raça: ${formatarNumero(raca, 1)}%`
            );
            // o SVG é escalado, então converte para pixels
            const escala = svg.getBoundingClientRect().width / g.largura || 1;
            tooltip.style.left = `${Math.min(cx * escala + 12, svg.getBoundingClientRect().width - 200)}px`;
            tooltip.style.top = `${Math.max(cy * escala - 50, 0)}px`;
            tooltip.hidden = false;
        };
        const esconder = () => {
            destacarPerfil(numero, false);
            tooltip.hidden = true;
        };

        bolha.addEventListener('mouseenter', mostrar);
        bolha.addEventListener('focus', mostrar);
        bolha.addEventListener('mouseleave', esconder);
        bolha.addEventListener('blur', esconder);

        svg.append(bolha, rotulo);
    });
}

function desenharCardsClusters(perfis) {
    const container = document.getElementById('cluster-cards');
    container.innerHTML = '';

    perfis.forEach((perfil, i) => {
        const numero = i + 1;
        const { genero, raca } = disparidadesDoPerfil(perfil);

        const card = document.createElement('div');
        card.className = 'cluster-card';
        card.dataset.perfil = numero;

        const titulo = document.createElement('h3');
        const badge = document.createElement('span');
        badge.className = 'cluster-numero';
        badge.textContent = numero;
        titulo.append(badge, perfil.nome_cluster);

        const descricao = document.createElement('p');
        descricao.textContent = perfil.descricao;

        const disparidades = document.createElement('p');
        disparidades.className = 'cluster-gaps';
        disparidades.textContent =
            `Disparidade ajustada: gênero ${formatarNumero(genero, 1)}% · raça ${formatarNumero(raca, 1)}%`;

        card.append(titulo, descricao, disparidades);
        card.addEventListener('mouseenter', () => destacarPerfil(numero, true));
        card.addEventListener('mouseleave', () => destacarPerfil(numero, false));
        container.appendChild(card);
    });
}

function escreverConclusaoClusters(perfis) {
    const callout = document.getElementById('cluster-callout');
    const comNumero = perfis.map((perfil, i) => ({ perfil, numero: i + 1, ...disparidadesDoPerfil(perfil) }));

    const maiorGenero = comNumero.reduce((a, b) => (b.genero > a.genero ? b : a));
    const maiorRaca = comNumero.reduce((a, b) => (b.raca > a.raca ? b : a));

    callout.textContent =
        `Maior disparidade de gênero: perfil ${maiorGenero.numero} (${maiorGenero.perfil.nome_cluster}), ` +
        `onde mulheres ganham ${formatarNumero(maiorGenero.genero, 1)}% a menos que homens com o mesmo perfil. ` +
        `Maior disparidade racial: perfil ${maiorRaca.numero} (${maiorRaca.perfil.nome_cluster}), ` +
        `onde pessoas negras ganham ${formatarNumero(maiorRaca.raca, 1)}% a menos que brancas.`;
}

async function loadClusters() {
    const callout = document.getElementById('cluster-callout');
    if (!callout) return;

    try {
        const response = await fetch(`${API_URL}/clusters`);
        if (!response.ok) throw new Error('Erro ao buscar clusters');

        // já vem ordenado pela disparidade de gênero
        const perfis = await response.json();
        if (perfis.length === 0) {
            callout.textContent = 'Nenhum perfil encontrado. Rode o pipeline para gerar os clusters.';
            return;
        }

        desenharGraficoClusters(perfis);
        desenharCardsClusters(perfis);
        escreverConclusaoClusters(perfis);
    } catch (error) {
        console.error('Erro ao carregar clusters:', error);
        callout.textContent = 'Não foi possível carregar os perfis. Verifique a conexão com a API.';
    }
}
