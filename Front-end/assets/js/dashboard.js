const API_URL = 'http://localhost:8000/api';

const navItems = document.querySelectorAll('.nav-item[data-target]');

const screens = document.querySelectorAll('.screen');


// ---- Traduções ----

// Elementos com data-i18n recebem o texto da chave. O português fica no próprio HTML.
const I18N = {

  'pt-BR': {
    'brand.sub': 'Diagnóstico de disparidade salarial',
    'nav.section': 'Análise',
    'nav.home': 'Visão geral',
    'nav.clusters': 'Clusters de perfis',
    'nav.shap': 'Explicabilidade (SHAP)',
    'nav.ranking': 'Ranking de disparidade',
    'nav.settings': 'Configurações',
    'nav.logout': 'Sair da conta',
    'sidebar.active': 'Recorte ativo:',
    'filter.uf': 'UF',
    'filter.sector': 'Setor',
    'filter.year': 'Ano',
    'filter.apply': 'Aplicar recorte',
    'filter.allUf': 'Todas as UFs',
    'filter.allSector': 'Todos os setores',
    'filter.allYear': 'Todos os anos',
    'filter.all': 'Todo o Brasil',
    'title.screen-home': ['Visão geral', 'Visão geral do recorte'],
    'title.screen-clusters': ['Clusters de perfis', 'Clusters de perfis de trabalhadores'],
    'title.screen-shap': ['Explicabilidade (SHAP)', 'Explicabilidade do modelo salarial'],
    'title.screen-ranking': ['Ranking de disparidade', 'Ranking de municípios e setores'],
    'title.screen-settings': ['Configurações', 'Configurações da conta'],
    'settings.lede': 'Gerencie seus dados de acesso, preferências de exibição do dashboard e as opções padrão usadas nas análises de disparidade salarial.',
    'profile.title': 'Perfil',
    'profile.desc': 'Informações usadas para identificar você dentro da equipe.',
    'profile.team': 'Equipe WageGap AI',
    'profile.name': 'Nome completo',
    'profile.email': 'E-mail',
    'password.title': 'Alterar senha',
    'password.desc': 'Recomendado a cada 90 dias para manter a conta segura.',
    'password.button': 'Alterar senha',
    'password.modal.title': 'Alterar senha',
    'password.current': 'Senha atual',
    'password.new': 'Nova senha',
    'password.confirm': 'Confirmar nova senha',
    'appearance.title': 'Aparência',
    'appearance.desc': 'Ajuste como o dashboard é exibido para você.',
    'theme.title': 'Modo claro / escuro',
    'theme.desc': 'Alterna entre o tema claro padrão e um tema escuro para ambientes com pouca luz.',
    'language.title': 'Idioma',
    'language.desc': 'Idioma usado nos textos e rótulos do dashboard.',
    'notif.title': 'Notificações',
    'notif.desc': 'Escolha como quer ser avisado sobre novidades nos dados.',
    'notif.data.title': 'Atualização de dados (RAIS/CAGED)',
    'notif.data.desc': 'Avisar quando um novo recorte for processado pelo pipeline de dados.',
    'notif.weekly.title': 'Resumo semanal por e-mail',
    'notif.weekly.desc': 'Principais mudanças no ranking de disparidade da semana.',
    'security.title': 'Segurança',
    'security.desc': 'Camadas extras de proteção para sua conta.',
    'twofa.title': 'Autenticação em duas etapas',
    'twofa.desc': 'Exige um código adicional enviado por e-mail a cada novo login.',
    'account.title': 'Dados e conta',
    'account.desc': 'Exportação dos seus dados ou encerramento da conta.',
    'export.title': 'Exportar dados',
    'export.desc': 'Baixe um arquivo CSV com os recortes e análises salvos.',
    'export.button': 'Exportar CSV',
    'delete.title': 'Excluir conta',
    'delete.desc': 'Remove permanentemente seu acesso e preferências salvas.',
    'delete.button': 'Excluir conta',
    'delete.modal.title': 'Excluir conta',
    'delete.modal.text': 'Esta ação é permanente: seu acesso e suas preferências serão removidos. Digite sua senha para confirmar.',
    'delete.modal.password': 'Senha',
    'delete.modal.confirm': 'Excluir definitivamente',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'footer.note': 'WageGap AI · Dados: microdados da RAIS (Ministério do Trabalho e Emprego)',
    'msg.saved': 'Preferência salva.',
    'msg.saveError': 'Não foi possível salvar. Verifique a conexão com a API.',
    'msg.noUser': 'Faça login novamente para alterar suas configurações.',
    'msg.pwFill': 'Preencha todos os campos.',
    'msg.pwShort': 'A nova senha deve ter ao menos 6 caracteres.',
    'msg.pwMismatch': 'As senhas não coincidem.',
    'msg.pwChanged': 'Senha alterada com sucesso!',
    'msg.twofaOn': 'Autenticação em duas etapas ativada. Um código será pedido no próximo login.',
    'msg.twofaOff': 'Autenticação em duas etapas desativada.',
    'msg.exportOk': 'Download do CSV iniciado.',
    'msg.exportError': 'Não foi possível exportar os dados.',
    'msg.deleteFill': 'Digite sua senha para confirmar.',
    'msg.genericError': 'Algo deu errado. Tente novamente.'
  },

  'en-US': {
    'brand.sub': 'Wage gap diagnostics',
    'nav.section': 'Analysis',
    'nav.home': 'Overview',
    'nav.clusters': 'Profile clusters',
    'nav.shap': 'Explainability (SHAP)',
    'nav.ranking': 'Disparity ranking',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign out',
    'sidebar.active': 'Active selection:',
    'filter.uf': 'State',
    'filter.sector': 'Sector',
    'filter.year': 'Year',
    'filter.apply': 'Apply selection',
    'filter.allUf': 'All states',
    'filter.allSector': 'All sectors',
    'filter.allYear': 'All years',
    'filter.all': 'All of Brazil',
    'title.screen-home': ['Overview', 'Selection overview'],
    'title.screen-clusters': ['Profile clusters', 'Worker profile clusters'],
    'title.screen-shap': ['Explainability (SHAP)', 'Wage model explainability'],
    'title.screen-ranking': ['Disparity ranking', 'Municipality and sector ranking'],
    'title.screen-settings': ['Settings', 'Account settings'],
    'settings.lede': 'Manage your access details, dashboard display preferences and the default options used in wage gap analyses.',
    'profile.title': 'Profile',
    'profile.desc': 'Information used to identify you within the team.',
    'profile.team': 'WageGap AI Team',
    'profile.name': 'Full name',
    'profile.email': 'Email',
    'password.title': 'Change password',
    'password.desc': 'Recommended every 90 days to keep your account secure.',
    'password.button': 'Change password',
    'password.modal.title': 'Change password',
    'password.current': 'Current password',
    'password.new': 'New password',
    'password.confirm': 'Confirm new password',
    'appearance.title': 'Appearance',
    'appearance.desc': 'Adjust how the dashboard is displayed for you.',
    'theme.title': 'Light / dark mode',
    'theme.desc': 'Switches between the default light theme and a dark theme for low-light environments.',
    'language.title': 'Language',
    'language.desc': 'Language used in dashboard texts and labels.',
    'notif.title': 'Notifications',
    'notif.desc': 'Choose how you want to be notified about data updates.',
    'notif.data.title': 'Data updates (RAIS/CAGED)',
    'notif.data.desc': 'Notify when a new selection is processed by the data pipeline.',
    'notif.weekly.title': 'Weekly email summary',
    'notif.weekly.desc': 'Main changes in the disparity ranking this week.',
    'security.title': 'Security',
    'security.desc': 'Extra layers of protection for your account.',
    'twofa.title': 'Two-factor authentication',
    'twofa.desc': 'Requires an additional code sent by email on every new login.',
    'account.title': 'Data and account',
    'account.desc': 'Export your data or close your account.',
    'export.title': 'Export data',
    'export.desc': 'Download a CSV file with your saved selections and analyses.',
    'export.button': 'Export CSV',
    'delete.title': 'Delete account',
    'delete.desc': 'Permanently removes your access and saved preferences.',
    'delete.button': 'Delete account',
    'delete.modal.title': 'Delete account',
    'delete.modal.text': 'This action is permanent: your access and preferences will be removed. Enter your password to confirm.',
    'delete.modal.password': 'Password',
    'delete.modal.confirm': 'Delete permanently',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'footer.note': 'WageGap AI · Data: RAIS microdata (Brazilian Ministry of Labour and Employment)',
    'msg.saved': 'Preference saved.',
    'msg.saveError': 'Could not save. Check the connection to the API.',
    'msg.noUser': 'Please sign in again to change your settings.',
    'msg.pwFill': 'Fill in all fields.',
    'msg.pwShort': 'The new password must be at least 6 characters.',
    'msg.pwMismatch': 'Passwords do not match.',
    'msg.pwChanged': 'Password changed successfully!',
    'msg.twofaOn': 'Two-factor authentication enabled. A code will be requested on your next login.',
    'msg.twofaOff': 'Two-factor authentication disabled.',
    'msg.exportOk': 'CSV download started.',
    'msg.exportError': 'Could not export the data.',
    'msg.deleteFill': 'Enter your password to confirm.',
    'msg.genericError': 'Something went wrong. Please try again.'
  },

  'es': {
    'brand.sub': 'Diagnóstico de brecha salarial',
    'nav.section': 'Análisis',
    'nav.home': 'Resumen',
    'nav.clusters': 'Clusters de perfiles',
    'nav.shap': 'Explicabilidad (SHAP)',
    'nav.ranking': 'Ranking de disparidad',
    'nav.settings': 'Configuración',
    'nav.logout': 'Cerrar sesión',
    'sidebar.active': 'Recorte activo:',
    'filter.uf': 'Estado',
    'filter.sector': 'Sector',
    'filter.year': 'Año',
    'filter.apply': 'Aplicar recorte',
    'filter.allUf': 'Todos los estados',
    'filter.allSector': 'Todos los sectores',
    'filter.allYear': 'Todos los años',
    'filter.all': 'Todo Brasil',
    'title.screen-home': ['Resumen', 'Resumen del recorte'],
    'title.screen-clusters': ['Clusters de perfiles', 'Clusters de perfiles de trabajadores'],
    'title.screen-shap': ['Explicabilidad (SHAP)', 'Explicabilidad del modelo salarial'],
    'title.screen-ranking': ['Ranking de disparidad', 'Ranking de municipios y sectores'],
    'title.screen-settings': ['Configuración', 'Configuración de la cuenta'],
    'settings.lede': 'Administra tus datos de acceso, las preferencias de visualización del dashboard y las opciones predeterminadas usadas en los análisis de brecha salarial.',
    'profile.title': 'Perfil',
    'profile.desc': 'Información usada para identificarte dentro del equipo.',
    'profile.team': 'Equipo WageGap AI',
    'profile.name': 'Nombre completo',
    'profile.email': 'Correo electrónico',
    'password.title': 'Cambiar contraseña',
    'password.desc': 'Recomendado cada 90 días para mantener la cuenta segura.',
    'password.button': 'Cambiar contraseña',
    'password.modal.title': 'Cambiar contraseña',
    'password.current': 'Contraseña actual',
    'password.new': 'Nueva contraseña',
    'password.confirm': 'Confirmar nueva contraseña',
    'appearance.title': 'Apariencia',
    'appearance.desc': 'Ajusta cómo se muestra el dashboard para ti.',
    'theme.title': 'Modo claro / oscuro',
    'theme.desc': 'Alterna entre el tema claro predeterminado y un tema oscuro para ambientes con poca luz.',
    'language.title': 'Idioma',
    'language.desc': 'Idioma usado en los textos y etiquetas del dashboard.',
    'notif.title': 'Notificaciones',
    'notif.desc': 'Elige cómo quieres recibir avisos sobre novedades en los datos.',
    'notif.data.title': 'Actualización de datos (RAIS/CAGED)',
    'notif.data.desc': 'Avisar cuando el pipeline de datos procese un nuevo recorte.',
    'notif.weekly.title': 'Resumen semanal por correo',
    'notif.weekly.desc': 'Principales cambios en el ranking de disparidad de la semana.',
    'security.title': 'Seguridad',
    'security.desc': 'Capas extra de protección para tu cuenta.',
    'twofa.title': 'Autenticación en dos pasos',
    'twofa.desc': 'Exige un código adicional enviado por correo en cada nuevo inicio de sesión.',
    'account.title': 'Datos y cuenta',
    'account.desc': 'Exportación de tus datos o cierre de la cuenta.',
    'export.title': 'Exportar datos',
    'export.desc': 'Descarga un archivo CSV con los recortes y análisis guardados.',
    'export.button': 'Exportar CSV',
    'delete.title': 'Eliminar cuenta',
    'delete.desc': 'Elimina permanentemente tu acceso y preferencias guardadas.',
    'delete.button': 'Eliminar cuenta',
    'delete.modal.title': 'Eliminar cuenta',
    'delete.modal.text': 'Esta acción es permanente: tu acceso y tus preferencias serán eliminados. Escribe tu contraseña para confirmar.',
    'delete.modal.password': 'Contraseña',
    'delete.modal.confirm': 'Eliminar definitivamente',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'footer.note': 'WageGap AI · Datos: microdatos de la RAIS (Ministerio de Trabajo y Empleo de Brasil)',
    'msg.saved': 'Preferencia guardada.',
    'msg.saveError': 'No se pudo guardar. Verifica la conexión con la API.',
    'msg.noUser': 'Inicia sesión de nuevo para cambiar tu configuración.',
    'msg.pwFill': 'Completa todos los campos.',
    'msg.pwShort': 'La nueva contraseña debe tener al menos 6 caracteres.',
    'msg.pwMismatch': 'Las contraseñas no coinciden.',
    'msg.pwChanged': '¡Contraseña cambiada con éxito!',
    'msg.twofaOn': 'Autenticación en dos pasos activada. Se pedirá un código en el próximo inicio de sesión.',
    'msg.twofaOff': 'Autenticación en dos pasos desactivada.',
    'msg.exportOk': 'Descarga del CSV iniciada.',
    'msg.exportError': 'No se pudieron exportar los datos.',
    'msg.deleteFill': 'Escribe tu contraseña para confirmar.',
    'msg.genericError': 'Algo salió mal. Inténtalo de nuevo.'
  }

};

