// Função de validação de email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Lógica da página de perfil
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let userData = {};

// Carrega dados do perfil
async function loadProfile() {
  try {
    userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Atualiza informações básicas
    if (userData.fullName) {
      document.getElementById('profileName').textContent = userData.fullName;
      const initials = userData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      document.getElementById('profileInitials').textContent = initials;
      document.getElementById('editFullName').value = userData.fullName;
    }
    
    if (userData.email) {
      document.getElementById('profileEmail').textContent = userData.email;
      document.getElementById('editEmail').value = userData.email;
    }
    
    if (userData.cpf) {
      document.getElementById('editCPF').value = userData.cpf;
    }
    
    if (userData.birthDate) {
      document.getElementById('editBirthDate').value = userData.birthDate;
    }
    
    if (userData.phone) {
      document.getElementById('editPhone').value = userData.phone;
    }
    
    if (userData.createdAt) {
      const date = new Date(userData.createdAt);
      document.getElementById('profileMemberSince').textContent = 
        `Membro desde: ${date.toLocaleDateString('pt-BR')}`;
    }
    
    // Carrega estatísticas
    await loadStatistics();
    
    // Carrega conquistas
    loadAchievements();
  } catch (error) {
    showToast('Erro ao carregar perfil', 'erro');
    console.error(error);
  }
}

// Carrega estatísticas
async function loadStatistics() {
  try {
    const transactions = await transactionsAPI.getAll();
    const categories = await categoriesAPI.getAll();
    const goals = await goalsAPI.getAll();
    const recurring = await recurringAPI.getAll();
    
    document.getElementById('totalTransactions').textContent = transactions.length;
    document.getElementById('totalCategories').textContent = categories.length;
    document.getElementById('totalGoals').textContent = goals.length;
    document.getElementById('totalRecurring').textContent = recurring.length;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// Carrega conquistas
async function loadAchievements() {
  try {
    const transactions = await transactionsAPI.getAll();
    const goals = await goalsAPI.getAll();
    const categories = await categoriesAPI.getAll();
    
    const achievements = [];
    
    // Conquista: Primeira transação
    if (transactions.length >= 1) {
      achievements.push({
        icon: '🎯',
        title: 'Primeiro Passo',
        description: 'Registrou sua primeira transação',
        unlocked: true
      });
    }
    
    // Conquista: 10 transações
    if (transactions.length >= 10) {
      achievements.push({
        icon: '📊',
        title: 'Organizador',
        description: 'Registrou 10 transações',
        unlocked: true
      });
    }
    
    // Conquista: 50 transações
    if (transactions.length >= 50) {
      achievements.push({
        icon: '🏆',
        title: 'Mestre das Finanças',
        description: 'Registrou 50 transações',
        unlocked: true
      });
    }
    
    // Conquista: Primeira meta
    if (goals.length >= 1) {
      achievements.push({
        icon: '🎯',
        title: 'Planejador',
        description: 'Criou sua primeira meta financeira',
        unlocked: true
      });
    }
    
    // Conquista: Meta concluída
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);
    if (completedGoals.length >= 1) {
      achievements.push({
        icon: '⭐',
        title: 'Determinado',
        description: 'Concluiu uma meta financeira',
        unlocked: true
      });
    }
    
    // Conquista: Categoria personalizada
    const customCategories = categories.filter(c => parseInt(c.id) > 12);
    if (customCategories.length >= 1) {
      achievements.push({
        icon: '🎨',
        title: 'Personalizador',
        description: 'Criou uma categoria personalizada',
        unlocked: true
      });
    }
    
    // Conquista: Uso de 7 dias
    if (userData.createdAt) {
      const daysSince = Math.floor((Date.now() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24));
      if (daysSince >= 7) {
        achievements.push({
          icon: '📅',
          title: 'Dedicado',
          description: 'Usando o Alpha Bank há 7 dias',
          unlocked: true
        });
      }
      
      if (daysSince >= 30) {
        achievements.push({
          icon: '🔥',
          title: 'Comprometido',
          description: 'Usando o Alpha Bank há 30 dias',
          unlocked: true
        });
      }
    }
    
    // Conquistas bloqueadas (exemplos)
    const lockedAchievements = [
      {
        icon: '💎',
        title: 'Milionário',
        description: 'Alcance R$ 1.000.000 em saldo',
        unlocked: false
      },
      {
        icon: '🚀',
        title: 'Investidor',
        description: 'Registre 100 transações de investimento',
        unlocked: false
      }
    ];
    
    const allAchievements = [...achievements, ...lockedAchievements];
    
    renderAchievements(allAchievements);
  } catch (error) {
    console.error('Erro ao carregar conquistas:', error);
  }
}

// Renderiza conquistas
function renderAchievements(achievements) {
  const container = document.getElementById('achievementsList');
  
  if (achievements.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--foreground-muted); padding: 20px;">Nenhuma conquista ainda</p>';
    return;
  }
  
  container.innerHTML = achievements.map(achievement => `
    <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--background-secondary); border-radius: 12px; margin-bottom: 12px; ${!achievement.unlocked ? 'opacity: 0.5;' : ''}">
      <div style="font-size: 40px; ${!achievement.unlocked ? 'filter: grayscale(100%);' : ''}">
        ${achievement.icon}
      </div>
      <div style="flex: 1;">
        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${achievement.title}</h4>
        <p style="font-size: 14px; color: var(--foreground-muted);">${achievement.description}</p>
      </div>
      ${achievement.unlocked ? `
        <div style="color: var(--success); font-size: 24px;">✓</div>
      ` : `
        <div style="color: var(--foreground-muted); font-size: 24px;">🔒</div>
      `}
    </div>
  `).join('');
}

// Formulário de edição
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('editFullName').value.trim();
  const birthDate = document.getElementById('editBirthDate').value;
  const email = document.getElementById('editEmail').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  
  // Validações
  if (!fullName || fullName.length < 3) {
    showToast('Nome deve ter pelo menos 3 caracteres', 'erro');
    return;
  }
  
  if (!validateEmail(email)) {
    showToast('Email inválido', 'erro');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Salvando...';
  
  try {
    // Atualiza dados do usuário
    userData.fullName = fullName;
    userData.birthDate = birthDate;
    userData.email = email;
    userData.phone = phone;
    userData.updatedAt = new Date().toISOString();
    
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Atualiza também na lista de usuários se existir
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userData.id);
    if (userIndex !== -1) {
      users[userIndex] = userData;
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    showToast('Perfil atualizado com sucesso!', 'success');
    
    // Recarrega perfil
    setTimeout(() => {
      loadProfile();
    }, 500);
  } catch (error) {
    showToast('Erro ao atualizar perfil', 'erro');
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Salvar Alterações';
  }
});

// Máscara de telefone
document.getElementById('editPhone').addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  
  if (value.length <= 11) {
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
  }
  
  e.target.value = value;
});

// Carrega perfil ao iniciar
loadProfile();

