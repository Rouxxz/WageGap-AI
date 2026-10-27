const navItems = document.querySelectorAll('.nav-item');

const screens = document.querySelectorAll('.screen');


const titles = {

  'screen-home': [
    'Visão geral',
    'Visão geral do recorte'
  ],

  'screen-clusters': [
    'Clusters de perfis',
    'Clusters de perfis de trabalhadores'
  ],

  'screen-shap': [
    'Explicabilidade (SHAP)',
    'Explicabilidade do modelo salarial'
  ],

  'screen-ranking': [
    'Ranking de disparidade',
    'Ranking de municípios e setores'
  ],

  'screen-settings': [
    'Configurações',
    'Configurações da conta'
  ]

};


navItems.forEach(btn => {

  btn.addEventListener('click', () => {


    /*
      Remove a classe "active"
      de todos os botões
    */

    navItems.forEach(b => {
      b.classList.remove('active');
    });


    /*
      Adiciona "active"
      ao botão clicado
    */

    btn.classList.add('active');


    /*
      Descobre qual tela
      deve ser mostrada
    */

    const target = btn.dataset.target;


    /*
      Esconde todas as telas
      e mostra somente a escolhida
    */

    screens.forEach(screen => {

      screen.classList.toggle(
        'active',
        screen.id === target
      );

    });


    /*
      Atualiza o breadcrumb
    */

    document.getElementById('breadcrumb').textContent =
      'WageGap AI / ' + titles[target][0];


    /*
      Atualiza o título da página
    */

    document.getElementById('page-title').textContent =
      titles[target][1];


    /*
      Volta para o topo
    */

    window.scrollTo({
      top:0,
      behavior:'smooth'
    });

  });

});




/*
  ================================
  SAIR DA CONTA
  ================================
  Por enquanto não existe sessão/token real (ver nota em login.js),
  então "sair" apenas manda a pessoa de volta para a tela de login.

  Quando o backend tiver autenticação de verdade, é aqui que entra
  a chamada para invalidar o token/sessão antes do redirecionamento,
  por exemplo:

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method:'POST' });
    window.location.href = '../Login/login.html';
  });
*/

const logoutBtn = document.getElementById('logout-btn');

if(logoutBtn){

  logoutBtn.addEventListener('click', () => {
    window.location.href = '../Login/login.html';
  });

}


const themeToggle = document.getElementById('set-theme');

if(themeToggle){

  const TEMA_SALVO_KEY = 'wagegap-theme';

  / Aplica o tema salvo (se houver) assim que a página carrega /
  const temaSalvo = localStorage.getItem(TEMA_SALVO_KEY);

  if(temaSalvo === 'dark'){
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
  }

  / Alterna o tema quando o switch é clicado */
  themeToggle.addEventListener('change', () => {

    const modoEscuro = themeToggle.checked;

    document.documentElement.setAttribute(
      'data-theme',
      modoEscuro ? 'dark' : 'light'
    );

    localStorage.setItem(
      TEMA_SALVO_KEY,
      modoEscuro ? 'dark' : 'light'
    );

  });

}

  /*INTEGRAÇÃO COM A API (FASTAPI)*/
  
document.addEventListener('DOMContentLoaded', () => {
    loadKPIs();
    loadRanking();
});

// Busca os KPIs no FastAPI
async function loadKPIs() {
    try {
        const response = await fetch('http://localhost:8000/api/kpis');
        if (!response.ok) throw new Error('Erro ao buscar KPIs');
        
        const kpis = await response.json();
        console.log('KPIs recebidos do banco:', kpis);
        
        // Quando os IDs da interface estiverem prontos, a injeção será assim:
        // document.getElementById('kpi-disparidade').textContent = kpis.disparidade_media + '%';
    } catch (error) {
        console.error('Erro ao carregar KPIs:', error);
    }
}

// Busca o Ranking no FastAPI
async function loadRanking() {
    try {
        const response = await fetch('http://localhost:8000/api/ranking');
        if (!response.ok) throw new Error('Erro ao buscar Ranking');
        
        const ranking = await response.json();
        console.log('Ranking recebido do banco:', ranking);
        
        // Futura renderização da tabela HTML entra aqui
    } catch (error) {
        console.error('Erro ao carregar Ranking:', error);
    }
}

   /*INTEGRAÇÃO COM A API E CARREGAMENTO DE DADOS*/


// Assim que o HTML termina de carregar, ele dispara estas funções
document.addEventListener('DOMContentLoaded', () => {
    console.log("Gatilho disparado! A iniciar carregamento de dados...");
    loadUserData();
    loadKPIs();
    loadRanking();
});

// Função para injetar os dados do utilizador
function loadUserData() {
    console.log("1. A iniciar loadUserData...");
    
    const userStorage = localStorage.getItem('user');
    console.log("2. Dados no localStorage:", userStorage);

    if (!userStorage) {
        console.warn("Nenhum utilizador logado encontrado.");
        return; // Retorna sem fazer nada se não houver login
    }

    try {
        const user = JSON.parse(userStorage);
        // Cobre as duas formas possíveis de resposta do back-end
        const userName = user.nome || user[1];
        const userEmail = user.email || user[2];
        
        console.log("3. Nome extraído para colocar no HTML:", userName);
        
        if (!userName) return;

        // Procura a classe e substitui o nome principal
        const profileNameEl = document.querySelector('.settings-profile-name');
        if (profileNameEl) {
            profileNameEl.textContent = userName;
            console.log("4. Sucesso! Nome principal substituído no HTML.");
        } else {
            console.error("ERRO: Não foi possível encontrar a classe '.settings-profile-name' no HTML.");
        }

        // Procura a classe e substitui as iniciais do avatar
        const avatarEl = document.querySelector('.settings-avatar');
        if (avatarEl) {
            const names = userName.trim().split(' ');
            let initials = names[0].charAt(0).toUpperCase();
            if (names.length > 1) {
                initials += names[names.length - 1].charAt(0).toUpperCase();
            }
            avatarEl.textContent = initials;
        }

        // Preenche os campos de input de Nome e E-mail
        const inputNome = document.getElementById('set-nome');
        const inputEmail = document.getElementById('set-email');
        
        if (inputNome) inputNome.value = userName;
        if (inputEmail) inputEmail.value = userEmail;

    } catch (e) {
        console.error('Erro ao processar dados do utilizador:', e);
    }
}