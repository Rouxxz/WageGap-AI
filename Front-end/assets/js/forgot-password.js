/*
  forgot-password.js
  -------------------
  Lógica da tela de recuperação de senha:

    1) validar o e-mail digitado
    2) pedir o link à API (POST /api/auth/forgot-password)
    3) esconder o formulário e mostrar a confirmação

  O link que chega por e-mail abre a reset-password.html, onde
  a pessoa cria a nova senha.

  Importante (boa prática de segurança, de propósito): a tela
  mostra a mesma confirmação exista o e-mail ou não, e a API
  também responde igual nos dois casos. Isso evita que alguém
  use essa tela para descobrir quais e-mails estão cadastrados
  (um ataque comum chamado "enumeração de usuários").

  Precisa do config.js (API_URL) carregado antes.
*/


const form = document.getElementById('fp-form');

const emailInput = document.getElementById('fp-email');
const emailError = document.getElementById('fp-email-error');

const alertBox = document.getElementById('fp-alert');
const alertText = document.getElementById('fp-alert-text');

const submitBtn = document.getElementById('fp-submit');

const successNote = document.getElementById('fp-success');
const successText = document.getElementById('fp-success-text');


/* VALIDAÇÃO DO FORMULÁRIO   */

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


/* ENVIO                     */

async function pedirLinkRecuperacao(email){

  const resp = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email })
  });

  if(!resp.ok) throw new Error('Falha ao enviar');
  return resp.json();

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

  pedirLinkRecuperacao(email)
    .then(() => {

      /*
        Esconde o formulário (impede reenvio acidental) e
        mostra a confirmação, já citando o e-mail digitado.
        O texto não afirma que o e-mail existe (ver comentário no topo).
      */
      form.style.display = 'none';

      successText.textContent =
        `Se ${email} estiver cadastrado, você vai receber um link válido por 30 minutos. Verifique sua caixa de entrada (e o spam).`;

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
