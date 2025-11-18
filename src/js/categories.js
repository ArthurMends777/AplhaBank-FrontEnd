/**
 * Lógica da página de categorias
 */

// Verifica autenticação
if (!checkAuth()) {
  window.location.href = 'index.html';
}

let categories = [];

// Carrega categorias
async function loadCategories() {
  try {
    categories = await categoriesAPI.getAll();
    renderCategories();
  } catch (error) {
    showToast('Erro ao carregar categorias', 'erro');
    console.error(error);
  }
}

// Renderiza categorias
function renderCategories() {
  const expenseContainer = document.getElementById('expenseCategories');
  const incomeContainer = document.getElementById('incomeCategories');
  const bothContainer = document.getElementById('bothCategories');
  
  const expenseCategories = categories.filter(c => c.category_type === 'expense');
  const incomeCategories = categories.filter(c => c.category_type === 'income');
  const bothCategories = categories.filter(c => c.category_type === 'both');
  
  expenseContainer.innerHTML = expenseCategories.map(c => createCategoryCard(c)).join('');
  incomeContainer.innerHTML = incomeCategories.map(c => createCategoryCard(c)).join('');
  bothContainer.innerHTML = bothCategories.map(c => createCategoryCard(c)).join('');
}

// Cria card de categoria
function createCategoryCard(category) {
  return `
    <div class="card" style="padding: 16px; text-align: center; cursor: pointer; transition: var(--transition);" 
         onclick="openEditCategoryModal('${category.id}')"
         onmouseover="this.style.borderColor='${category.color}'" 
         onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-size: 32px; margin-bottom: 8px;">${category.icon}</div>
      <p style="font-weight: 600; font-size: 14px; color: ${category.color};">${category.name}</p>
    </div>
  `;
}

// Abre modal para adicionar categoria
function openAddCategoryModal() {
  document.getElementById('categoryModalTitle').textContent = 'Nova Categoria';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('deleteCategoryBtn').classList.add('hidden');
  openModal('categoryModal');
}

// Abre modal para editar categoria
function openEditCategoryModal(id) {
  const category = categories.find(c => c.id === id);
  if (!category) return;
  
  document.getElementById('categoryModalTitle').textContent = 'Editar Categoria';
  document.getElementById('categoryId').value = category.id;
  document.getElementById('categoryName').value = category.name;
  document.getElementById('categoryIcon').value = category.icon;
  document.getElementById('categoryColor').value = category.color;
  document.getElementById('categoryType').value = category.type;
  document.getElementById('deleteCategoryBtn').classList.remove('hidden');
  
  openModal('categoryModal');
}

// Formulário de categoria
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('categoryId').value;
  const name = document.getElementById('categoryName').value.trim();
  const icon = document.getElementById('categoryIcon').value.trim();
  const color = document.getElementById('categoryColor').value;
  const type = document.getElementById('categoryType').value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Salvando...';
  
  try {
    if (id) {
      await categoriesAPI.update(id, { name, icon, color, type });
      showToast('Categoria atualizada com sucesso!', 'success');
    } else {
      await categoriesAPI.create({ name, icon, color, type });
      showToast('Categoria criada com sucesso!', 'success');
    }
    
    closeModal('categoryModal');
    loadCategories();
  } catch (error) {
    showToast(error.message || 'Erro ao salvar categoria', 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Salvar';
  }
});

// Deleta categoria
async function deleteCategory() {
  if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
  
  const id = document.getElementById('categoryId').value;
  
  try {
    await categoriesAPI.delete(id);
    showToast('Categoria excluída com sucesso!', 'success');
    closeModal('categoryModal');
    loadCategories();
  } catch (error) {
    showToast(error.message || 'Erro ao excluir categoria', 'erro');
  }
}

// Fecha modal ao clicar fora
document.getElementById('categoryModal').addEventListener('click', (e) => {
  if (e.target.id === 'categoryModal') {
    closeModal('categoryModal');
  }
});

// Carrega categorias ao iniciar
loadCategories();