const IDIOMA_KEY = 'wagegap-lang';

let idiomaAtual = 'pt-BR';

let telaAtual = 'screen-home';


// se faltar a tradução, cai no português
function t(chave){
  return (I18N[idiomaAtual] && I18N[idiomaAtual][chave]) || I18N['pt-BR'][chave];
}


function atualizarTitulo(){

  const [crumb, titulo] = t('title.' + telaAtual);

  document.getElementById('breadcrumb').textContent = 'WageGap AI / ' + crumb;

  document.getElementById('page-title').textContent = titulo;

}


function aplicarIdioma(idioma){

  idiomaAtual = I18N[idioma] ? idioma : 'pt-BR';

  document.documentElement.lang = idiomaAtual;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  atualizarTitulo();
  atualizarRecorteAtivo();

  const selectIdioma = document.getElementById('set-idioma');
  if(selectIdioma) selectIdioma.value = idiomaAtual;

  localStorage.setItem(IDIOMA_KEY, idiomaAtual);

}


// ---- Navegação ----

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


// ---- Usuário logado ----

// o back-end já devolveu o usuário como objeto e como lista
function getUsuario(){

  const userStorage = localStorage.getItem('user');
  if(!userStorage) return null;

  try{
    const user = JSON.parse(userStorage);
    return {
      id: user.id || user[0],
      nome: user.nome || user[1],
      email: user.email || user[2]
    };
  } catch(e){
    return null;
  }

}


