'use strict';

/* ============================
   CONSTANTES E CONFIGURAÇÕES
   ============================ */
const TAXA_ENTREGA  = 5;
const WHATSAPP_NUM  = '5517988233089';

// Carregar configurações do Admin (Horários e Mensagem)
function getSettings() {
  return JSON.parse(localStorage.getItem('vaz_settings')) || {
    abertura: 20,
    fechamento: 23,
    mensagem: ''
  };
}

// Carregar itens extras do cardápio do Admin
function getCustomMenu() {
  return JSON.parse(localStorage.getItem('vaz_menu_custom')) || [];
}

/* ============================
   ESTADO
   ============================ */
let carrinho = carregarCarrinho();

/* ============================
   INICIALIZAÇÃO
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
  verificarHorario();
  renderMenuDinamico();
  renderCarrinho();
  mascararTelefone();
});

/* ============================
   HORÁRIO E MENSAGEM
   ============================ */
function verificarHorario() {
  const settings = getSettings();
  const h = new Date().getHours();
  const aberto = h >= settings.abertura && h < settings.fechamento;
  
  const banner = document.getElementById('closed-banner');
  const bannerText = banner.querySelector('span');
  
  // Atualizar texto do banner com horários configurados
  if (settings.mensagem) {
    bannerText.textContent = `📢 ${settings.mensagem}`;
    banner.classList.remove('hidden');
  } else if (!aberto) {
    bannerText.textContent = `🚫 Estamos fechados agora — abrimos às ${settings.abertura}h`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/* ============================
   CARDÁPIO DINÂMICO
   ============================ */
function renderMenuDinamico() {
  const menuGrid = document.querySelector('.menu-grid');
  const customItems = getCustomMenu();
  
  if (customItems.length === 0) return; // Se não houver itens extras, mantém os originais do HTML

  // Adicionar itens extras ao final do cardápio existente
  customItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('onclick', `addItem('${item.nome}', ${item.preco}, event)`);
    card.setAttribute('tabindex', '0');
    
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${item.img}" alt="${item.nome}" onerror="this.src='img/logo.jpeg'">
        ${item.badge ? `<div class="card-badge">${item.badge}</div>` : ''}
      </div>
      <div class="card-info">
        <h3>${item.nome}</h3>
        <div class="card-bottom">
          <span class="price">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
          <button class="add-btn" aria-label="Adicionar ${item.nome}">+</button>
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });
}

/* ============================
   PERSISTÊNCIA
   ============================ */
function carregarCarrinho() {
  try {
    return JSON.parse(localStorage.getItem('vaz_carrinho')) || [];
  } catch {
    return [];
  }
}

function salvarCarrinho() {
  localStorage.setItem('vaz_carrinho', JSON.stringify(carrinho));
}

/* ============================
   TOAST
   ============================ */
let _toastTimer = null;
function mostrarToast(txt) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = txt;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ============================
   VIBRAÇÃO
   ============================ */
function vibrar(ms = 60) {
  navigator.vibrate?.(ms);
}

/* ============================
   ANIMAÇÃO CARD
   ============================ */
function animarCard(event) {
  const el = event.currentTarget;
  el.style.transform = 'scale(0.95)';
  setTimeout(() => (el.style.transform = ''), 180);
}

/* ============================
   ADICIONAR ITEM
   ============================ */
function addItem(nome, preco, event) {
  if (event) animarCard(event);
  vibrar();

  const item = carrinho.find(i => i.nome === nome);
  if (item) {
    item.qtd++;
  } else {
    carrinho.push({ nome, preco, qtd: 1 });
  }

  mostrarToast(`✅ ${nome} adicionado!`);
  renderCarrinho();
}

/* ============================
   AUMENTAR / DIMINUIR
   ============================ */
function aumentar(nome) {
  const item = carrinho.find(i => i.nome === nome);
  if (!item) return;
  item.qtd++;
  vibrar();
  renderCarrinho();
}

function diminuir(nome) {
  const idx = carrinho.findIndex(i => i.nome === nome);
  if (idx === -1) return;
  carrinho[idx].qtd--;
  if (carrinho[idx].qtd <= 0) carrinho.splice(idx, 1);
  vibrar();
  renderCarrinho();
}

function limparCarrinho() {
  if (carrinho.length === 0) return;
  if (!confirm('Limpar todos os itens do pedido?')) return;
  carrinho = [];
  renderCarrinho();
  mostrarToast('🗑 Pedido limpo!');
}

/* ============================
   RENDER CARRINHO
   ============================ */
