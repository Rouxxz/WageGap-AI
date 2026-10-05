/*
  signup.js
  ----------
  Lógica da tela de criar conta.

  Assim como no login.js, ainda não existe endpoint de cadastro
  no backend. Este arquivo cuida só do FRONT-END:

    1) mostrar/ocultar senha e confirmar senha (dois campos,
       dois botões independentes)
    2) validar o formulário (nome, e-mail, senha, confirmação
       de senha e aceite dos termos)
    3) simular o envio (loading no botão) e redirecionar para
       o login

  Quando o backend tiver uma rota real de cadastro (ex: POST
  /api/signup), é só trocar a função `fakeSignupRequest` por um
  fetch() de verdade — toda a validação e o tratamento de erro
  continuam funcionando do mesmo jeito.
*/


const form = document.getElementById('signup-form');

const nomeInput = document.getElementById('su-nome');
const emailInput = document.getElementById('su-email');
const senhaInput = document.getElementById('su-senha');
const senha2Input = document.getElementById('su-senha2');
const termosInput = document.getElementById('su-termos');

const nomeError = document.getElementById('su-nome-error');
const emailError = document.getElementById('su-email-error');
const senhaError = document.getElementById('su-senha-error');
const senha2Error = document.getElementById('su-senha2-error');
const termosError = document.getElementById('su-termos-error');

const alertBox = document.getElementById('signup-alert');
const alertText = document.getElementById('signup-alert-text');

const submitBtn = document.getElementById('signup-submit');


/*
  E-mails que o "backend simulado" já considera cadastrados.
  Serve só para mostrar como fica o erro de "e-mail já existe".
  Remover quando o cadastro real estiver pronto.
*/
const EMAILS_JA_CADASTRADOS = ['demo@wagegap.ai'];


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

configurarToggleSenha('toggle-su-senha', senhaInput);
configurarToggleSenha('toggle-su-senha2', senha2Input);


/* ========================= */
/* VALIDAÇÃO DO FORMULÁRIO   */
/* ========================= */

function emailValido(valor){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}


function limparErros(){

  [nomeInput, emailInput, senhaInput, senha2Input].forEach((campo) => {
    campo.classList.remove('input-error');
  });

  nomeError.textContent = '';
  emailError.textContent = '';
  senhaError.textContent = '';
  senha2Error.textContent = '';
  termosError.textContent = '';

  alertBox.classList.remove('is-visible');

}


function validarFormulario(){

  limparErros();

  let valido = true;

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  const senha2 = senha2Input.value;


  if(!nome){
    nomeError.textContent = 'Informe seu nome completo.';
    nomeInput.classList.add('input-error');
    valido = false;
  }


  if(!email){
    emailError.textContent = 'Informe seu e-mail.';
    emailInput.classList.add('input-error');
    valido = false;

  } else if(!emailValido(email)){
    emailError.textContent = 'Informe um e-mail válido.';
    emailInput.classList.add('input-error');
    valido = false;
  }


  if(!senha){
    senhaError.textContent = 'Crie uma senha.';
    senhaInput.classList.add('input-error');
    valido = false;

  } else if(senha.length < 6){
    senhaError.textContent = 'A senha deve ter ao menos 6 caracteres.';
    senhaInput.classList.add('input-error');
    valido = false;
  }


  if(!senha2){
    senha2Error.textContent = 'Confirme sua senha.';
    senha2Input.classList.add('input-error');
    valido = false;

  } else if(senha2 !== senha){
    senha2Error.textContent = 'As senhas não coincidem.';
    senha2Input.classList.add('input-error');
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


function setLoading(ativo){

  submitBtn.disabled = ativo;
  submitBtn.classList.toggle('is-loading', ativo);

  submitBtn.querySelector('.btn-label').textContent =
    ativo ? 'Criando conta...' : 'Criar conta';

}


form.addEventListener('submit', (evento) => {

  evento.preventDefault();

  if(!validarFormulario()){
    return;
  }

  const dados = {
    nome: nomeInput.value.trim(),
    email: emailInput.value.trim(),
    senha: senhaInput.value
  };

  setLoading(true);

  fakeSignupRequest(dados)
    .then(() => {

      /*
        Conta criada: em uma versão real aqui o backend
        provavelmente já devolveria um token de sessão.
        Por enquanto mandamos a pessoa para o login.
      */
      window.location.href = 'login.html';

    })
    .catch((erro) => {

      setLoading(false);

      alertText.textContent =
        erro.message === 'E-mail já cadastrado'
          ? 'Esse e-mail já está cadastrado. Tente entrar na plataforma.'
          : 'Não foi possível criar a conta. Tente novamente.';

      alertBox.classList.add('is-visible');

    });

});


/*
  Remove a mensagem de erro assim que a pessoa
  começa a corrigir o campo.
*/
[nomeInput, emailInput, senhaInput, senha2Input].forEach((campo) => {

  campo.addEventListener('input', () => {
    campo.classList.remove('input-error');
    alertBox.classList.remove('is-visible');
  });

});

termosInput.addEventListener('change', () => {
  termosError.textContent = '';
});