// ---- Toast ----

const toastEl = document.getElementById('toast');
let toastTimer = null;

function mostrarAviso(mensagem, erro = false){

  if(!toastEl) return;

  toastEl.textContent = mensagem;
  toastEl.classList.toggle('is-error', erro);
  toastEl.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 3500);

}


// ---- Preferências ----

// manda só o que mudou; devolve true se salvou
async function salvarPreferencias(campos){

  const usuario = getUsuario();

  if(!usuario || !usuario.id){
    mostrarAviso(t('msg.noUser'), true);
    return false;
  }

  try{
    const resp = await fetch(`${API_URL}/users/${usuario.id}/preferences`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(campos)
    });
    if(!resp.ok) throw new Error('Erro ao salvar preferências');
    return true;
  } catch(error){
    console.error('Erro ao salvar preferências:', error);
    mostrarAviso(t('msg.saveError'), true);
    return false;
  }

}


async function loadPreferences(){

  const usuario = getUsuario();
  if(!usuario || !usuario.id) return;

  try{
    const resp = await fetch(`${API_URL}/users/${usuario.id}/preferences`);
    if(!resp.ok) throw new Error('Erro ao buscar preferências');

    const prefs = await resp.json();

    aplicarTema(prefs.tema === 'dark');
    aplicarIdioma(prefs.idioma);

    document.getElementById('set-notif-dados').checked = prefs.notif_dados;
    document.getElementById('set-notif-resumo').checked = prefs.notif_resumo;
    document.getElementById('set-2fa').checked = prefs.dois_fatores;

  } catch(error){
    console.error('Erro ao carregar preferências:', error);
  }

}


