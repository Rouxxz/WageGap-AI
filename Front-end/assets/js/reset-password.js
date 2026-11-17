/*
  reset-password.js
  -----------------
  Tela aberta pelo link do e-mail de recuperação
  (reset-password.html?token=...).

    1) lê o token da URL
    2) valida a nova senha e a confirmação
    3) envia para POST /api/auth/reset-password
    4) mostra a confirmação ou o erro da API (link inválido/expirado)

  O link só funciona uma vez e vale por 30 minutos (regra da API).
  Precisa do config.js (API_URL) carregado antes.
*/

const SENHA_MINIMA = 6;

const form = document.getElementById('rp-form');

const senhaInput = document.getElementById('rp-senha');
const senhaError = document.getElementById('rp-senha-error');
const senha2Input = document.getElementById('rp-senha2');
const senha2Error = document.getElementById('rp-senha2-error');

const alertBox = document.getElementById('rp-alert');
const alertText = document.getElementById('rp-alert-text');

const submitBtn = document.getElementById('rp-submit');
const successNote = document.getElementById('rp-success');

const token = new URLSearchParams(window.location.search).get('token');


/* MENSAGENS                 */

function mostrarErroGeral(texto){
  alertText.textContent = texto;
  alertBox.classList.add('is-visible');
}

/* Sem token na URL não há o que fazer: esconde o formulário */
if(!token){
  form.style.display = 'none';
  mostrarErroGeral('Link incompleto. Peça um novo na tela "Esqueci minha senha".');
}


/* MOSTRAR / OCULTAR SENHA   */

function configurarToggleSenha(botaoId, inputEl){

  const botao = document.getElementById(botaoId);

  botao.addEventListener('click', () => {
    const isVisible = inputEl.type === 'text';
    inputEl.type = isVisible ? 'password' : 'text';
    botao.classList.toggle('is-visible', !isVisible);
    botao.setAttribute('aria-label', isVisible ? 'Mostrar senha' : 'Ocultar senha');
  });

}

configurarToggleSenha('toggle-rp-senha', senhaInput);
configurarToggleSenha('toggle-rp-senha2', senha2Input);


/* VALIDAÇÃO                 */

function limparErros(){
  [senhaInput, senha2Input].forEach(el => el.classList.remove('input-error'));
  senhaError.textContent = '';
  senha2Error.textContent = '';
  alertBox.classList.remove('is-visible');
}

function validarFormulario(){

  limparErros();
  let valido = true;

  if(!senhaInput.value){
    senhaError.textContent = 'Informe a nova senha.';
    senhaInput.classList.add('input-error');
    valido = false;
  } else if(senhaInput.value.length < SENHA_MINIMA){
    senhaError.textContent = `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`;
    senhaInput.classList.add('input-error');
    valido = false;
  }

  if(senha2Input.value !== senhaInput.value){
    senha2Error.textContent = 'As senhas não coincidem.';
    senha2Input.classList.add('input-error');
    valido = false;
  }

  return valido;

}


/* ENVIO                     */

function setLoading(ativo){
  submitBtn.disabled = ativo;
  submitBtn.classList.toggle('is-loading', ativo);
  submitBtn.querySelector('.btn-label').textContent = ativo ? 'Salvando...' : 'Salvar nova senha';
}

form.addEventListener('submit', async (evento) => {

  evento.preventDefault();

  if(!validarFormulario()){
    return;
  }

  setLoading(true);

  try{
    const resp = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ token, nova_senha: senhaInput.value })
    });

    const dados = await resp.json().catch(() => ({}));

    if(!resp.ok){
      throw new Error(dados.detail || 'Não foi possível alterar a senha agora. Tente novamente.');
    }

    /* Deu certo: some com o formulário e mostra a confirmação */
    form.style.display = 'none';
    successNote.classList.add('is-visible');

  } catch(erro){
    setLoading(false);
    /* TypeError = API fora do ar ou sem rede: a mensagem do navegador vem em inglês */
    mostrarErroGeral(erro instanceof TypeError
      ? 'Não foi possível alterar a senha agora. Tente novamente.'
      : erro.message);
  }

});


/* Tira o erro do campo assim que a pessoa começa a corrigir */
[senhaInput, senha2Input].forEach(el => {
  el.addEventListener('input', () => {
    el.classList.remove('input-error');
    alertBox.classList.remove('is-visible');
  });
});
