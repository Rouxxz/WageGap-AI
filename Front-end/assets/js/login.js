/*
  login.js
  ---------
  Lógica da tela única de acesso: ENTRAR + CRIAR CONTA.

  Antes eram duas telas (login e cadastro, antigos arquivos separados). Agora as duas
  ficam no mesmo cartão e um painel escuro desliza de um lado para
  o outro. Este arquivo cuida de:

    1) alternar entre "entrar" e "criar conta" (painel deslizante)
    2) mostrar/ocultar senha
    3) validar os dois formulários antes de enviar
    4) simular o envio (loading no botão) e redirecionar

  Por enquanto o projeto ainda não tem endpoints de autenticação
  no backend (/backend/app/main.py só tem os 4 endpoints de dados:
  /api/kpis, /api/clusters, /api/shap, /api/ranking). Por isso o
  envio é SIMULADO. Quando existirem rotas reais (ex: POST
  /api/login e POST /api/signup), é só trocar as funções
  `fakeLoginRequest` e `fakeSignupRequest` por chamadas fetch() —
  validação, loading e mensagens de erro continuam iguais.

  Dica: abrir login.html#cadastro já mostra a tela de criar conta.
*/


/* ========================= */
/* ELEMENTOS DA TELA         */
/* ========================= */

const slider = document.getElementById('auth-slider');

const paneLogin = document.getElementById('pane-login');
const paneSignup = document.getElementById('pane-signup');

const overlayLeft = document.getElementById('overlay-left');
const overlayRight = document.getElementById('overlay-right');


/* --- Entrar --- */
const loginForm = document.getElementById('login-form');

const loginEmailInput = document.getElementById('login-email');
const loginSenhaInput = document.getElementById('login-senha');

const loginEmailError = document.getElementById('login-email-error');
const loginSenhaError = document.getElementById('login-senha-error');

const loginAlert = document.getElementById('login-alert');
const loginAlertText = document.getElementById('login-alert-text');
const loginSuccess = document.getElementById('login-success');

const loginSubmitBtn = document.getElementById('login-submit');


/* --- Criar conta --- */
const signupForm = document.getElementById('signup-form');

const nomeInput = document.getElementById('su-nome');
const suEmailInput = document.getElementById('su-email');
const suSenhaInput = document.getElementById('su-senha');
const suSenha2Input = document.getElementById('su-senha2');
const termosInput = document.getElementById('su-termos');

const nomeError = document.getElementById('su-nome-error');
const suEmailError = document.getElementById('su-email-error');
const suSenhaError = document.getElementById('su-senha-error');
const suSenha2Error = document.getElementById('su-senha2-error');
const termosError = document.getElementById('su-termos-error');

const signupAlert = document.getElementById('signup-alert');
const signupAlertText = document.getElementById('signup-alert-text');

const signupSubmitBtn = document.getElementById('signup-submit');


/*
  Credenciais de demonstração.
  Só existem aqui porque ainda não há backend de autenticação.
  Remover assim que o login real estiver pronto.
*/
const DEMO_EMAIL = 'demo@wagegap.ai';
const DEMO_SENHA = '123456';

/*
  E-mails que o "backend simulado" já considera cadastrados.
  Serve só para mostrar como fica o erro de "e-mail já existe".
  Remover quando o cadastro real estiver pronto.
*/
const EMAILS_JA_CADASTRADOS = ['demo@wagegap.ai'];


/* ========================= */
/* ALTERNAR LOGIN / CADASTRO */
/* ========================= */

/*
  modo = 'login' ou 'cadastro'.
  A classe .is-signup dispara a animação do painel (CSS).
  O atributo `inert` no lado que ficou escondido impede que ele
  receba foco pelo teclado (Tab) ou seja lido por leitores de tela.
*/
function setModo(modo, opcoes = {}){

  const cadastro = (modo === 'cadastro');

  slider.classList.toggle('is-signup', cadastro);

  paneLogin.inert = cadastro;
  paneSignup.inert = !cadastro;

  overlayRight.inert = cadastro;
  overlayLeft.inert = !cadastro;

  limparErrosLogin();
  limparErrosSignup();
  loginSuccess.classList.remove('is-visible');

  /* Mantém o endereço coerente (login.html#cadastro) para poder compartilhar o link */
  try{
    history.replaceState(
      null,
      '',
      cadastro ? '#cadastro' : location.pathname + location.search
    );
  } catch(e){
    /* alguns navegadores bloqueiam replaceState em arquivos abertos direto do disco */
  }

  /* Leva o cursor para o primeiro campo, depois que o painel terminou de deslizar */
  if(opcoes.foco !== false){

    setTimeout(() => {
      (cadastro ? nomeInput : loginEmailInput).focus();
    }, 450);

  }

}


/* Qualquer elemento com data-modo-alvo troca de tela ao ser clicado */
document.querySelectorAll('[data-modo-alvo]').forEach((botao) => {

  botao.addEventListener('click', () => {
    setModo(botao.dataset.modoAlvo);
  });

});


/* ========================= */
/* MOSTRAR / OCULTAR SENHA   */
/* ========================= */

