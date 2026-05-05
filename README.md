# Gestão PJ — Sistema de Gestão de Prestadores

Sistema multiusuário para gestão de prestadores PJ, tarefas (To-Do + Kanban), relatórios e timeline de atividades. Com controle de acesso por perfil (Admin / Gestor).

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Banco:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- MongoDB rodando localmente (ou MongoDB Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com sua MONGO_URI se necessário
npm install
npm run seed    # Cria o usuário admin
npm run dev     # Inicia na porta 3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev     # Inicia na porta 5173
```

### 3. Acessar

- Abra `http://localhost:5173`
- Login: `admin@gestaopj.com` / `Admin@123`

---

## MongoDB Atlas

Para usar Atlas em vez de MongoDB local:

1. Crie um cluster em [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Copie a connection string
3. No `backend/.env`, altere:
   ```
   MONGO_URI=mongodb+srv://usuario:senha@cluster.xxxxx.mongodb.net/gestao-pj
   ```

---

## Usuários

| Tipo   | Acesse                                        |
| ------ | --------------------------------------------- |
| Admin  | Vê tudo, cria gestores, atribui prestadores   |
| Gestor | Vê apenas prestadores e tarefas do seu escopo |

**Criar gestores:** Dashboard > Gestores > Novo Gestor (disponível apenas para Admin)

---

## Endpoints da API

| Método | Rota                              | Descrição                    |
| ------ | --------------------------------- | ---------------------------- |
| POST   | /api/auth/login                   | Login                        |
| GET    | /api/auth/me                      | Usuário logado               |
| GET    | /api/users                        | Listar usuários (admin)      |
| POST   | /api/users                        | Criar usuário (admin)        |
| PATCH  | /api/users/:id                    | Editar usuário (admin)       |
| DELETE | /api/users/:id                    | Remover usuário (admin)      |
| PATCH  | /api/users/:id/reset-password     | Redefinir senha (admin)      |
| GET    | /api/providers                    | Listar prestadores           |
| POST   | /api/providers                    | Criar prestador              |
| GET    | /api/providers/:id                | Detalhe prestador            |
| PATCH  | /api/providers/:id                | Editar prestador             |
| DELETE | /api/providers/:id                | Remover prestador            |
| GET    | /api/tasks                        | Listar tarefas               |
| POST   | /api/tasks                        | Criar tarefa                 |
| PATCH  | /api/tasks/:id                    | Editar tarefa                |
| DELETE | /api/tasks/:id                    | Remover tarefa               |
| POST   | /api/tasks/:id/move               | Mover tarefa (Kanban)        |
| POST   | /api/tasks/:id/allocate           | Alocar tarefa a prestador    |
| GET    | /api/activities                   | Listar atividades            |
| GET    | /api/reports/summary              | Resumo (cards)               |
| GET    | /api/reports/provider-performance | Desempenho por prestador     |
| GET    | /api/reports/manager-performance  | Desempenho por gestor        |
| GET    | /api/reports/task-distribution    | Distribuição por status      |
| GET    | /api/reports/timeline             | Timeline de atividades       |
| POST   | /api/admin/import                 | Importar dados do localStorage |

---

## Variáveis de Ambiente (backend/.env)

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/gestao-pj
JWT_SECRET=sua-chave-secreta
CORS_ORIGIN=http://localhost:5173
```
