/*
  main.js — ponto de partida do dashboard. Precisa ser o ÚLTIMO script da página:
  usa funções e constantes de todos os outros arquivos.
*/

// aplica o idioma salvo; depende de i18n.js, navegacao.js e filtros.js
aplicarIdioma(localStorage.getItem(IDIOMA_KEY) || 'pt-BR');


// ---- API ----

// Assim que o HTML termina de carregar, ele dispara estas funções
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadPreferences();
    loadFiltros();
    loadKPIs();
    loadRanking();
    loadPerfisShap();
    loadShap();
    loadClusters();
});
