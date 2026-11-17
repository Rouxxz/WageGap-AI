/*
  shap.js — tela "Explicabilidade (SHAP)" (GET /api/shap e /api/clusters)
  Barras com o peso de cada fator e disparidade bruta x ajustada.
*/

// ---- SHAP ----

// classes de cor no style.css
const CORES_SHAP = {
    'Qualificação/cargo': 'bar-qualificacao',
    'Gênero': 'bar-genero',
    'Localização': 'bar-localizacao',
    'Raça': 'bar-raca'
};

const filtroCluster = document.getElementById('f-cluster');

// negativo = o grupo ganha mais
function descreverDiferenca(valor) {
    return valor >= 0
        ? `${formatarNumero(valor, 1)}% a menos`
        : `${formatarNumero(-valor, 1)}% a mais`;
}

async function loadPerfisShap() {
    if (!filtroCluster) return;
    try {
        const response = await fetch(`${API_URL}/clusters`);
        if (!response.ok) throw new Error('Erro ao buscar clusters');

        const perfis = await response.json();
        filtroCluster.length = 1;
        perfis.forEach(perfil => adicionarOpcao(filtroCluster, perfil.id, perfil.nome_cluster));
    } catch (error) {
        console.error('Erro ao carregar perfis:', error);
    }
}

function desenharBarras(pesos) {
    const container = document.getElementById('shap-bars');
    container.innerHTML = '';

    // a maior barra ocupa a largura toda
    const maior = Math.max(...pesos.map(p => p.peso));

    pesos.forEach(({ grupo, peso }) => {
        const linha = document.createElement('div');
        linha.className = 'bar-row';

        const rotulo = document.createElement('div');
        rotulo.className = 'bar-label';
        rotulo.textContent = grupo;

        const trilho = document.createElement('div');
        trilho.className = 'bar-track';
        const preenchimento = document.createElement('div');
        preenchimento.className = `bar-fill ${CORES_SHAP[grupo] || 'bar-outros'}`;
        preenchimento.style.width = `${(peso / maior) * 100}%`;
        trilho.appendChild(preenchimento);

        const valor = document.createElement('div');
        valor.className = 'bar-valor';
        valor.textContent = `${formatarNumero(peso, 1)}%`;

        linha.append(rotulo, trilho, valor);
        container.appendChild(linha);
    });
}

function desenharEfeitos(efeitos) {
    const tbody = document.getElementById('shap-efeitos');
    tbody.innerHTML = '';

    [['genero', 'Mulheres x homens'], ['raca', 'Negros x brancos']].forEach(([chave, nome]) => {
        const e = efeitos[chave];
        if (!e) return;

        const tr = document.createElement('tr');
        tr.appendChild(criarCelula(nome));
        tr.appendChild(criarCelula(e.bruta === null ? '—' : descreverDiferenca(e.bruta), 'num'));
        tr.appendChild(criarCelula(e.ajustada === null ? '—' : descreverDiferenca(e.ajustada), 'num'));
        tr.appendChild(criarCelula(
            e.ic95_min === null ? '—' : `${formatarNumero(e.ic95_min, 1)}% a ${formatarNumero(e.ic95_max, 1)}%`,
            'num'
        ));
        tbody.appendChild(tr);
    });
}

function fraseDisparidade(grupo, referencia, efeito) {
    if (!efeito || efeito.ajustada === null) return '';

    let frase = `${grupo} ganham ${descreverDiferenca(efeito.ajustada)} que ${referencia} com o mesmo perfil profissional`;

    if (efeito.bruta < efeito.ajustada - 2) {
        frase += `, embora na comparação direta ganhem ${descreverDiferenca(efeito.bruta)}: ` +
            'o perfil médio do grupo é mais qualificado, o que esconde a desigualdade';
    } else if (efeito.bruta > efeito.ajustada + 2) {
        frase += `. Na comparação direta a diferença é maior (${formatarNumero(efeito.bruta, 1)}%) porque ` +
            'também reflete o acesso desigual a escolaridade, cargos e setores mais bem pagos';
    }
    return frase + '.';
}

function escreverConclusao(dados) {
    const callout = document.getElementById('shap-callout');
    const pesoGenero = (lista) => (lista.find(p => p.grupo === 'Gênero') || {}).peso;

    const partes = [];
    partes.push(dados.cluster ? `No perfil "${dados.cluster.nome}", ` : 'No recorte inteiro, ');
    partes.push(fraseDisparidade('mulheres', 'homens', dados.efeitos.genero));
    partes.push(' ' + fraseDisparidade('Negros', 'brancos', dados.efeitos.raca));

    if (dados.cluster) {
        const doPerfil = pesoGenero(dados.pesos);
        const doRecorte = pesoGenero(dados.recorte.pesos);
        if (doPerfil !== undefined && doRecorte !== undefined) {
            const comparacao = doPerfil > doRecorte ? 'acima' : 'abaixo';
            partes.push(` Gênero responde por ${formatarNumero(doPerfil, 1)}% do peso explicativo sobre a renda, ` +
                `${comparacao} da média do recorte (${formatarNumero(doRecorte, 1)}%).`);
        }
    }

    callout.textContent = partes.join('');
}

async function loadShap() {
    const callout = document.getElementById('shap-callout');
    if (!callout) return;

    const query = filtroCluster && filtroCluster.value ? `?cluster=${filtroCluster.value}` : '';

    try {
        const response = await fetch(`${API_URL}/shap${query}`);
        if (!response.ok) throw new Error('Erro ao buscar SHAP');

        const dados = await response.json();

        desenharBarras(dados.pesos);
        desenharEfeitos(dados.efeitos);
        escreverConclusao(dados);

        document.getElementById('shap-nota').textContent =
            `Peso = média do valor SHAP absoluto de cada fator, em % do total · Modelo LightGBM sobre o log do ` +
            `salário por hora · RAIS ${dados.ano} (${dados.regiao}). Jornada pesa em parte porque o salário é medido por hora.`;
    } catch (error) {
        console.error('Erro ao carregar SHAP:', error);
        callout.textContent = 'Não foi possível carregar os resultados do modelo. Verifique a conexão com a API.';
    }
}

if (filtroCluster) {
    filtroCluster.addEventListener('change', loadShap);
}
