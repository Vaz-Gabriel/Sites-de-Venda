'use strict';

// Senha de Admin (simulada para o exemplo, em um sistema real seria via backend)
const ADMIN_PASSWORD = 'admin'; 

// Chaves para LocalStorage
const KEY_SETTINGS = 'vaz_settings';
const KEY_MENU = 'vaz_menu_custom';

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadCurrentSettings();
  renderAdminMenu();
});

// LOGIN / SESSÃO
function checkLogin() {
  const passInput = document.getElementById('admin-password');
  const errorMsg = document.getElementById('login-error');
  
  if (passInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem('vaz_admin_logged', 'true');
    showPanel();
  } else {
    errorMsg.classList.remove('hidden');
    passInput.value = '';
    passInput.focus();
  }
}

function checkSession() {
  if (sessionStorage.getItem('vaz_admin_logged') === 'true') {
    showPanel();
  }
}

function logout() {
  sessionStorage.removeItem('vaz_admin_logged');
  window.location.reload();
}

function showPanel() {
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
}

// CONFIGURAÇÕES (HORÁRIO E MENSAGEM)
function loadCurrentSettings() {
  const settings = JSON.parse(localStorage.getItem(KEY_SETTINGS)) || {
    abertura: 18,
    fechamento: 23,
    mensagem: ''
  };
  
  document.getElementById('cfg-abertura').value = settings.abertura;
  document.getElementById('cfg-fechamento').value = settings.fechamento;
  document.getElementById('cfg-mensagem').value = settings.mensagem;
}

function saveSettings() {
  const settings = {
    abertura: parseInt(document.getElementById('cfg-abertura').value) || 18,
    fechamento: parseInt(document.getElementById('cfg-fechamento').value) || 23,
    mensagem: document.getElementById('cfg-mensagem').value.trim()
  };
  
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  mostrarToast('✅ Configurações salvas!');
}

// GERENCIAMENTO DE CARDÁPIO
function getMenu() {
  return JSON.parse(localStorage.getItem(KEY_MENU)) || [];
}

function saveMenu(menu) {
  localStorage.setItem(KEY_MENU, JSON.stringify(menu));
}

function addNewItem() {
  const nome = document.getElementById('new-name').value.trim();
  const preco = parseFloat(document.getElementById('new-price').value);
  const img = document.getElementById('new-img').value.trim() || 'img/logo.jpeg';
  const badge = document.getElementById('new-badge').value;
  
  if (!nome || isNaN(preco)) {
    mostrarToast('⚠️ Preencha nome e preço corretamente!');
    return;
  }
  
  const menu = getMenu();
  menu.push({ id: Date.now(), nome, preco, img, badge });
  saveMenu(menu);
  
  // Limpar campos
  document.getElementById('new-name').value = '';
  document.getElementById('new-price').value = '';
  document.getElementById('new-img').value = '';
  document.getElementById('new-badge').value = '';
  
  renderAdminMenu();
  mostrarToast('✅ Item adicionado ao cardápio!');
}

function removeItem(id) {
  if (!confirm('Deseja remover este item do cardápio?')) return;
  
  let menu = getMenu();
  menu = menu.filter(item => item.id !== id);
  saveMenu(menu);
  renderAdminMenu();
  mostrarToast('🗑 Item removido!');
}

function renderAdminMenu() {
  const list = document.getElementById('admin-menu-list');
  const menu = getMenu();
  
  if (menu.length === 0) {
    list.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">Nenhum item adicionado ainda.</p>';
    return;
  }
  
  list.innerHTML = menu.map(item => `
    <div class="menu-item-admin">
      <div>
        <strong style="color: var(--light);">${item.nome}</strong><br>
        <span style="color: var(--fire); font-size: 14px;">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
      </div>
      <button class="btn-admin btn-danger" onclick="removeItem(${item.id})" style="padding: 6px 12px; font-size: 12px;">Remover</button>
    </div>
  `).join('');
}

// TOAST (Reutilizado do site original)
let _toastTimer = null;
function mostrarToast(txt) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = txt;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
