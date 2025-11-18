/**
 * Lógica da página de login
 */

// Formulário de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Desabilita botão e mostra loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Entrando...';
  
  try {
    await authAPI.login(username, password);
    showToast('Login realizado com sucesso!', 'success');
    setTimeout(() => {
      window.location.href = 'welcome.html';
    }, 500);
  } catch (error) {
    showToast(error.message || 'Erro ao fazer login', 'erro');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'ENTRAR';
  }
});

// Botão de reset de senha
document.getElementById('resetPasswordBtn').addEventListener('click', () => {
  openModal('resetModal');
});

// Fecha modal de reset
document.getElementById('closeResetModal').addEventListener('click', () => {
  closeModal('resetModal');
});

// Formulário de reset de senha
document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('resetEmail').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Enviando...';
  
  try {
    await authAPI.resetPassword(email);
    showToast('Email de recuperação enviado!', 'success');
    closeModal('resetModal');
    document.getElementById('resetForm').reset();
  } catch (error) {
    showToast(error.message || 'Erro ao enviar email', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'RESETAR';
  }
});

// Fecha modal ao clicar fora
document.getElementById('resetModal').addEventListener('click', (e) => {
  if (e.target.id === 'resetModal') {
    closeModal('resetModal');
  }
});

