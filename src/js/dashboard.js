/**
 * Lógica da página do dashboard
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

// Carrega dados do dashboard
async function loadDashboard() {
  try {
    // Carrega saldo
    const { balance } = await accountAPI.getBalance();
    document.getElementById('balanceDisplay').textContent = formatCurrency(balance);
    
    // Carrega transações recentes
    const transactions = await transactionsAPI.getAll();
    renderRecentTransactions(transactions.slice(0, 4));
  } catch (error) {
    showToast('Erro ao carregar dados', 'erro');
    console.error(error);
  }
}

// Renderiza transações recentes
function renderRecentTransactions(transactions) {
  const container = document.getElementById('transactionsList');
  
  if (transactions.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--foreground-muted); padding: 20px;">Nenhuma transação encontrada</p>';
    return;
  }
  
  container.innerHTML = transactions.map(t => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--background-secondary); border-radius: 12px; margin-bottom: 12px; cursor: pointer; transition: var(--transition);" 
         onmouseover="this.style.background='var(--background)'" 
         onmouseout="this.style.background='var(--background-secondary)'"
         onclick="window.location.href='transactions.html'">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; background: ${t.transaction_type === 'income' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 71, 87, 0.1)'}; color: ${t.transaction_type === 'income' ? 'var(--success)' : 'var(--error)'};">
          ${t.transaction_type === 'income' ? '↑' : '↓'}
        </div>
        <div>
          <p style="font-weight: 600; margin-bottom: 4px;">${t.description}</p>
          <p style="font-size: 14px; color: var(--foreground-muted);">${formatDate(t.date)}</p>
        </div>
      </div>
      <p style="font-weight: bold; font-size: 16px; color: ${t.transaction_type === 'income' ? 'var(--success)' : 'var(--error)'};">
        ${t.transaction_type === 'income' ? '+' : '-'}${formatCurrency(toNumber(t.amount))}
      </p>
    </div>
  `).join('');
}

let dashboardFlowChart = null;
let dashboardCategoryChart = null;
let dashboardPeriod = 30;

// Renderiza gráfico de fluxo
async function renderDashboardCharts() {
  try {
    const transactions = await transactionsAPI.getAll();
    const categories = await categoriesAPI.getAll();
    
    // Filtra por período
    const now = new Date();
    const periodStart = new Date(now.getTime() - (dashboardPeriod * 24 * 60 * 60 * 1000));
    const periodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= periodStart && date <= now;
    });
    
    renderFlowChart(periodTransactions);
    renderCategoryChart(periodTransactions, categories);
  } catch (error) {
    console.error('Erro ao renderizar gráficos:', error);
  }
}

function renderFlowChart(transactions) {
  const ctx = document.getElementById('dashboardFlowChart').getContext('2d');
  
  // Agrupa por dia
  const dailyData = {};
  const now = new Date();
  
  for (let i = dashboardPeriod - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = { income: 0, expense: 0 };
  }
  
  transactions.forEach(t => {
    const dateStr = new Date(t.date).toISOString().split('T')[0];
    if (dailyData[dateStr]) {
      if (t.transaction_type === 'income') {
        dailyData[dateStr].income += toNumber(t.amount);
      } else {
        dailyData[dateStr].expense += toNumber(t.amount);
      }
    }
  });
  
  const labels = Object.keys(dailyData).map(date => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  
  const incomeData = Object.values(dailyData).map(d => d.income);
  const expenseData = Object.values(dailyData).map(d => d.expense);
  
  if (dashboardFlowChart) {
    dashboardFlowChart.destroy();
  }
  
  dashboardFlowChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Despesas',
          data: expenseData,
          borderColor: '#ff4757',
          backgroundColor: 'rgba(255, 71, 87, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#ffffff' }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#8b95a8',
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        x: {
          ticks: { color: '#8b95a8' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

function renderCategoryChart(transactions, categories) {
  const ctx = document.getElementById('dashboardCategoryChart').getContext('2d');
  
  const categoryData = {};
  const categoryColors = {};
  
  transactions.filter(t => t.transaction_type === 'expense').forEach(t => {
    const categoryName = t.category || 'Outros';
    categoryData[categoryName] = (categoryData[categoryName] || 0) + toNumber(t.amount);
    
    const cat = categories.find(c => c.name === categoryName);
    if (cat && !categoryColors[categoryName]) {
      categoryColors[categoryName] = cat.color;
    }
  });
  
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  const colors = labels.map(label => categoryColors[label] || '#636e72');
  
  if (dashboardCategoryChart) {
    dashboardCategoryChart.destroy();
  }
  
  dashboardCategoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#0a0e1a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#ffffff',
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
            }
          }
        }
      }
    }
  });
}

// Modal de adicionar transação
async function openAddTransactionModal() {
  await loadCategoriesIntoSelect();
  openModal('addTransactionModal');
}

// Carrega categorias no select
async function loadCategoriesIntoSelect() {
  try {
    const categories = await categoriesAPI.getAll();
    const typeSelect = document.getElementById('transactionType');
    const categorySelect = document.getElementById('transactionCategory');
    
    const updateCategories = () => {
      const type = typeSelect.value;
      const filtered = categories.filter(c => c.category_type === type || c.category_type === 'both');
      
      categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>' +
        filtered.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    };
    
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
    loadDashboard(); // Recarrega dados
  } catch (error) {
    showToast(error.message || 'Erro ao adicionar transação', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Adicionar';
  }
});

// Modal de depósito
function openDepositModal() {
  openModal('depositModal');
}

document.getElementById('depositForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const amount = toNumber(document.getElementById('depositAmount').value);
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Processando...';
  
  try {
    await accountAPI.deposit(amount);
    showToast('Depósito realizado com sucesso!', 'success');
    closeModal('depositModal');
    document.getElementById('depositForm').reset();
    loadDashboard();
  } catch (error) {
    showToast(error.message || 'Erro ao realizar depósito', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Confirmar Depósito';
  }
});

// Modal de transferência
function openTransferModal() {
  openModal('transferModal');
}

document.getElementById('transferForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const recipient = document.getElementById('transferRecipient').value;
  const amount = toNumber(document.getElementById('transferAmount').value);
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Processando...';
  
  try {
    await accountAPI.transfer(recipient, amount);
    showToast('Transferência realizada com sucesso!', 'success');
    closeModal('transferModal');
    document.getElementById('transferForm').reset();
    loadDashboard();
  } catch (error) {
    showToast(error.message || 'Erro ao realizar transferência', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Confirmar Transferência';
  }
});

// Fecha modais ao clicar fora
['addTransactionModal', 'depositModal', 'transferModal'].forEach(modalId => {
  document.getElementById(modalId).addEventListener('click', (e) => {
    if (e.target.id === modalId) {
      closeModal(modalId);
    }
  });
});

// Filtro de período
document.getElementById('dashboardPeriodFilter').addEventListener('change', (e) => {
  dashboardPeriod = parseInt(e.target.value);
  renderDashboardCharts();
});

// Carrega dados ao iniciar
loadDashboard();
renderDashboardCharts();