// se a API falhar, o switch volta para a posição anterior
function ligarSwitch(id, campo, mensagens){

  const input = document.getElementById(id);
  if(!input) return;

  input.addEventListener('change', async () => {

    const valor = input.checked;
    input.disabled = true;

    const ok = await salvarPreferencias({ [campo]: valor });

    input.disabled = false;

    if(!ok){
      input.checked = !valor;
      return;
    }

    mostrarAviso(mensagens ? t(valor ? mensagens[0] : mensagens[1]) : t('msg.saved'));

  });

}


// ---- Tema ----

const TEMA_SALVO_KEY = 'wagegap-theme';

const themeToggle = document.getElementById('set-theme');

function aplicarTema(modoEscuro){

  document.documentElement.setAttribute(
    'data-theme',
    modoEscuro ? 'dark' : 'light'
  );

  localStorage.setItem(TEMA_SALVO_KEY, modoEscuro ? 'dark' : 'light');

  if(themeToggle) themeToggle.checked = modoEscuro;

}

// tema salvo neste navegador
if(localStorage.getItem(TEMA_SALVO_KEY) === 'dark'){
  aplicarTema(true);
}

if(themeToggle){
  themeToggle.addEventListener('change', () => {
    aplicarTema(themeToggle.checked);
    salvarPreferencias({ tema: themeToggle.checked ? 'dark' : 'light' });
  });
}


