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