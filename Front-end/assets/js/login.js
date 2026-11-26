/*  PROTEÇÃO DE ROTA: Redireciona se já estiver logado */
if (localStorage.getItem('user')) {
    window.location.href = 'dashboard.html';
}

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

    
*/


/* ELEMENTOS DA TELA         */

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
const razaoInput = document.getElementById('su-razao');
const cnpjInput = document.getElementById('su-cnpj');
const suSenhaInput = document.getElementById('su-senha');
const suSenha2Input = document.getElementById('su-senha2');
const termosInput = document.getElementById('su-termos');

const nomeError = document.getElementById('su-nome-error');
const suEmailError = document.getElementById('su-email-error');
const razaoError = document.getElementById('su-razao-error');
const cnpjError = document.getElementById('su-cnpj-error');
const suSenhaError = document.getElementById('su-senha-error');
const suSenha2Error = document.getElementById('su-senha2-error');
const termosError = document.getElementById('su-termos-error');

const signupAlert = document.getElementById('signup-alert');
const signupAlertText = document.getElementById('signup-alert-text');

const signupSubmitBtn = document.getElementById('signup-submit');

/* ALTERNAR LOGIN / CADASTRO */

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


/* MOSTRAR / OCULTAR SENHA   */

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


/* VALIDAÇÃO                 */

function emailValido(valor){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}


/*
  CNPJ: aceita o formato numérico e o alfanumérico (Receita Federal, 2026):
  12 letras/números + 2 dígitos verificadores. Cada caractere vale o código
  ASCII menos 48 ("0" = 0, "A" = 17). Mesma regra de Back-end/src/cnpj.py.
*/
function normalizarCnpj(valor){
  return valor.replace(/[.\-\/\s]/g, '').toUpperCase();
}

function digitoCnpj(base){
  const pesos = base.length === 12
    ? [5,4,3,2,9,8,7,6,5,4,3,2]
    : [6,5,4,3,2,9,8,7,6,5,4,3,2];

  let soma = 0;
  for(let i = 0; i < base.length; i++){
    soma += (base.charCodeAt(i) - 48) * pesos[i];
  }

  const resto = soma % 11;
  return resto < 2 ? '0' : String(11 - resto);
}

function cnpjValido(valor){
  const limpo = normalizarCnpj(valor);

  if(!/^[0-9A-Z]{12}[0-9]{2}$/.test(limpo)) return false;
  if(/^(.)\1+$/.test(limpo)) return false;   /* 00000000000000, 11111111111111... */

  const dv1 = digitoCnpj(limpo.slice(0, 12));
  const dv2 = digitoCnpj(limpo.slice(0, 12) + dv1);
  return limpo.slice(12) === dv1 + dv2;
}

/* Máscara enquanto digita: "12345678000195" -> "12.345.678/0001-95" */
function mascararCnpj(valor){
  const c = normalizarCnpj(valor).replace(/[^0-9A-Z]/g, '').slice(0, 14);
  let saida = c.slice(0, 2);
  if(c.length > 2)  saida += '.' + c.slice(2, 5);
  if(c.length > 5)  saida += '.' + c.slice(5, 8);
  if(c.length > 8)  saida += '/' + c.slice(8, 12);
  if(c.length > 12) saida += '-' + c.slice(12);
  return saida;
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

  [nomeInput, suEmailInput, razaoInput, cnpjInput, suSenhaInput, suSenha2Input].forEach((campo) => {
    campo.classList.remove('input-error');
  });

  nomeError.textContent = '';
  suEmailError.textContent = '';
  razaoError.textContent = '';
  cnpjError.textContent = '';
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
  const razao = razaoInput.value.trim();
  const cnpj = cnpjInput.value.trim();
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


  if(!razao){
    razaoError.textContent = 'Informe a razão social.';
    razaoInput.classList.add('input-error');
    valido = false;
  }


  if(!cnpj){
    cnpjError.textContent = 'Informe o CNPJ.';
    cnpjInput.classList.add('input-error');
    valido = false;

  } else if(!cnpjValido(cnpj)){
    cnpjError.textContent = 'CNPJ inválido. Confira os números.';
    cnpjInput.classList.add('input-error');
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

/* ENVIO (Integrado ao FastAPI) */

async function fakeLoginRequest(email, senha){
  try {
    const resp = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, senha })
    });
    
    const data = await resp.json();
    
    if(!resp.ok) {
      throw new Error(data.detail || 'Credenciais inválidas');
    }

    // com 2FA, o usuário só é salvo depois do código
    if(data.requires_2fa) {
      return { ok: true, requires2fa: true };
    }

    // Salva o usuário na sessão do navegador
    localStorage.setItem('user', JSON.stringify(data.user));
    return { ok: true };
    
  } catch (error) {
    throw error;
  }
}

