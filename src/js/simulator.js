/**
 * Lógica do simulador de orçamento
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let transactions = [];
let categories = [];
let categoryData = {};
let categoryAdjustments = {};
let currentTotals = { income: 0, expense: 0 };

// Carrega dados
async function loadData() {
  try {
    transactions = await transactionsAPI.getAll();
    categories = await categoriesAPI.getAll();
    
    // Filtra transações do mês atual
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });
    
    // Calcula totais
    currentTotals.income = monthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    currentTotals.expense = monthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Agrupa despesas por categoria
    categoryData = {};
    monthTransactions
      .filter(t => t.transaction_type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Outros';
        if (!categoryData[cat]) {
          categoryData[cat] = {
            amount: 0,
            category: categories.find(c => c.name === cat) || { name: cat, icon: '💵', color: '#636e72' }
          };
        }
        categoryData[cat].amount += t.amount;
      });
    
    // Inicializa ajustes em 0%
    Object.keys(categoryData).forEach(cat => {
      categoryAdjustments[cat] = 0;
    });
    
    renderCategorySliders();
    updateSimulation();
  } catch (error) {
    showToast('Erro ao carregar dados', 'erro');
    console.error(error);
  }
}

// Renderiza sliders de categorias
function renderCategorySliders() {
  const container = document.getElementById('categorySliders');
  
  if (Object.keys(categoryData).length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--foreground-muted); padding: 20px;">Nenhuma despesa no mês atual</p>';
    return;
  }
  
  // Ordena por valor
  const sorted = Object.entries(categoryData).sort((a, b) => b[1].amount - a[1].amount);
  
  container.innerHTML = sorted.map(([catName, data]) => {
    const cat = data.category;
    return `
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="font-size: 24px;">${cat.icon}</span>
          <div style="flex: 1;">
            <p style="font-weight: 600; margin-bottom: 4px;">${cat.name}</p>
            <p style="font-size: 12px; color: var(--foreground-muted);">
              Atual: <span style="font-weight: 600;">${formatCurrency(data.amount)}</span>
            </p>
          </div>
          <div style="text-align: right;">
            <p id="adjustment-${catName}" style="font-size: 18px; font-weight: bold; color: ${cat.color};">0%</p>
            <p id="newAmount-${catName}" style="font-size: 12px; color: var(--foreground-muted);">${formatCurrency(data.amount)}</p>
          </div>
        </div>
        <input type="range" id="slider-${catName}" min="-100" max="50" value="0" step="5" 
               style="width: 100%; accent-color: ${cat.color};"
               oninput="updateCategoryAdjustment('${catName}', this.value)">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--foreground-muted); margin-top: 4px;">
          <span>-100% (Eliminar)</span>
          <span>0%</span>
          <span>+50%</span>
        </div>
      </div>
    `;
  }).join('');
}

// Atualiza ajuste de categoria
function updateCategoryAdjustment(category, value) {
  categoryAdjustments[category] = parseInt(value);
  
  const adjustment = categoryAdjustments[category];
  const originalAmount = categoryData[category].amount;
  const newAmount = originalAmount * (1 + adjustment / 100);
  
  document.getElementById(`adjustment-${category}`).textContent = 
    (adjustment >= 0 ? '+' : '') + adjustment + '%';
  document.getElementById(`newAmount-${category}`).textContent = formatCurrency(newAmount);
  
  updateSimulation();
}

// Atualiza simulação
function updateSimulation() {
  // Ajuste de receitas
  const incomeAdjustment = parseInt(document.getElementById('incomeAdjustment').value);
  document.getElementById('incomeAdjustmentLabel').textContent = 
    (incomeAdjustment >= 0 ? '+' : '') + incomeAdjustment + '%';
  
  const simulatedIncome = currentTotals.income * (1 + incomeAdjustment / 100);
  
  // Calcula despesas simuladas
  let simulatedExpense = 0;
  Object.entries(categoryData).forEach(([catName, data]) => {
    const adjustment = categoryAdjustments[catName] || 0;
    simulatedExpense += data.amount * (1 + adjustment / 100);
  });
  
  const currentBalance = currentTotals.income - currentTotals.expense;
  const simulatedBalance = simulatedIncome - simulatedExpense;
  const savings = simulatedBalance - currentBalance;
  
  // Atualiza interface
  document.getElementById('currentIncome').textContent = formatCurrency(currentTotals.income);
  document.getElementById('currentExpense').textContent = formatCurrency(currentTotals.expense);
  document.getElementById('currentBalance').textContent = formatCurrency(currentBalance);
  
  document.getElementById('simulatedIncome').textContent = formatCurrency(simulatedIncome);
  document.getElementById('simulatedExpense').textContent = formatCurrency(simulatedExpense);
  document.getElementById('simulatedBalance').textContent = formatCurrency(simulatedBalance);
  
  // Mostra economia
  if (savings !== 0) {
    document.getElementById('savingsInfo').classList.remove('hidden');
    document.getElementById('monthlySavings').textContent = 
      (savings >= 0 ? '+' : '') + formatCurrency(Math.abs(savings)) + '/mês';
    document.getElementById('monthlySavings').style.color = savings >= 0 ? 'var(--success)' : 'var(--error)';
    
    document.getElementById('yearlySavings').textContent = 
      (savings >= 0 ? '+' : '') + formatCurrency(Math.abs(savings * 12)) + '/ano';
    document.getElementById('yearlySavings').style.color = savings >= 0 ? 'var(--success)' : 'var(--error)';
  } else {
    document.getElementById('savingsInfo').classList.add('hidden');
  }
}

// Reseta simulação
function resetSimulation() {
  // Reseta ajustes de categorias
  Object.keys(categoryAdjustments).forEach(cat => {
    categoryAdjustments[cat] = 0;
    const slider = document.getElementById(`slider-${cat}`);
    if (slider) {
      slider.value = 0;
      document.getElementById(`adjustment-${cat}`).textContent = '0%';
      document.getElementById(`newAmount-${cat}`).textContent = formatCurrency(categoryData[cat].amount);
    }
  });
  
  // Reseta ajuste de receitas
  document.getElementById('incomeAdjustment').value = 0;
  
  updateSimulation();
  showToast('Simulação resetada', 'info');
}

// Carrega dados ao iniciar
loadData();

