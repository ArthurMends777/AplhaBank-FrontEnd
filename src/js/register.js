/**
 * Lógica da página de cadastro
 */

// Máscara de CPF
document.getElementById('cpf').addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length <= 11) {
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
  }
});

// Máscara de Celular
document.getElementById('phone').addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length <= 11) {
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    e.target.value = value;
  }
});

// Validação de CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

// Validação de idade mínima (18 anos)
function validateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= 18;
}

// Formulário de cadastro
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('fullName').value.trim();
  const cpf = document.getElementById('cpf').value;
  const birthDate = document.getElementById('birthDate').value;
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const terms = document.getElementById('terms').checked;
  
  // Validações
  if (fullName.split(' ').length < 2) {
    showToast('Por favor, digite seu nome completo', 'erro');
    return;
  }
  
  if (!validateCPF(cpf)) {
    showToast('CPF inválido', 'erro');
    return;
  }
  
  if (!validateAge(birthDate)) {
    showToast('Você precisa ter pelo menos 18 anos', 'erro');
    return;
  }
  
  if (phone.replace(/\D/g, '').length !== 11) {
    showToast('Celular inválido', 'erro');
    return;
  }
  
  if (password !== confirmPassword) {
    showToast('As senhas não coincidem', 'erro');
    return;
  }
  
  if (!terms) {
    showToast('Você precisa aceitar os termos de uso', 'erro');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Criando conta...';
  
  try {
    await authAPI.register({
      fullName,
      cpf: cpf.replace(/\D/g, ''),
      birthDate,
      email,
      phone: phone.replace(/\D/g, ''),
      password
    });
    
    showToast('Conta criada com sucesso!', 'success');
    
    setTimeout(() => {
      window.location.href = 'welcome.html';
    }, 1000);
  } catch (error) {
    showToast(error.message || 'Erro ao criar conta', 'erro');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'CRIAR CONTA';
  }
});