function renderCarrinho() {
  const lista   = document.getElementById('lista');
  const empty   = document.getElementById('empty-cart');
  const resumo  = document.getElementById('resumo');
  const subEl   = document.getElementById('subtotal-val');
  const totalEl = document.getElementById('total-val');

  if (!lista) return;

  lista.innerHTML = '';

  if (carrinho.length === 0) {
    empty.classList.remove('hidden');
    resumo.classList.add('hidden');
    salvarCarrinho();
    return;
  }

  empty.classList.add('hidden');
  resumo.classList.remove('hidden');

  let subtotal = 0;

  carrinho.forEach(item => {
    subtotal += item.preco * item.qtd;
    const linhaPreco = `R$ ${(item.preco * item.qtd).toFixed(2).replace('.', ',')}`;

    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="item-name">
        ${sanitize(item.nome)}
        <span class="item-sub">${linhaPreco}</span>
      </div>
      <div class="item-controls">
        <button class="qty-btn" onclick="diminuir('${sanitize(item.nome)}')" aria-label="Diminuir">−</button>
        <span class="qty-num">${item.qtd}</span>
        <button class="qty-btn" onclick="aumentar('${sanitize(item.nome)}')" aria-label="Aumentar">+</button>
      </div>
    `;
    lista.appendChild(div);
  });

  const total = subtotal + TAXA_ENTREGA;
  subEl.textContent  = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

  salvarCarrinho();
}

/* ============================
   FINALIZAR PEDIDO
   ============================ */
function finalizarPedido() {
  const settings = getSettings();
  const h = new Date().getHours();
  
  // Se houver mensagem personalizada, pode impedir pedidos ou apenas alertar
  // Aqui vamos permitir o pedido se estiver no horário, mas mostrar a mensagem no topo se existir
  if (h < settings.abertura || h >= settings.fechamento) {
    mostrarToast(`🚫 Estamos fechados! Das ${settings.abertura}h às ${settings.fechamento}h.`);
    return;
  }

  const nome        = document.getElementById('nome').value.trim();
  const telefone    = document.getElementById('telefone').value.trim();
  const endereco    = document.getElementById('endereco').value.trim();
  const numero      = document.getElementById('numero').value.trim();
  const complemento = document.getElementById('complemento').value.trim();
  const pagamento   = document.getElementById('pagamento').value;

  // Validações
  const campos = [
    [nome,      'nome',      '⚠️ Informe seu nome.'],
    [telefone,  'telefone',  '⚠️ Informe seu telefone.'],
    [endereco,  'endereco',  '⚠️ Informe o endereço.'],
    [numero,    'numero',    '⚠️ Informe o número.'],
  ];

  for (const [val, id, msg] of campos) {
    if (!val) {
      document.getElementById(id).focus();
      mostrarToast(msg);
      return;
    }
  }

  if (!pagamento) {
    document.getElementById('pagamento').focus();
    mostrarToast('⚠️ Escolha a forma de pagamento.');
    return;
  }

  if (carrinho.length === 0) {
    mostrarToast('⚠️ Adicione itens ao pedido!');
    return;
  }

  // Montar mensagem
  const endCompleto = complemento
    ? `${endereco}, ${numero} – ${complemento}`
    : `${endereco}, ${numero}`;

  let msg = `🔥 *Pedido – Espetaria VAZ*\n`;
  msg += `\n👤 *Nome:* ${nome}`;
  msg += `\n📞 *Tel:* ${telefone}`;
  msg += `\n📍 *End:* ${endCompleto}`;
  msg += `\n\n🍢 *Itens:*\n`;

  carrinho.forEach(item => {
    const sub = (item.preco * item.qtd).toFixed(2).replace('.', ',');
    msg += `  • ${item.nome} x${item.qtd}  ➜  R$ ${sub}\n`;
  });

  const subtotal = carrinho.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  const total    = subtotal + TAXA_ENTREGA;

  msg += `\n💰 Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  msg += `\n🚚 Entrega: R$ ${TAXA_ENTREGA.toFixed(2).replace('.', ',')}`;
  msg += `\n💵 *Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
  msg += `\n💳 Pagamento: ${pagamento}`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encoded}`, '_blank');
}

/* ============================
   MÁSCARA DE TELEFONE
   ============================ */
function mascararTelefone() {
  const el = document.getElementById('telefone');
  if (!el) return;
  el.addEventListener('input', () => {
    let v = el.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d+)$/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d+)$/, '($1) $2');
    }
    el.value = v;
  });
}

/* ============================
   UTILIDADES
   ============================ */
function sanitize(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
