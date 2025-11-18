/**
 * Lógica da página de configurações
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

// Carrega dados do usuário
function loadUserData() {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  if (userData.fullName) {
    document.getElementById('userName').textContent = userData.fullName;
    const initials = userData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('userInitials').textContent = initials;
  }
  
  if (userData.email) {
    document.getElementById('userEmail').textContent = userData.email;
  }
}

// Abre modal de alterar senha
function openChangePasswordModal() {
  openModal('changePasswordModal');
}

// Formulário de alterar senha
document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  
  if (newPassword !== confirmNewPassword) {
    showToast('As senhas não coincidem', 'erro');
    return;
  }
  
  // Simulação - em produção, validar com o back-end
  showToast('Senha alterada com sucesso!', 'success');
  closeModal('changePasswordModal');
  document.getElementById('changePasswordForm').reset();
});

// Exporta dados
function exportData() {
  try {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const data = {
      exportDate: new Date().toISOString(),
      user: {
        name: userData.fullName,
        email: userData.email
      },
      transactions,
      categories
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpha-bank-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso!', 'success');
  } catch (error) {
    showToast('Erro ao exportar dados', 'erro');
    console.error(error);
  }
}

// Limpa dados locais
function clearData() {
  if (!confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  if (!confirm('ATENÇÃO: Todos os seus dados serão perdidos. Deseja continuar?')) {
    return;
  }
  
  try {
    // Mantém apenas o token de autenticação
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    localStorage.clear();
    
    if (token) localStorage.setItem('authToken', token);
    if (userData) localStorage.setItem('userData', userData);
    
    // Reinicializa dados mockados
    if (typeof initMockData === 'function') {
      initMockData();
    }
    
    showToast('Dados locais limpos com sucesso!', 'success');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } catch (error) {
    showToast('Erro ao limpar dados', 'erro');
    console.error(error);
  }
}

// Confirma logout
function confirmLogout() {
  if (confirm('Tem certeza que deseja sair da sua conta?')) {
    logout();
  }
}

// Fecha modal ao clicar fora
document.getElementById('changePasswordModal').addEventListener('click', (e) => {
  if (e.target.id === 'changePasswordModal') {
    closeModal('changePasswordModal');
  }
});

// Carrega dados do usuário ao iniciar
loadUserData();