// ---- Idioma ----

const selectIdioma = document.getElementById('set-idioma');

if(selectIdioma){
  selectIdioma.addEventListener('change', async () => {
    aplicarIdioma(selectIdioma.value);
    if(await salvarPreferencias({ idioma: selectIdioma.value })){
      mostrarAviso(t('msg.saved'));
    }
  });
}


// ---- Notificações e 2FA ----

ligarSwitch('set-notif-dados', 'notif_dados');
ligarSwitch('set-notif-resumo', 'notif_resumo');
ligarSwitch('set-2fa', 'dois_fatores', ['msg.twofaOn', 'msg.twofaOff']);


// ---- Modais ----

// data-close-modal fecha o modal em volta
document.querySelectorAll('[data-close-modal]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog').close());
});

// clique fora do cartão também fecha
document.querySelectorAll('.settings-modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if(e.target === modal) modal.close();
  });
});


// lança erro com a mensagem que vier da API
async function enviarJSON(url, metodo, corpo){

  const resp = await fetch(url, {
    method: metodo,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(corpo)
  });

  const data = await resp.json().catch(() => ({}));

  if(!resp.ok){
    throw new Error(data.detail || t('msg.genericError'));
  }

  return data;

}


// ---- Alterar senha ----

const modalSenha = document.getElementById('modal-password');
const formSenha = document.getElementById('form-password');
const erroSenha = document.getElementById('pw-error');

document.getElementById('btn-change-password').addEventListener('click', () => {
  formSenha.reset();
  erroSenha.textContent = '';
  modalSenha.showModal();
});