function configurarToggleSenha(botaoId, inputEl){

  const botao = document.getElementById(botaoId);

  botao.addEventListener('click', () => {

    const isVisible = inputEl.type === 'text';

    inputEl.type = isVisible ? 'password' : 'text';

    botao.classList.toggle('is-visible', !isVisible);

    botao.setAttribute(
      'aria-label',
      isVisible ? 'Mostrar senha' : 'Ocultar senha'
    );

  });

}

configurarToggleSenha('toggle-login-senha', loginSenhaInput);
configurarToggleSenha('toggle-su-senha', suSenhaInput);
configurarToggleSenha('toggle-su-senha2', suSenha2Input);


/* ========================= */
/* VALIDAÇÃO                 */
/* ========================= */

function emailValido(valor){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}


/* --- Entrar --- */

function limparErrosLogin(){

  loginEmailInput.classList.remove('input-error');
  loginSenhaInput.classList.remove('input-error');

  loginEmailError.textContent = '';
  loginSenhaError.textContent = '';

  loginAlert.classList.remove('is-visible');

}


function validarLogin(){

  limparErrosLogin();

  let valido = true;

  const email = loginEmailInput.value.trim();
  const senha = loginSenhaInput.value;


  if(!email){
    loginEmailError.textContent = 'Informe seu e-mail.';
    loginEmailInput.classList.add('input-error');
    valido = false;

  } else if(!emailValido(email)){
    loginEmailError.textContent = 'Informe um e-mail válido.';
    loginEmailInput.classList.add('input-error');
    valido = false;
  }


  if(!senha){
    loginSenhaError.textContent = 'Informe sua senha.';
    loginSenhaInput.classList.add('input-error');
    valido = false;

  } else if(senha.length < 6){
    loginSenhaError.textContent = 'A senha deve ter ao menos 6 caracteres.';
    loginSenhaInput.classList.add('input-error');
    valido = false;
  }


  return valido;

}


/* --- Criar conta --- */

function limparErrosSignup(){

  [nomeInput, suEmailInput, suSenhaInput, suSenha2Input].forEach((campo) => {
    campo.classList.remove('input-error');
  });

  nomeError.textContent = '';
  suEmailError.textContent = '';
  suSenhaError.textContent = '';
  suSenha2Error.textContent = '';
  termosError.textContent = '';

  signupAlert.classList.remove('is-visible');

}


function validarSignup(){

  limparErrosSignup();

  let valido = true;

  const nome = nomeInput.value.trim();
  const email = suEmailInput.value.trim();
  const senha = suSenhaInput.value;
  const senha2 = suSenha2Input.value;


  if(!nome){
    nomeError.textContent = 'Informe seu nome completo.';
    nomeInput.classList.add('input-error');
    valido = false;
  }


  if(!email){
    suEmailError.textContent = 'Informe seu e-mail.';
    suEmailInput.classList.add('input-error');
    valido = false;

  } else if(!emailValido(email)){
    suEmailError.textContent = 'Informe um e-mail válido.';
    suEmailInput.classList.add('input-error');
    valido = false;
  }


  if(!senha){
    suSenhaError.textContent = 'Crie uma senha.';
    suSenhaInput.classList.add('input-error');
    valido = false;

  } else if(senha.length < 6){
    suSenhaError.textContent = 'A senha deve ter ao menos 6 caracteres.';
    suSenhaInput.classList.add('input-error');
    valido = false;
  }


  if(!senha2){
    suSenha2Error.textContent = 'Confirme sua senha.';
    suSenha2Input.classList.add('input-error');
    valido = false;

  } else if(senha2 !== senha){
    suSenha2Error.textContent = 'As senhas não coincidem.';
    suSenha2Input.classList.add('input-error');
    valido = false;
  }


  if(!termosInput.checked){
    termosError.textContent = 'É preciso aceitar os termos para continuar.';
    valido = false;
  }


  return valido;

}


/* ========================= */
/* ENVIO (simulado)          */
/* ========================= */

/*
  Troque esta função por uma chamada real ao backend
  quando o endpoint de login existir, por exemplo:

  async function fakeLoginRequest(email, senha){
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, senha })
    });
    if(!resp.ok) throw new Error('Credenciais inválidas');
    return resp.json();
  }
*/
function fakeLoginRequest(email, senha){

  return new Promise((resolve, reject) => {

    setTimeout(() => {

      if(email === DEMO_EMAIL && senha === DEMO_SENHA){
        resolve({ ok:true });
      } else {
        reject(new Error('Credenciais inválidas'));
      }

    }, 900);

  });

}


/*
  Troque esta função por uma chamada real ao backend
  quando o endpoint de cadastro existir, por exemplo:

  async function fakeSignupRequest(dados){
    const resp = await fetch('/api/signup', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(dados)
    });
    if(!resp.ok) throw new Error('E-mail já cadastrado');
    return resp.json();
  }
*/
function fakeSignupRequest(dados){

  return new Promise((resolve, reject) => {

    setTimeout(() => {

      if(EMAILS_JA_CADASTRADOS.includes(dados.email)){
        reject(new Error('E-mail já cadastrado'));
      } else {
        resolve({ ok:true });
      }

    }, 900);

  });

}


