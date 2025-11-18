# Alpha Bank - Frontend Integrado

Este é o frontend do Alpha Bank, totalmente integrado com a API desenvolvida em Rust.

## 🏗️ Estrutura do Projeto

O projeto segue uma estrutura clara, separando as páginas HTML, estilos CSS e a lógica JavaScript:

```
alpha-bank-frontend-integrated/
├── index.html              # Login
├── register.html           # Cadastro
├── welcome.html            # Boas-vindas
├── dashboard.html          # Dashboard principal
├── transactions.html       # Gerenciar transações
├── categories.html         # Gerenciar categorias
├── goals.html              # Metas financeiras
├── recurring.html          # Despesas recorrentes
├── notifications.html      # Notificações
├── stats.html              # Estatísticas
├── simulator.html          # Simulador de orçamento
├── profile.html            # Perfil do usuário
├── settings.html           # Configurações
└── src/
    ├── css/
    │   └── style.css       # Estilos globais
    ├── js/
    │   ├── api.js          # Lógica de integração com o backend
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── transactions.js
    │   ├── categories.js
    │   ├── goals.js
    │   ├── recurring.js
    │   ├── notifications.js
    │   ├── stats.js
    │   ├── simulator.js
    │   ├── profile.js
    │   ├── settings.js
    │   └── utils.js
    └── assets/
        ├── 45-135.webp
        └── (Arquivos SVG e imagens)
```

## 🔗 Integração com o Backend

### Configuração da API

O arquivo `src/js/api.js` gerencia toda a comunicação com o backend em Rust.

**URL da API:** `http://localhost:8080/api`

### Autenticação JWT

*   O token de autenticação é armazenado no `localStorage` sob a chave `auth_token`.
*   O token é enviado automaticamente em todas as requisições protegidas.
*   O sistema realiza o redirecionamento automático para a página de login caso o token seja inválido ou expire.

### Endpoints Utilizados

| Módulo | Endpoint | Método | Descrição |
| :--- | :--- | :--- | :--- |
| **Autenticação** | `/api/auth/register` | `POST` | Cadastro de usuário |
| | `/api/auth/login` | `POST` | Login |
| | `/api/me` | `GET` | Obter perfil |
| | `/api/me` | `PUT` | Atualizar perfil |
| | `/api/auth/change-password` | `POST` | Alterar senha |
| | `/api/auth/forgot-password` | `POST` | Recuperar senha |
| **Transações** | `/api/transactions` | `GET` | Listar transações |
| | `/api/transactions` | `POST` | Criar transação |
| | `/api/transactions/:id` | `PUT` | Atualizar transação |
| | `/api/transactions/:id` | `DELETE` | Excluir transação |
| **Categorias** | `/api/categories` | `GET` | Listar categorias |
| | `/api/categories` | `POST` | Criar categoria |
| | `/api/categories/:id` | `PUT` | Atualizar categoria |
| | `/api/categories/:id` | `DELETE` | Excluir categoria |
| **Metas** | `/api/goals` | `GET` | Listar metas |
| | `/api/goals` | `POST` | Criar meta |
| | `/api/goals/:id` | `PUT` | Atualizar meta |
| | `/api/goals/:id/progress` | `POST` | Adicionar progresso |
| | `/api/goals/:id` | `DELETE` | Excluir meta |
| **Recorrências** | `/api/recurring` | `GET` | Listar recorrências |
| | `/api/recurring` | `POST` | Criar recorrência |
| | `/api/recurring/:id` | `PUT` | Atualizar recorrência |
| | `/api/recurring/:id` | `DELETE` | Excluir recorrência |
| | `/api/recurring/generate` | `POST` | Gerar transações pendentes |
| **Notificações** | `/api/notifications` | `GET` | Listar notificações |
| | `/api/notifications` | `POST` | Criar notificação |
| | `/api/notifications/:id/read` | `PUT` | Marcar como lida |
| | `/api/notifications/:id` | `DELETE` | Excluir notificação |

## 🚀 Guia de Execução

### 1. Iniciar o Backend

Certifique-se de que o backend em Rust esteja em execução:

```bash
cd alpha-bank-backend-mysql
cargo run
```

O backend estará acessível em `http://localhost:8080`.

### 2. Servir o Frontend

O frontend é composto por arquivos estáticos e pode ser servido por qualquer servidor HTTP simples.

#### Opção 1: Python (Recomendado)

```bash
cd alpha-bank-frontend-integrated
python -m http.server 3000
```

Acesse: `http://localhost:3000`

#### Opção 2: Node.js

```bash
cd alpha-bank-frontend-integrated
npx http-server -p 3000
```

### 3. Teste Inicial

1.  Abra `http://localhost:3000` no navegador.
2.  Crie uma conta e faça login.
3.  Explore as funcionalidades do dashboard e das páginas de gerenciamento.

## 🔧 Configurações Adicionais

### Alteração da URL da API

Para alterar o endereço do backend, edite a variável `API_BASE_URL` no arquivo `src/js/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### CORS

O backend já está configurado para desenvolvimento.

```rust
.wrap(
    Cors::default()
        .allowed_origin("https://seu-dominio.com")
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
        .allowed_headers(vec![header::AUTHORIZATION, header::CONTENT_TYPE])
        .max_age(3600)
)
```

## 📝 Notas de Desenvolvimento

### Convenção de Nomenclatura

O backend utiliza a convenção **snake_case**, enquanto o frontend utiliza **camelCase**. O arquivo `api.js` é responsável por realizar a conversão de nomenclatura automaticamente no envio e recebimento de dados:

```javascript
// Frontend envia:
{ fullName: "João", birthDate: "1990-01-01" }

// API recebe:
{ full_name: "João", birth_date: "1990-01-01" }
```

### Armazenamento Local (`localStorage`)

Apenas o **token JWT** e os **dados básicos do usuário** são armazenados no `localStorage`. Todos os demais dados são carregados diretamente da API.

### Simulador de Orçamento

O simulador de orçamento opera com cálculos locais. Para uma integração completa, seria necessário implementar um endpoint específico (`/api/simulate`) no backend.

## ✅ Funcionalidades Integradas

*   Autenticação com JWT
*   CRUD de Transações
*   CRUD de Categorias
*   CRUD de Metas Financeiras
*   CRUD de Despesas Recorrentes
*   CRUD de Notificações
*   Gerenciamento de Perfil do usuário
*   Estatísticas e gráficos
*   Simulador de orçamento
*   Tratamento de erros e redirecionamento automático de autenticação.

O frontend está totalmente integrado com a API Rust.
