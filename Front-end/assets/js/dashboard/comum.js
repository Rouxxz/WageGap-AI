/*
  comum.js — funções usadas por várias telas
  Usuário logado, aviso flutuante (toast), envio de JSON para a API,
  formatação de números e criação de células/opções sem interpretar HTML.
*/

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


// 48200 -> "48.200"
function formatarNumero(valor, casas = 0) {
    return Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}


// textContent para não interpretar HTML vindo do banco
function criarCelula(texto, classe) {
    const td = document.createElement('td');
    if (classe) td.className = classe;
    td.textContent = texto;
    return td;
}


function adicionarOpcao(select, valor, texto) {
    const option = document.createElement('option');
    option.value = valor;
    option.textContent = texto;
    select.appendChild(option);
}
