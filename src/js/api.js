// ========================================
// ALPHA BANK API - Integração com Backend Rust
// ========================================

const API_BASE_URL = 'http://localhost:8080/api';

// ========================================
// Utilitários de Autenticação
// ========================================

function getToken() {
    return localStorage.getItem('auth_token');
}

function setToken(token) {
    localStorage.setItem('auth_token', token);
}

function removeToken() {
    localStorage.removeItem('auth_token');
}

function getHeaders(includeAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
}

async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();
    
    if (!response.ok) {
        if (response.status === 401) {
            removeToken();
            window.location.href = '/index.html';
        }
        throw new Error(data.error || data || 'Falha na requisição');
    }
    
    return data;
}

// ========================================
// API de Autenticação
// ========================================

const authAPI = {
    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({
                full_name: userData.fullName || userData.full_name,
                email: userData.email,
                password: userData.password,
                cpf: userData.cpf,
                birth_date: userData.birthDate || userData.birth_date,
                phone: userData.phone
            })
        });
        const data = await handleResponse(response);
        if (data.token) {
            setToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ email, password })
        });
        const data = await handleResponse(response);
        if (data.token) {
            setToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async updateProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(profileData)
        });
        return handleResponse(response);
    },

    async changePassword(oldPassword, newPassword) {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });
        return handleResponse(response);
    },

    async forgotPassword(email) {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ email })
        });
        return handleResponse(response);
    },

    logout() {
        removeToken();
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    }
};

// ========================================
// API de Transações
// ========================================

const transactionsAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async getById(id) {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async create(transactionData) {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                description: transactionData.description,
                amount: toNumber(transactionData.amount),
                transaction_type: transactionData.type || transactionData.transaction_type,
                category_id: transactionData.category_id || "",
                date: transactionData.date || new Date().toISOString().split('T')[0]
            })
        });
        return handleResponse(response);
    },

    async update(id, transactionData) {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                description: transactionData.description,
                amount: toNumber(transactionData.amount),
                transaction_type: transactionData.type || transactionData.transaction_type,
                category_id: transactionData.category_id || "",
                date: transactionData.date
            })
        });
        return handleResponse(response);
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// ========================================
// API de Categorias
// ========================================

const categoriesAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async create(categoryData) {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: categoryData.name,
                icon: categoryData.icon,
                color: categoryData.color,
                category_type: categoryData.type || categoryData.category_type
            })
        });
        return handleResponse(response);
    },

    async update(id, categoryData) {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                name: categoryData.name,
                icon: categoryData.icon,
                color: categoryData.color
            })
        });
        return handleResponse(response);
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// ========================================
// API de Metas
// ========================================

const goalsAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/goals`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async getById(id) {
        const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async create(goalData) {
        const response = await fetch(`${API_BASE_URL}/goals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: goalData.name,
                target_amount: parseFloat(goalData.targetAmount || goalData.target_amount),
                deadline: goalData.deadline,
                icon: goalData.icon || '🎯'
            })
        });
        return handleResponse(response);
    },

    async update(id, goalData) {
        const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                name: goalData.name,
                target_amount: parseFloat(goalData.targetAmount || goalData.target_amount),
                deadline: goalData.deadline,
                icon: goalData.icon
            })
        });
        return handleResponse(response);
    },

    async addProgress(id, amount) {
        const response = await fetch(`${API_BASE_URL}/goals/${id}/progress`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ amount: parseFloat(amount) })
        });
        return handleResponse(response);
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// ========================================
// API de Recorrências
// ========================================

const recurringAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/recurring`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async create(recurringData) {
        const response = await fetch(`${API_BASE_URL}/recurring`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                description: recurringData.description,
                amount: parseFloat(recurringData.amount),
                transaction_type: recurringData.type || recurringData.transaction_type,
                category_id: recurringData.categoryId || recurringData.category_id || null,
                frequency: recurringData.frequency
            })
        });
        return handleResponse(response);
    },

    async update(id, recurringData) {
        const body = {};
        if (recurringData.description) body.description = recurringData.description;
        if (recurringData.amount) body.amount = parseFloat(recurringData.amount);
        if (recurringData.hasOwnProperty('active')) body.active = recurringData.active;
        if (recurringData.frequency) body.frequency = recurringData.frequency;
        
        const response = await fetch(`${API_BASE_URL}/recurring/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        return handleResponse(response);
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/recurring/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async generatePending() {
        const response = await fetch(`${API_BASE_URL}/recurring/generate`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async toggle(id, active) {
        return await this.update(id, { active });
    }
};

// ========================================
// API de Notificações
// ========================================

const notificationsAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async create(notificationData) {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                title: notificationData.title,
                message: notificationData.message,
                notification_type: notificationData.type || notificationData.notification_type || 'info'
            })
        });
        return handleResponse(response);
    },

    async markAsRead(id) {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async delete(id) {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// ========================================
// Funções auxiliares (mantidas para compatibilidade)
// ========================================

const accountAPI = {
    async getBalance() {
        // Calcula saldo baseado nas transações
        const transactions = await transactionsAPI.getAll();
        const balance = transactions.reduce((total, t) => {
            const amount = parseFloat(t.amount) || 0;
            return total + (t.transaction_type === 'income' ? amount : -amount);
        }, 0);
        return { balance };
    },

    async deposit(amount) {
        // Cria uma transação de depósito
        return await transactionsAPI.create({
            description: 'Depósito',
            amount: parseFloat(amount),
            type: 'income',
            date: new Date().toISOString().split('T')[0]
        });
    },

    async transfer(recipient, amount) {
        // Cria uma transação de transferência (despesa)
        return await transactionsAPI.create({
            description: `Transferência para ${recipient}`,
            amount: parseFloat(amount),
            type: 'expense',
            date: new Date().toISOString().split('T')[0]
        });
    }
};

const statsAPI = {
    async getMonthlySummary() {
        const transactions = await transactionsAPI.getAll();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const totalIncome = monthlyTransactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = monthlyTransactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Dados diários para o gráfico (últimos 7 dias)
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayTransactions = monthlyTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.toDateString() === date.toDateString();
            });
            const dayTotal = dayTransactions.reduce((sum, t) => {
                return sum + (t.transaction_type === 'expense' ? t.amount : 0);
            }, 0);
            dailyData.push({
                day: date.getDay(),
                amount: dayTotal
            });
        }
        
        return {
            month: currentMonth + 1,
            year: currentYear,
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            dailyData
        };
    },
    
    async getCategoryStats() {
        const transactions = await transactionsAPI.getAll();
        const categories = await categoriesAPI.getAll();
        const expenses = transactions.filter(t => t.transaction_type === 'expense');
        
        const categoryTotals = {};
        expenses.forEach(t => {
            const category = categories.find(c => c.id === t.category_id);
            const categoryName = category ? category.name : 'Outros';
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + t.amount;
        });
        
        const totalExpense = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        
        const categoryList = Object.entries(categoryTotals).map(([name, total]) => ({
            name,
            totalExpense: total,
            percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0
        }));
        
        return { categories: categoryList.sort((a, b) => b.totalExpense - a.totalExpense) };
    }
};

// ========================================
// Verificação de Autenticação
// ========================================

function checkAuth() {
    const token = getToken();
    const publicPages = ['index.html', 'register.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!token && !publicPages.includes(currentPage)) {
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

// Executar verificação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Função auxiliar para gerar IDs (não mais necessária, mas mantida para compatibilidade)
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

