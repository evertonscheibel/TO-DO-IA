# 🚀 Gestão PJ — Sistema Inteligente de Gestão de Prestadores

Sistema robusto e inteligente para gestão completa de prestadores de serviço PJ, combinando ferramentas de produtividade (Kanban), gestão documental (Contratos/Orçamentos) e inteligência artificial.

![Status](https://img.shields.io/badge/status-active-success.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![MongoDB](https://img.shields.io/badge/mongodb-latest-brightgreen.svg)

## 🌟 Destaques

- **🤖 Assistente IA Integrado**: Chat inteligente para suporte à gestão e consultas rápidas.
- **📋 Kanban Dinâmico**: Fluxo de trabalho visual para tarefas de prestadores.
- **📄 Gestão de Contratos e Orçamentos**: Controle completo de documentos e propostas.
- **📚 Base de Conhecimento**: Central de documentação e procedimentos internos.
- **📈 Dashboard e Relatórios**: Visão analítica de performance e timeline de atividades.
- **🔐 Controle de Acesso (RBAC)**: Perfis diferenciados para Admin, Gestores e Prestadores.

## 🛠️ Tecnologias

### Frontend
- **React.js** com Vite
- **Context API** para estado global
- **CSS3 Moderno** com foco em UX/UI responsivo
- **React Router** para navegação SPA

### Backend
- **Node.js** & **Express**
- **MongoDB** (Mongoose ODM)
- **JWT** (JSON Web Tokens) para autenticação segura
- **Bcrypt** para criptografia de senhas

## 📦 Estrutura do Sistema

- **Dashboard**: Visão geral de métricas e KPIs.
- **Kanban**: Gestão visual de tarefas por status.
- **Prestadores**: Cadastro e acompanhamento de parceiros PJ.
- **Contratos & Orçamentos**: Repositório e gestão de documentos financeiros.
- **Base de Conhecimento**: Wiki interna com busca avançada.
- **Timeline**: Histórico detalhado de todas as atividades do sistema.

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js (v18+)
- MongoDB (Local ou Atlas)

### Configuração Rápida

1. **Backend**:
   ```bash
   cd backend
   npm install
   # Configure o .env (use .env.example como base)
   npm run seed    # Cria o usuário admin inicial
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Acesso**:
   - URL: `http://localhost:5173`
   - Credenciais padrão: `admin@gestaopj.com` / `Admin@123`

## 🔒 Segurança e Perfis

- **Admin**: Acesso total ao sistema, gestão de usuários e configurações globais.
- **Gestor**: Gerencia prestadores e tarefas sob sua responsabilidade.
- **Auditoria**: Timeline completa de alterações para rastreabilidade.

## 📝 Licença

Este projeto é privado e de uso interno. Todos os direitos reservados.

---
Desenvolvido por **Everton Scheibel**
