/*
  navegacao.js — troca de telas pelo menu lateral, título da página e logout
*/

const navItems = document.querySelectorAll('.nav-item[data-target]');

const screens = document.querySelectorAll('.screen');


let telaAtual = 'screen-home';


function atualizarTitulo(){

  const [crumb, titulo] = t('title.' + telaAtual);

  document.getElementById('breadcrumb').textContent = 'WageGap AI / ' + crumb;

  document.getElementById('page-title').textContent = titulo;

}


// ---- Navegação ----

// telas que usam os filtros de UF, setor e ano (KPIs e ranking)
const TELAS_COM_FILTRO = ['screen-home', 'screen-ranking'];

function atualizarBarraFiltros(){
  document.querySelector('.topbar .filters').hidden = !TELAS_COM_FILTRO.includes(telaAtual);
}

navItems.forEach(btn => {

  btn.addEventListener('click', () => {

    /* Marca só o botão clicado como ativo */
    navItems.forEach(b => {
      b.classList.remove('active');
    });

    btn.classList.add('active');


    /* Esconde todas as telas e mostra somente a escolhida */
    telaAtual = btn.dataset.target;

    screens.forEach(screen => {

      screen.classList.toggle(
        'active',
        screen.id === telaAtual
      );

    });


    /* Mostra a barra de recorte só nas telas que usam os filtros */
    atualizarBarraFiltros();


    /* Atualiza breadcrumb e título da página */
    atualizarTitulo();


    /* Volta para o topo */
    window.scrollTo({
      top:0,
      behavior:'smooth'
    });

  });

});


const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn){
  logoutBtn.addEventListener('click', () => {
    // Apaga a sessão (token/dados) do navegador garantindo a segurança
    localStorage.removeItem('user');
    window.location.href = '../pages/login.html';
  });
}
