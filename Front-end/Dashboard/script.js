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
  MODO CLARO / ESCURO (Configurações)
  ================================
  O tema é controlado pelo atributo data-theme na tag <html>.
  Os valores das variáveis de cor (--ink, --paper, etc.) mudam
  em style.css quando esse atributo é "dark" — por isso basta
  ligar/desligar o atributo aqui, sem precisar trocar nenhuma
  cor manualmente em JS.

  A preferência é lembrada no localStorage deste navegador,
  então ao recarregar a página o tema escolhido continua ativo.
*/

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
    window.location.href = 'login.html';
  });

}


const themeToggle = document.getElementById('set-theme');

if(themeToggle){

  const TEMA_SALVO_KEY = 'wagegap-theme';

  /* Aplica o tema salvo (se houver) assim que a página carrega */
  const temaSalvo = localStorage.getItem(TEMA_SALVO_KEY);

  if(temaSalvo === 'dark'){
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
  }

  /* Alterna o tema quando o switch é clicado */
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