async function fakeSignupRequest(dados){
  try {
    const resp = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      // nome, email, razao_social, cnpj, senha
      body: JSON.stringify(dados)
    });

    const data = await resp.json().catch(() => ({}));

    if(!resp.ok) {
      // a mensagem da API (e-mail repetido, empresa já cadastrada, CNPJ inválido) vai direto para a tela
      const erro = new Error(typeof data.detail === 'string' ? data.detail : '');
      erro.status = resp.status;
      throw erro;
    }
    
    return { ok: true };
    
  } catch (error) {
    throw error;
  }
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
    .then((resultado) => {

      if(resultado.requires2fa){
        setLoadingLogin(false);
        abrirModalCodigo(email);
        return;
      }

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
    razao_social: razaoInput.value.trim(),
    cnpj: cnpjInput.value.trim(),
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

      /* 400/409 trazem uma mensagem pensada para o usuário; o resto (500, rede) não */
      const mensagemDaApi = (erro.status === 400 || erro.status === 409) && erro.message;

      if(erro.status === 400 && erro.message === 'Este e-mail já está registrado.'){
        signupAlertText.textContent = 'Esse e-mail já está cadastrado. Tente entrar na plataforma.';
      } else if(erro.status === 409){
        signupAlertText.textContent = mensagemDaApi;
        cnpjInput.classList.add('input-error');
      } else {
        signupAlertText.textContent = mensagemDaApi || 'Não foi possível criar a conta. Tente novamente.';
      }

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

[nomeInput, suEmailInput, razaoInput, cnpjInput, suSenhaInput, suSenha2Input].forEach((campo) => {

  campo.addEventListener('input', () => {
    campo.classList.remove('input-error');
    signupAlert.classList.remove('is-visible');
  });

});

cnpjInput.addEventListener('input', () => {
  cnpjInput.value = mascararCnpj(cnpjInput.value);
});

termosInput.addEventListener('change', () => {
  termosError.textContent = '';
});

/* ESTADO INICIAL            *

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

/* VERIFICAÇÃO EM DUAS ETAPAS */
const codeModal = document.getElementById('code-modal');
const codeForm = document.getElementById('code-form');
const codeInput = document.getElementById('code-input');
const codeError = document.getElementById('code-error');
const codeSubmitBtn = document.getElementById('code-submit');

let emailPendente2fa = null;

function abrirModalCodigo(email){
  emailPendente2fa = email;
  codeForm.reset();
  codeError.textContent = '';
  codeInput.classList.remove('input-error');
  codeModal.showModal();
  codeInput.focus();
}

document.getElementById('code-cancel').addEventListener('click', () => {
  codeModal.close();
});

/* só números */
codeInput.addEventListener('input', () => {
  codeInput.value = codeInput.value.replace(/\D/g, '');
  codeInput.classList.remove('input-error');
  codeError.textContent = '';
});

codeForm.addEventListener('submit', async (evento) => {

  evento.preventDefault();

  const codigo = codeInput.value.trim();

  if(codigo.length !== 6){
    codeError.textContent = 'Digite os 6 dígitos do código.';
    codeInput.classList.add('input-error');
    return;
  }

  codeSubmitBtn.disabled = true;

  try {
    const resp = await fetch(`${API_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: emailPendente2fa, codigo })
    });

    const data = await resp.json();

    if(!resp.ok) {
      throw new Error(data.detail || 'Código inválido.');
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'dashboard.html';

  } catch (error) {
    codeSubmitBtn.disabled = false;
    codeError.textContent = error.message;
    codeInput.classList.add('input-error');
  }

});

/* Esvazia o iframe ao fechar (Esc ou botões) para não guardar a rolagem antiga */
legalModal.addEventListener('close', () => {
  legalFrame.removeAttribute('src');
});
