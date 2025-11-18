/**
 * Lógica da página de metas financeiras
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let goals = [];

// Carrega metas
async function loadGoals() {
  try {
    goals = await goalsAPI.getAll();
    renderGoals();
  } catch (error) {
    showToast('Erro ao carregar metas', 'erro');
    console.error(error);
  }
}

// Renderiza metas
function renderGoals() {
  const container = document.getElementById('goalsList');
  const emptyState = document.getElementById('emptyState');
  
  if (goals.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  container.innerHTML = goals.map(goal => createGoalCard(goal)).join('');
}

// Cria card de meta
function createGoalCard(goal) {
  const currentAmount = toNumber(goal.currentAmount);
  const targetAmount = toNumber(goal.targetAmount);
  
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const remaining = targetAmount - currentAmount;
  const deadline = new Date(goal.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const monthlyTarget = monthsLeft > 0 ? remaining / monthsLeft : remaining;
  
  const isOverdue = daysLeft < 0;
  const isCompleted = progress >= 100;
  
  let statusColor = 'var(--primary)';
  let statusText = `${daysLeft} dias restantes`;
  
  if (isCompleted) {
    statusColor = 'var(--success)';
    statusText = '✅ Meta concluída!';
  } else if (isOverdue) {
    statusColor = 'var(--error)';
    statusText = '⚠️ Prazo vencido';
  }
  
  return `
    <div class="card" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: 32px;">${goal.icon || '🎯'}</span>
            <div>
              <h3 style="font-size: 18px; font-weight: 600;">${goal.name}</h3>
              <p style="font-size: 12px; color: ${statusColor};">${statusText}</p>
            </div>
          </div>
        </div>
        <button class="icon-btn" onclick="openEditGoalModal('${goal.id}')" style="margin-left: 8px;">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
        </button>
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: var(--foreground-muted);">Progresso</span>
          <span style="font-size: 14px; font-weight: 600;">${progress.toFixed(1)}%</span>
        </div>
        <div style="width: 100%; height: 12px; background: var(--background-secondary); border-radius: 6px; overflow: hidden;">
          <div style="width: ${Math.min(progress, 100)}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: var(--transition);"></div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; padding: 16px; background: var(--background-secondary); border-radius: 12px;">
        <div>
          <p style="font-size: 12px; color: var(--foreground-muted); margin-bottom: 4px;">Economizado</p>
          <p style="font-size: 18px; font-weight: bold; color: var(--success);">${formatCurrency(currentAmount)}</p>
        </div>
        <div>
          <p style="font-size: 12px; color: var(--foreground-muted); margin-bottom: 4px;">Meta</p>
          <p style="font-size: 18px; font-weight: bold;">${formatCurrency(targetAmount)}</p>
        </div>
      </div>
      
      ${!isCompleted ? `
        <div style="padding: 12px; background: var(--background-secondary); border-radius: 8px; margin-bottom: 16px;">
          <p style="font-size: 12px; color: var(--foreground-muted); margin-bottom: 4px;">💡 Sugestão</p>
          <p style="font-size: 14px;">Economize <strong style="color: var(--primary);">${formatCurrency(monthlyTarget)}/mês</strong> para atingir sua meta</p>
        </div>
      ` : ''}
      
      <div style="display: flex; gap: 12px;">
        ${!isCompleted ? `
          <button onclick="openProgressModal('${goal.id}')" class="btn btn-primary" style="flex: 1;">
            Adicionar Progresso
          </button>
        ` : `
          <button class="btn btn-success" style="flex: 1; cursor: default;" disabled>
            ✅ Meta Concluída
          </button>
        `}
      </div>
    </div>
  `;
}

// Abre modal para adicionar meta
function openAddGoalModal() {
  document.getElementById('goalModalTitle').textContent = 'Nova Meta';
  document.getElementById('goalForm').reset();
  document.getElementById('goalId').value = '';
  document.getElementById('deleteGoalBtn').classList.add('hidden');
  
  // Define data mínima como hoje
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('goalDeadline').min = today;
  
  openModal('goalModal');
}

// Abre modal para editar meta
function openEditGoalModal(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  
  document.getElementById('goalModalTitle').textContent = 'Editar Meta';
  document.getElementById('goalId').value = goal.id;
  document.getElementById('goalName').value = goal.name;
  document.getElementById('goalTarget').value = goal.targetAmount.toString();
  document.getElementById('goalDeadline').value = goal.deadline.split('T')[0];
  document.getElementById('goalIcon').value = goal.icon || '🎯';
  document.getElementById('deleteGoalBtn').classList.remove('hidden');
  
  openModal('goalModal');
}

// Formulário de meta
document.getElementById('goalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('goalId').value;
  const name = document.getElementById('goalName').value.trim();
  const targetAmount = toNumber(document.getElementById('goalTarget').value);
  const deadline = document.getElementById('goalDeadline').value;
  const icon = document.getElementById('goalIcon').value.trim() || '🎯';
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Salvando...';
  
  try {
    if (id) {
      await goalsAPI.update(id, { name, targetAmount, deadline, icon });
      showToast('Meta atualizada com sucesso!', 'success');
    } else {
      await goalsAPI.create({ name, targetAmount, deadline, icon });
      showToast('Meta criada com sucesso!', 'success');
    }
    
    closeModal('goalModal');
    loadGoals();
  } catch (error) {
    showToast(error.message || 'Erro ao salvar meta', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Salvar';
  }
});

// Deleta meta
async function deleteGoal() {
  if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
  
  const id = document.getElementById('goalId').value;
  
  try {
    await goalsAPI.delete(id);
    showToast('Meta excluída com sucesso!', 'success');
    closeModal('goalModal');
    loadGoals();
  } catch (error) {
    showToast(error.message || 'Erro ao excluir meta', 'erro');
  }
}

// Abre modal de progresso
function openProgressModal(id) {
  document.getElementById('progressGoalId').value = id;
  document.getElementById('progressForm').reset();
  openModal('progressModal');
}

// Formulário de progresso
document.getElementById('progressForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('progressGoalId').value;
  const amount = toNumber(document.getElementById('progressAmount').value);
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Adicionando...';
  
  try {
    await goalsAPI.addProgress(id, amount);
    showToast('Progresso adicionado com sucesso!', 'success');
    closeModal('progressModal');
    loadGoals();
  } catch (error) {
    showToast(error.message || 'Erro ao adicionar progresso', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Adicionar';
  }
});

// Fecha modais ao clicar fora
['goalModal', 'progressModal'].forEach(modalId => {
  document.getElementById(modalId).addEventListener('click', (e) => {
    if (e.target.id === modalId) {
      closeModal(modalId);
    }
  });
});

// Carrega metas ao iniciar
loadGoals();

