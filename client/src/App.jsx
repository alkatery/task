import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Clients from './pages/Clients';
import Workflows from './pages/Workflows';
import Users from './pages/Users';
import Transcription from './pages/Transcription';
import Reports from './pages/Reports';
import ClientPortal from './pages/ClientPortal';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/portal/*" element={
        <PrivateRoute roles={['client']}><ClientPortal /></PrivateRoute>
      } />
      <Route path="/*" element={
        <PrivateRoute roles={['admin', 'team']}>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
              <Route path="/transcription" element={<Transcription />} />
              <Route path="/reports" element={<PrivateRoute roles={['admin']}><Reports /></PrivateRoute>} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}