formSenha.addEventListener('submit', async (e) => {

  e.preventDefault();

  const atual = document.getElementById('pw-atual').value;
  const nova = document.getElementById('pw-nova').value;
  const confirma = document.getElementById('pw-confirma').value;

  if(!atual || !nova || !confirma){
    erroSenha.textContent = t('msg.pwFill');
    return;
  }
  if(nova.length < 6){
    erroSenha.textContent = t('msg.pwShort');
    return;
  }
  if(nova !== confirma){
    erroSenha.textContent = t('msg.pwMismatch');
    return;
  }

  const usuario = getUsuario();
  if(!usuario || !usuario.id){
    erroSenha.textContent = t('msg.noUser');
    return;
  }

  const botao = document.getElementById('pw-submit');
  botao.disabled = true;

  try{
    await enviarJSON(`${API_URL}/users/${usuario.id}/password`, 'PUT', {
      senha_atual: atual,
      nova_senha: nova
    });
    modalSenha.close();
    mostrarAviso(t('msg.pwChanged'));
  } catch(error){
    erroSenha.textContent = error.message;
  } finally{
    botao.disabled = false;
  }

});


// ---- Exportar CSV ----

document.getElementById('btn-export').addEventListener('click', async (e) => {

  const usuario = getUsuario();
  if(!usuario || !usuario.id){
    mostrarAviso(t('msg.noUser'), true);
    return;
  }

  const botao = e.currentTarget;
  botao.disabled = true;

  try{
    const resp = await fetch(`${API_URL}/users/${usuario.id}/export`);
    if(!resp.ok) throw new Error('Erro ao exportar');

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'wagegap-dados.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    mostrarAviso(t('msg.exportOk'));
  } catch(error){
    console.error('Erro ao exportar dados:', error);
    mostrarAviso(t('msg.exportError'), true);
  } finally{
    botao.disabled = false;
  }

});


// ---- Excluir conta ----

const modalExcluir = document.getElementById('modal-delete');
const formExcluir = document.getElementById('form-delete');
const erroExcluir = document.getElementById('del-error');

document.getElementById('btn-delete-account').addEventListener('click', () => {
  formExcluir.reset();
  erroExcluir.textContent = '';
  modalExcluir.showModal();
});

formExcluir.addEventListener('submit', async (e) => {

  e.preventDefault();

  const senha = document.getElementById('del-senha').value;

  if(!senha){
    erroExcluir.textContent = t('msg.deleteFill');
    return;
  }

  const usuario = getUsuario();
  if(!usuario || !usuario.id){
    erroExcluir.textContent = t('msg.noUser');
    return;
  }

  const botao = document.getElementById('del-submit');
  botao.disabled = true;

  try{
    await enviarJSON(`${API_URL}/users/${usuario.id}`, 'DELETE', { senha });

    localStorage.removeItem('user');
    window.location.href = '../pages/login.html';
  } catch(error){
    erroExcluir.textContent = error.message;
    botao.disabled = false;
  }

});


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

function adicionarOpcao(select, valor, texto) {
    const option = document.createElement('option');
    option.value = valor;
    option.textContent = texto;
    select.appendChild(option);
}

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


// fica no fim porque usa as constantes dos filtros
aplicarIdioma(localStorage.getItem(IDIOMA_KEY) || 'pt-BR');

// 48200 -> "48.200"
function formatarNumero(valor, casas = 0) {
    return Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

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

// o banco grava sem acento
const PRIORIDADES = {
    'alta':  { classe: 'high', texto: 'Alta' },
    'media': { classe: 'mid',  texto: 'Média' },
    'média': { classe: 'mid',  texto: 'Média' },
    'baixa': { classe: 'low',  texto: 'Baixa' },
    'nao se aplica': { classe: 'na', texto: 'Não se aplica' }
};

// textContent para não interpretar HTML vindo do banco
function criarCelula(texto, classe) {
    const td = document.createElement('td');
    if (classe) td.className = classe;
    td.textContent = texto;
    return td;
}

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

// Função para injetar os dados do utilizador
function loadUserData() {

    const usuario = getUsuario();

    if (!usuario || !usuario.nome) {
        console.warn("Nenhum utilizador logado encontrado.");
        return; // Retorna sem fazer nada se não houver login
    }

    const userName = usuario.nome;

    // Substitui o nome principal
    const profileNameEl = document.querySelector('.settings-profile-name');
    if (profileNameEl) profileNameEl.textContent = userName;

    // Substitui as iniciais do avatar
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
    if (inputEmail) inputEmail.value = usuario.email;
}
