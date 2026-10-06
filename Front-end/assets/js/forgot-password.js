/*
  forgot-password.js
  -------------------
  Lógica da tela de recuperação de senha.

  Como ainda não existe backend de autenticação (sem rota de
  envio de e-mail), este arquivo cuida só do FRONT-END:

    1) validar o e-mail digitado
    2) simular o envio (loading no botão)
    3) esconder o formulário e mostrar a confirmação "Link enviado!"

  Importante (boa prática de segurança, já deixada assim de
  propósito): a tela sempre mostra "link enviado", mesmo que o
  e-mail não exista cadastrado. Isso evita que alguém use essa
  tela para descobrir quais e-mails estão cadastrados no sistema
  (um ataque comum chamado "enumeração de usuários"). A decisão
  de disparar o e-mail de verdade ou não fica só no backend,
  quando ele existir.

  Quando o backend tiver uma rota real (ex: POST
  /api/forgot-password), é só trocar a função
  `fakeForgotPasswordRequest` por um fetch() de verdade — a
  validação e o loading continuam funcionando do mesmo jeito.
*/


const form = document.getElementById('fp-form');

const emailInput = document.getElementById('fp-email');
const emailError = document.getElementById('fp-email-error');

const alertBox = document.getElementById('fp-alert');
const alertText = document.getElementById('fp-alert-text');

const submitBtn = document.getElementById('fp-submit');

const successNote = document.getElementById('fp-success');
const successText = document.getElementById('fp-success-text');


/* ========================= */
/* VALIDAÇÃO DO FORMULÁRIO   */
/* ========================= */

function emailValido(valor){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}


function validarFormulario(){

  emailInput.classList.remove('input-error');
  emailError.textContent = '';
  alertBox.classList.remove('is-visible');

  const email = emailInput.value.trim();

  if(!email){
    emailError.textContent = 'Informe seu e-mail.';
    emailInput.classList.add('input-error');
    return false;
  }

  if(!emailValido(email)){
    emailError.textContent = 'Informe um e-mail válido.';
    emailInput.classList.add('input-error');
    return false;
  }

  return true;

}


/* ========================= */
/* ENVIO (simulado)          */
/* ========================= */

/*
  Troque esta função por uma chamada real ao backend
  quando o endpoint existir, por exemplo:

  async function fakeForgotPasswordRequest(email){
    const resp = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email })
    });
    if(!resp.ok) throw new Error('Falha ao enviar');
    return resp.json();
  }
*/
function fakeForgotPasswordRequest(email){

  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok:true }), 900);
  });

}


function setLoading(ativo){

  submitBtn.disabled = ativo;
  submitBtn.classList.toggle('is-loading', ativo);

  submitBtn.querySelector('.btn-label').textContent =
    ativo ? 'Enviando...' : 'Enviar link de recuperação';

}


form.addEventListener('submit', (evento) => {

  evento.preventDefault();

  if(!validarFormulario()){
    return;
  }

  const email = emailInput.value.trim();

  setLoading(true);

  fakeForgotPasswordRequest(email)
    .then(() => {

      /*
        Esconde o formulário (impede reenvio acidental) e
        mostra a confirmação, já citando o e-mail digitado.
      */
      form.style.display = 'none';

      successText.textContent =
        `Enviamos um link para ${email}. Verifique sua caixa de entrada (e o spam) nos próximos minutos.`;

      successNote.classList.add('is-visible');

    })
    .catch(() => {

      setLoading(false);

      alertText.textContent = 'Não foi possível enviar o link agora. Tente novamente.';
      alertBox.classList.add('is-visible');

    });

});


/*
  Remove a mensagem de erro assim que a pessoa
  começa a corrigir o campo.
*/
emailInput.addEventListener('input', () => {
  emailInput.classList.remove('input-error');
  alertBox.classList.remove('is-visible');
});