function setLoadingLogin(ativo){

  loginSubmitBtn.disabled = ativo;
  loginSubmitBtn.classList.toggle('is-loading', ativo);

  loginSubmitBtn.querySelector('.btn-label').textContent =
    ativo ? 'Entrando...' : 'Entrar';

}


function setLoadingSignup(ativo){

  signupSubmitBtn.disabled = ativo;
  signupSubmitBtn.classList.toggle('is-loading', ativo);

  signupSubmitBtn.querySelector('.btn-label').textContent =
    ativo ? 'Criando conta...' : 'Criar conta';

}


/* --- Enviar: entrar --- */
loginForm.addEventListener('submit', (evento) => {

  evento.preventDefault();

  loginSuccess.classList.remove('is-visible');

  if(!validarLogin()){
    return;
  }

  const email = loginEmailInput.value.trim();
  const senha = loginSenhaInput.value;

  setLoadingLogin(true);

  fakeLoginRequest(email, senha)
    .then(() => {

      /*
        Login OK: em uma versão real aqui salvaríamos o token
        recebido do backend (ex: localStorage ou cookie) antes
        de redirecionar.
      */
      window.location.href = 'dashboard.html';

    })
    .catch(() => {

      setLoadingLogin(false);

      loginAlertText.textContent = 'E-mail ou senha incorretos. Tente novamente.';
      loginAlert.classList.add('is-visible');

    });

});


/* --- Enviar: criar conta --- */
signupForm.addEventListener('submit', (evento) => {

  evento.preventDefault();

  if(!validarSignup()){
    return;
  }

  const dados = {
    nome: nomeInput.value.trim(),
    email: suEmailInput.value.trim(),
    senha: suSenhaInput.value
  };

  setLoadingSignup(true);

  fakeSignupRequest(dados)
    .then(() => {

      /*
        Conta criada: em uma versão real aqui o backend
        provavelmente já devolveria um token de sessão.
        Por enquanto o painel desliza de volta para o login,
        já com o e-mail preenchido e um aviso de sucesso.
      */
      setLoadingSignup(false);
      signupForm.reset();

      setModo('login', { foco:false });

      loginEmailInput.value = dados.email;
      loginSuccess.classList.add('is-visible');

      setTimeout(() => loginSenhaInput.focus(), 450);

    })
    .catch((erro) => {

      setLoadingSignup(false);

      signupAlertText.textContent =
        erro.message === 'E-mail já cadastrado'
          ? 'Esse e-mail já está cadastrado. Tente entrar na plataforma.'
          : 'Não foi possível criar a conta. Tente novamente.';

      signupAlert.classList.add('is-visible');

    });

});


/*
  Remove a mensagem de erro assim que a pessoa
  começa a corrigir o campo.
*/
[loginEmailInput, loginSenhaInput].forEach((campo) => {

  campo.addEventListener('input', () => {
    campo.classList.remove('input-error');
    loginAlert.classList.remove('is-visible');
  });

});

[nomeInput, suEmailInput, suSenhaInput, suSenha2Input].forEach((campo) => {

  campo.addEventListener('input', () => {
    campo.classList.remove('input-error');
    signupAlert.classList.remove('is-visible');
  });

});

termosInput.addEventListener('change', () => {
  termosError.textContent = '';
});


/* ========================= */
/* ESTADO INICIAL            */
/* ========================= */

/* Abre direto em "criar conta" se o endereço terminar com #cadastro */
if(location.hash === '#cadastro'){
  setModo('cadastro', { foco:false });
}

/* Se o endereço mudar com a página já aberta (ex: botão voltar), acompanha */
window.addEventListener('hashchange', () => {

  const querCadastro = (location.hash === '#cadastro');

  if(querCadastro !== slider.classList.contains('is-signup')){
    setModo(querCadastro ? 'cadastro' : 'login', { foco:false });
  }

});

/* Liga as animações só depois do primeiro desenho da tela */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    slider.classList.remove('no-transition');
  });
});
/* ============================================= */
/* TERMOS DE USO / POLÍTICA DE PRIVACIDADE        */
/* Abre o documento num modal, na mesma aba       */
/* ============================================= */
const legalModal = document.getElementById('legal-modal');
const legalFrame = document.getElementById('legal-modal-frame');

document.querySelectorAll('[data-legal]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    legalFrame.src = link.getAttribute('href');
    legalFrame.title = link.textContent;
    legalModal.showModal();
  });
});

function fecharLegal(){
  legalModal.close();
}

document.getElementById('legal-modal-close').addEventListener('click', fecharLegal);
document.getElementById('legal-modal-ok').addEventListener('click', fecharLegal);

/* Clique no fundo escuro (fora do cartão) também fecha */
legalModal.addEventListener('click', (e) => {
  if(e.target === legalModal) fecharLegal();
});

/* Esvazia o iframe ao fechar (Esc ou botões) para não guardar a rolagem antiga */
legalModal.addEventListener('close', () => {
  legalFrame.removeAttribute('src');
});
