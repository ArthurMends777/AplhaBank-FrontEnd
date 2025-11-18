/**
 * Lógica da página de despesas recorrentes
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let recurring = [];
let categories = [];

// Carrega recorrências
async function loadRecurring() {
  try {
    recurring = await recurringAPI.getAll();
    categories = await categoriesAPI.getAll();
    renderRecurring();
  } catch (error) {
    showToast('Erro ao carregar recorrências', 'erro');
    console.error(error);
  }
}

// Renderiza recorrências
function renderRecurring() {
  const container = document.getElementById('recurringList');
  const emptyState = document.getElementById('emptyState');
  
  if (recurring.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  container.innerHTML = recurring.map(item => createRecurringCard(item)).join('');
}

// Cria card de recorrência
function createRecurringCard(item) {
  const frequencyLabels = {
    daily: 'Diária',
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual'
  };
  
  const category = categories.find(c => c.name === item.category);
  const categoryIcon = category ? category.icon : '💵';
  const categoryColor = category ? category.color : '#636e72';
  
  const lastGenText = item.lastGenerated 
    ? `Última: ${formatDate(item.lastGenerated)}`
    : 'Nunca gerada';
  
  return `
    <div class="card" style="margin-bottom: 16px; ${!item.active ? 'opacity: 0.6;' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: 28px;">${categoryIcon}</span>
            <div>
              <h3 style="font-size: 16px; font-weight: 600;">${item.description}</h3>
              <p style="font-size: 12px; color: var(--foreground-muted);">
                ${frequencyLabels[item.frequency]} • ${lastGenText}
              </p>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-left: 8px;">
          <button class="icon-btn" onclick="toggleRecurring('${item.id}')" title="${item.active ? 'Pausar' : 'Ativar'}">
            ${item.active ? `
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            ` : `
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            `}
          </button>
          <button class="icon-btn" onclick="openEditRecurringModal('${item.id}')">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--background-secondary); border-radius: 8px;">
        <div>
          <p style="font-size: 12px; color: var(--foreground-muted); margin-bottom: 4px;">Valor</p>
          <p style="font-size: 18px; font-weight: bold; color: ${item.transaction_type === 'income' ? 'var(--success)' : 'var(--error)'};">
            ${item.transaction_type === 'income' ? '+' : '-'} ${formatCurrency(item.amount)}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 12px; color: var(--foreground-muted); margin-bottom: 4px;">Status</p>
          <p style="font-size: 14px; font-weight: 600; color: ${item.active ? 'var(--success)' : 'var(--foreground-muted)'};">
            ${item.active ? '✅ Ativa' : '⏸️ Pausada'}
          </p>
        </div>
      </div>
    </div>
  `;
}

// Abre modal para adicionar recorrência
async function openAddRecurringModal() {
  await loadCategoriesIntoSelect();
  
  document.getElementById('recurringModalTitle').textContent = 'Nova Recorrência';
  document.getElementById('recurringForm').reset();
  document.getElementById('recurringId').value = '';
  document.getElementById('deleteRecurringBtn').classList.add('hidden');
  
  openModal('recurringModal');
}

// Abre modal para editar recorrência
async function openEditRecurringModal(id) {
  const item = recurring.find(r => r.id === id);
  if (!item) return;
  
  await loadCategoriesIntoSelect();
  
  document.getElementById('recurringModalTitle').textContent = 'Editar Recorrência';
  document.getElementById('recurringId').value = item.id;
  document.getElementById('recurringType').value = item.type;
  document.getElementById('recurringDescription').value = item.description;
  document.getElementById('recurringAmount').value = item.amount;
  document.getElementById('recurringCategory').value = item.category || '';
  document.getElementById('recurringFrequency').value = item.frequency;
  document.getElementById('deleteRecurringBtn').classList.remove('hidden');
  
  openModal('recurringModal');
}

// Carrega categorias no select
async function loadCategoriesIntoSelect() {
  try {
    const typeSelect = document.getElementById('recurringType');
    const categorySelect = document.getElementById('recurringCategory');
    
    const updateCategories = () => {
      const type = typeSelect.value;
      const filtered = categories.filter(c => c.category_type === type || c.category_type === 'both');
      
      categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>' +
        filtered.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
    };
    
    typeSelect.removeEventListener('change', updateCategories);
    typeSelect.addEventListener('change', updateCategories);
    updateCategories();
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

// Formulário de recorrência
document.getElementById('recurringForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('recurringId').value;
  const type = document.getElementById('recurringType').value;
  const description = document.getElementById('recurringDescription').value.trim();
  const amount = parseFloat(document.getElementById('recurringAmount').value);
  const category = document.getElementById('recurringCategory').value;
  const frequency = document.getElementById('recurringFrequency').value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Salvando...';
  
  try {
    if (id) {
      await recurringAPI.update(id, { type, description, amount, category, frequency });
      showToast('Recorrência atualizada com sucesso!', 'success');
    } else {
      await recurringAPI.create({ type, description, amount, category, frequency });
      showToast('Recorrência criada com sucesso!', 'success');
    }
    
    closeModal('recurringModal');
    loadRecurring();
  } catch (error) {
    showToast(error.message || 'Erro ao salvar recorrência', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Salvar';
  }
});

// Deleta recorrência
async function deleteRecurring() {
  if (!confirm('Tem certeza que deseja excluir esta recorrência?')) return;
  
  const id = document.getElementById('recurringId').value;
  
  try {
    await recurringAPI.delete(id);
    showToast('Recorrência excluída com sucesso!', 'success');
    closeModal('recurringModal');
    loadRecurring();
  } catch (error) {
    showToast(error.message || 'Erro ao excluir recorrência', 'erro');
  }
}

// Ativa/pausa recorrência
async function toggleRecurring(id) {
  try {
    const item = await recurringAPI.toggle(id);
    showToast(item.active ? 'Recorrência ativada!' : 'Recorrência pausada!', 'success');
    loadRecurring();
  } catch (error) {
    showToast(error.message || 'Erro ao alterar status', 'erro');
  }
}

// Gera transações pendentes
async function generatePending() {
  try {
    const generated = await recurringAPI.generatePending();
    
    if (generated.length === 0) {
      showToast('Nenhuma transação pendente para gerar', 'info');
    } else {
      showToast(`${generated.length} transação(ões) gerada(s) com sucesso!`, 'success');
      loadRecurring();
    }
  } catch (error) {
    showToast(error.message || 'Erro ao gerar transações', 'erro');
  }
}

// Fecha modal ao clicar fora
document.getElementById('recurringModal').addEventListener('click', (e) => {
  if (e.target.id === 'recurringModal') {
    closeModal('recurringModal');
  }
});

// Carrega recorrências ao iniciar
loadRecurring();

