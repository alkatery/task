import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/', label: 'لوحة التحكم', icon: '📊', roles: ['admin', 'team'] },
  { path: '/tasks', label: 'المهام', icon: '📋', roles: ['admin', 'team'] },
  { path: '/clients', label: 'العملاء', icon: '👥', roles: ['admin', 'team'] },
  { path: '/workflows', label: 'المسارات', icon: '🔄', roles: ['admin', 'team'] },
  { path: '/transcription', label: 'التفريغ', icon: '🎙️', roles: ['admin', 'team'] },
  { path: '/reports', label: 'التقارير', icon: '📈', roles: ['admin'] },
  { path: '/users', label: 'المستخدمون', icon: '⚙️', roles: ['admin'] },
];

export default function Layout({ children }) {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    api('/notifications/unread-count').then(d => setNotifCount(d.count)).catch(() => {});
    const interval = setInterval(() => {
      api('/notifications/unread-count').then(d => setNotifCount(d.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>{collapsed ? 'م' : 'منصة العمليات'}</h2>
          <button className="btn-icon" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '◀' : '▶'}
          </button>
        </div>
        <nav>
          {NAV.filter(n => n.roles.includes(user?.role)).map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && <span className="user-name">{user?.name}</span>}
          <button className="btn-icon" onClick={() => { logout(); navigate('/login'); }} title="تسجيل خروج">🚪</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-right">
            <h1 className="page-title"></h1>
          </div>
          <div className="topbar-left">
            <button className="btn-icon notif-btn" onClick={() => navigate('/tasks?status=waiting_approval')}>
              🔔 {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
            </button>
            <span className="user-badge">{user?.name}</span>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}
