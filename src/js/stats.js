/**
 * Lógica da página de estatísticas
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let flowChart = null;
let categoryChart = null;
let currentPeriod = 30;

// Carrega estatísticas
async function loadStats() {
  try {
    const transactions = await transactionsAPI.getAll();
    const categories = await categoriesAPI.getAll();
    
    // Filtra transações pelo período
    const now = new Date();
    const periodStart = new Date(now.getTime() - (currentPeriod * 24 * 60 * 60 * 1000));
    
    const periodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= periodStart && date <= now;
    });
    
    // Calcula totais
    const totalIncome = periodTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = periodTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Atualiza resumo
    document.getElementById('totalIncomeStats').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenseStats').textContent = formatCurrency(totalExpense);
    document.getElementById('periodBalance').textContent = formatCurrency(totalIncome - totalExpense);
    
    // Renderiza gráficos
    renderFlowChart(periodTransactions);
    renderCategoryChart(periodTransactions, categories);
    renderCategoryList(periodTransactions, categories);
  } catch (error) {
    showToast('Erro ao carregar estatísticas', 'erro');
    console.error(error);
  }
}

// Renderiza gráfico de fluxo
function renderFlowChart(transactions) {
  const ctx = document.getElementById('flowChart').getContext('2d');
  
  // Agrupa transações por dia
  const dailyData = {};
  const now = new Date();
  
  // Inicializa todos os dias do período com zero
  for (let i = currentPeriod - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = { income: 0, expense: 0 };
  }
  
  // Preenche com dados reais
  transactions.forEach(t => {
    const dateStr = new Date(t.date).toISOString().split('T')[0];
    if (dailyData[dateStr]) {
      if (t.transaction_type === 'income') {
        dailyData[dateStr].income += t.amount;
      } else {
        dailyData[dateStr].expense += t.amount;
      }
    }
  });
  
  const labels = Object.keys(dailyData).map(date => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  
  const incomeData = Object.values(dailyData).map(d => d.income);
  const expenseData = Object.values(dailyData).map(d => d.expense);
  
  // Destrói gráfico anterior se existir
  if (flowChart) {
    flowChart.destroy();
  }
  
  flowChart = new Chart(ctx, {
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
          labels: {
            color: '#ffffff'
          }
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
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#8b95a8'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

// Renderiza gráfico de categorias
function renderCategoryChart(transactions, categories) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  // Agrupa despesas por categoria
  const categoryData = {};
  const categoryColors = {};
  
  transactions.filter(t => t.transaction_type === 'expense').forEach(t => {
    const categoryName = t.category || 'Outros';
    categoryData[categoryName] = (categoryData[categoryName] || 0) + t.amount;
    
    // Busca cor da categoria
    const cat = categories.find(c => c.name === categoryName);
    if (cat && !categoryColors[categoryName]) {
      categoryColors[categoryName] = cat.color;
    }
  });
  
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  const colors = labels.map(label => categoryColors[label] || '#636e72');
  
  // Destrói gráfico anterior se existir
  if (categoryChart) {
    categoryChart.destroy();
  }
  
  categoryChart = new Chart(ctx, {
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
            padding: 15,
            font: {
              size: 12
            }
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

// Renderiza lista de categorias
function renderCategoryList(transactions, categories) {
  const container = document.getElementById('categoryList');
  
  // Agrupa por categoria
  const categoryData = {};
  
  transactions.filter(t => t.transaction_type === 'expense').forEach(t => {
    const categoryName = t.category || 'Outros';
    if (!categoryData[categoryName]) {
      const cat = categories.find(c => c.name === categoryName);
      categoryData[categoryName] = {
        amount: 0,
        count: 0,
        icon: cat ? cat.icon : '💵',
        color: cat ? cat.color : '#636e72'
      };
    }
    categoryData[categoryName].amount += t.amount;
    categoryData[categoryName].count++;
  });
  
  const total = Object.values(categoryData).reduce((sum, cat) => sum + cat.amount, 0);
  
  // Ordena por valor
  const sorted = Object.entries(categoryData).sort((a, b) => b[1].amount - a[1].amount);
  
  if (sorted.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--foreground-muted); padding: 20px;">Nenhuma despesa no período</p>';
    return;
  }
  
  container.innerHTML = sorted.map(([name, data]) => {
    const percentage = ((data.amount / total) * 100).toFixed(1);
    return `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${data.icon}</span>
            <div>
              <p style="font-weight: 600;">${name}</p>
              <p style="font-size: 12px; color: var(--foreground-muted);">${data.count} transaç${data.count > 1 ? 'ões' : 'ão'}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="font-weight: bold; color: ${data.color};">${formatCurrency(data.amount)}</p>
            <p style="font-size: 12px; color: var(--foreground-muted);">${percentage}%</p>
          </div>
        </div>
        <div style="width: 100%; height: 6px; background: var(--background-secondary); border-radius: 3px; overflow: hidden;">
          <div style="width: ${percentage}%; height: 100%; background: ${data.color}; transition: var(--transition);"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Filtro de período
document.getElementById('periodFilter').addEventListener('change', (e) => {
  currentPeriod = parseInt(e.target.value);
  loadStats();
});

// Carrega estatísticas ao iniciar
loadStats();

