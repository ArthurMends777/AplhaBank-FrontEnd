/**
 * Lógica da página de notificações
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let notifications = [];

// Carrega notificações
async function loadNotifications() {
  try {
    notifications = await notificationsAPI.getAll();
    renderNotifications();
  } catch (error) {
    showToast('Erro ao carregar notificações', 'erro');
    console.error(error);
  }
}

// Renderiza notificações
function renderNotifications() {
  const container = document.getElementById('notificationsList');
  const emptyState = document.getElementById('emptyState');
  
  if (notifications.length === 0) {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  container.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  container.innerHTML = notifications.map(n => `
    <div class="card" style="margin-bottom: 16px; cursor: pointer; transition: var(--transition); ${!n.read ? 'border-left: 4px solid var(--primary); background: rgba(0, 217, 255, 0.05);' : ''}" 
         onclick="markAsRead('${n.id}')"
         onmouseover="this.style.borderColor='var(--primary)'" 
         onmouseout="this.style.borderColor='${!n.read ? 'var(--primary)' : 'var(--border)'}'">
      <div style="display: flex; align-items: start; justify-content: space-between; gap: 16px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            ${!n.read ? '<span style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%;"></span>' : ''}
            <h3 style="font-weight: 600; font-size: 16px;">${n.title}</h3>
          </div>
          <p style="color: var(--foreground-muted); margin-bottom: 8px;">${n.message}</p>
          <p style="font-size: 12px; color: var(--foreground-muted);">${formatRelativeTime(n.createdAt)}</p>
        </div>
        <button onclick="event.stopPropagation(); deleteNotification('${n.id}')" style="background: none; border: none; color: var(--foreground-muted); cursor: pointer; padding: 4px; transition: var(--transition);" 
                onmouseover="this.style.color='var(--foreground)'" 
                onmouseout="this.style.color='var(--foreground-muted)'">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Marca notificação como lida
async function markAsRead(id) {
  try {
    await notificationsAPI.markAsRead(id);
    loadNotifications();
  } catch (error) {
    showToast('Erro ao marcar notificação', 'erro');
  }
}

// Marca todas como lidas
async function markAllAsRead() {
  try {
    await notificationsAPI.markAllAsRead();
    showToast('Todas as notificações foram marcadas como lidas', 'success');
    loadNotifications();
  } catch (error) {
    showToast('Erro ao marcar notificações', 'erro');
  }
}

// Deleta notificação
async function deleteNotification(id) {
  if (!confirm('Deseja excluir esta notificação?')) return;
  
  try {
    const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
    const filtered = notifs.filter(n => n.id !== id);
    localStorage.setItem('notifications', JSON.stringify(filtered));
    showToast('Notificação excluída', 'success');
    loadNotifications();
  } catch (error) {
    showToast('Erro ao excluir notificação', 'erro');
  }
}

// Carrega notificações ao iniciar
loadNotifications();

