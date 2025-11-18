/**
 * Lógica da página de transações
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let allTransactions = [];
let filteredTransactions = [];
let currentFilter = { type: '', category: '' };

// Carrega transações
async function loadTransactions() {
  try {
    allTransactions = await transactionsAPI.getAll();
    applyFilters();
    updateSummary();
  } catch (error) {
    showToast('Erro ao carregar transações', 'erro');
    console.error(error);
  }
}

// Aplica filtros
function applyFilters() {
  filteredTransactions = allTransactions.filter(t => {
    const typeMatch = !currentFilter.type || t.transaction_type === currentFilter.type;
    const categoryMatch = !currentFilter.category || 
      (t.category && t.category.toLowerCase().includes(currentFilter.category.toLowerCase()));
    return typeMatch && categoryMatch;
  });
  renderTransactions();
}

// Renderiza transações
function renderTransactions() {
  const container = document.getElementById('allTransactionsList');
  
  if (filteredTransactions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 64px 20px;">
        <div style="width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 50%; background: var(--background-secondary); display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" fill="none" stroke="var(--foreground-muted)" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Nenhuma transação encontrada</h3>
        <p style="color: var(--foreground-muted);">Adicione sua primeira transação!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredTransactions.map(t => `
    <div class="card" style="margin-bottom: 16px; cursor: pointer; transition: var(--transition);" 
         onclick="openEditModal('${t.id}')"
         onmouseover="this.style.borderColor='var(--primary)'" 
         onmouseout="this.style.borderColor='var(--border)'">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <div style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; background: ${t.transaction_type === 'income' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 71, 87, 0.1)'}; color: ${t.transaction_type === 'income' ? 'var(--success)' : 'var(--error)'};">
            ${t.transaction_type === 'income' ? '↑' : '↓'}
          </div>
          <div style="flex: 1;">
            <p style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">${t.description}</p>
            <div style="display: flex; gap: 12px; font-size: 14px; color: var(--foreground-muted);">
              <span>${formatDate(t.date)}</span>
              ${t.category ? `<span>• ${t.category}</span>` : ''}
            </div>
          </div>
        </div>
        <p style="font-weight: bold; font-size: 20px; color: ${t.transaction_type === 'income' ? 'var(--success)' : 'var(--error)'};">
          ${t.transaction_type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
        </p>
      </div>
    </div>
  `).join('');
}

// Atualiza resumo
function updateSummary() {
  const totalIncome = filteredTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
  document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
  document.getElementById('totalBalance').textContent = formatCurrency(totalIncome - totalExpense);
}

// Modal de adicionar transação
async function openAddTransactionModal() {
  await loadCategoriesIntoSelect('transactionType', 'transactionCategory');
  openModal('addTransactionModal');
}

// Carrega categorias no select
async function loadCategoriesIntoSelect(typeSelectId, categorySelectId, defaultCategoryId = null) {
  try {
    const categories = await categoriesAPI.getAll();
    const typeSelect = document.getElementById(typeSelectId);
    const categorySelect = document.getElementById(categorySelectId);
    
    const updateCategories = () => {
      const type = typeSelect.value;
      const filtered = categories.filter(c => c.category_type === type || c.category_type === 'both');
      
      // Salva o valor atual para restaurar após a atualização
    const currentCategoryValue = categorySelect.value;
    
      categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>' +
        filtered.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
        
      // Se um ID de categoria padrão foi fornecido, use-o para pré-seleção
      if (defaultCategoryId) {
        categorySelect.value = defaultCategoryId;
      } else if (currentCategoryValue) {
        // Restaura o valor anterior, se existir e não houver defaultCategoryId
        categorySelect.value = currentCategoryValue;
      }
    };
    
    typeSelect.removeEventListener('change', updateCategories);
    typeSelect.addEventListener('change', updateCategories);
    updateCategories();
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

document.getElementById('addTransactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const type = document.getElementById('transactionType').value;
  const description = document.getElementById('transactionDescription').value;
  const amount = toNumber(document.getElementById('transactionAmount').value);
  const category = document.getElementById('transactionCategory').value || "";
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Adicionando...';
  
  try {
    await transactionsAPI.create({ type, description, amount, category_id: category });
    showToast('Transação adicionada com sucesso!', 'success');
    closeModal('addTransactionModal');
    document.getElementById('addTransactionForm').reset();
    loadTransactions();
  } catch (error) {
    showToast(error.message || 'Erro ao adicionar transação', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Adicionar';
  }
});

// Modal de filtro
function openFilterModal() {
  openModal('filterModal');
}

document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  currentFilter.type = document.getElementById('filterType').value;
  currentFilter.category = document.getElementById('filterCategory').value;
  
  applyFilters();
  closeModal('filterModal');
  showToast('Filtros aplicados', 'success');
});

function clearFilters() {
  currentFilter = { type: '', category: '' };
  document.getElementById('filterForm').reset();
  applyFilters();
  closeModal('filterModal');
  showToast('Filtros limpos', 'success');
}

// Modal de editar transação
async function openEditModal(id) {
  const transaction = allTransactions.find(t => t.id === id);
  if (!transaction) return;
  
  // O terceiro argumento é o ID da categoria para pré-seleção
  
  document.getElementById('editTransactionId').value = transaction.id;
  document.getElementById('editTransactionType').value = transaction.transaction_type;
  document.getElementById('editTransactionDescription').value = transaction.description;
  document.getElementById('editTransactionAmount').value = transaction.amount.toString();
  // Garante que o tipo esteja selecionado para que a função updateCategories filtre corretamente
  document.getElementById('editTransactionType').value = transaction.transaction_type;
  
  // Chama a função para carregar as categorias, que agora também selecionará a categoria correta
  // O terceiro argumento é o ID da categoria para pré-seleção
  await loadCategoriesIntoSelect('editTransactionType', 'editTransactionCategory', transaction.category_id);
  
  // O valor já deve estar setado pela função loadCategoriesIntoSelect, mas garantimos
  document.getElementById('editTransactionCategory').value = transaction.category_id || '';
  
  openModal('editTransactionModal');
}

document.getElementById('editTransactionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('editTransactionId').value;
  const type = document.getElementById('editTransactionType').value;
  const description = document.getElementById('editTransactionDescription').value;
  const amount = toNumber(document.getElementById('editTransactionAmount').value);
  const category = document.getElementById('editTransactionCategory').value || "";
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Salvando...';
  
  try {
    await transactionsAPI.update(id, { type, description, amount, category_id: category });
    showToast('Transação atualizada com sucesso!', 'success');
    closeModal('editTransactionModal');
    loadTransactions();
  } catch (error) {
    showToast(error.message || 'Erro ao atualizar transação', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Salvar';
  }
});

async function deleteTransaction() {
  if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
  
  const id = document.getElementById('editTransactionId').value;
  
  try {
    await transactionsAPI.delete(id);
    showToast('Transação excluída com sucesso!', 'success');
    closeModal('editTransactionModal');
    loadTransactions();
  } catch (error) {
    showToast(error.message || 'Erro ao excluir transação', 'erro');
  }
}

// Fecha modais ao clicar fora
['addTransactionModal', 'filterModal', 'editTransactionModal'].forEach(modalId => {
  document.getElementById(modalId).addEventListener('click', (e) => {
    if (e.target.id === modalId) {
      closeModal(modalId);
    }
  });
});

// Carrega transações ao iniciar
loadTransactions();

