/*
  configuracoes.js — tela "Configurações"
  Perfil, preferências (tema, idioma, notificações, 2FA), troca de senha,
  exportação do CSV e exclusão de conta. Rotas /api/users/{id}/...
*/

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
    if (inputEmail) inputEmail.value = mascararEmail(usuario.email);

    // Empresa: troca o "Equipe WageGap AI" pela razão social e preenche os campos
    const inputEmpresa = document.getElementById('set-empresa');
    const inputCnpj = document.getElementById('set-cnpj');

    if (usuario.razao_social) {
        const subEl = document.querySelector('.settings-profile-sub');
        if (subEl) {
            subEl.removeAttribute('data-i18n'); // a tradução não deve sobrescrever o nome da empresa
            subEl.textContent = usuario.razao_social;
        }
        if (inputEmpresa) inputEmpresa.value = usuario.razao_social;
    }
    if (inputCnpj && usuario.cnpj) inputCnpj.value = usuario.cnpj;
}

// "felipe.salinas@exemplo.com" -> "fe•••••@exemplo.com"
function mascararEmail(email) {
    if (!email || !email.includes('@')) return '';
    const [local, dominio] = email.split('@');
    const visivel = local.slice(0, Math.min(2, local.length - 1));
    return `${visivel}•••••@${dominio}`;
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
