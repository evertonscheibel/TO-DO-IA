import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Prestadores from './pages/Prestadores';
import TodoGeral from './pages/TodoGeral';
import Kanban from './pages/Kanban';
import Relatorios from './pages/Relatorios';
import Auditoria from './pages/Auditoria';
import Acessos from './pages/Acessos';
import KnowledgeBase from './pages/KnowledgeBase';
import KnowledgeDetail from './pages/KnowledgeDetail';
import QuotesContracts from './pages/QuotesContracts';
import Timeline from './pages/Timeline';
import Login from './pages/Login';

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/quotes"
        element={
          <ProtectedRoute>
            <Layout><QuotesContracts /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><TodoGeral /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prestadores"
        element={
          <ProtectedRoute>
            <Layout><Prestadores /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kanban"
        element={
          <ProtectedRoute>
            <Layout><Kanban /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <Layout><Relatorios /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/timeline"
        element={
          <ProtectedRoute>
            <Layout><Timeline /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/acessos"
        element={
          <ProtectedRoute>
            <Layout><Acessos /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge"
        element={
          <ProtectedRoute>
            <Layout><KnowledgeBase /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge/:id"
        element={
          <ProtectedRoute>
            <Layout><KnowledgeDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
