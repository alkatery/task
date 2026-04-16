import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_AR = {
  pending: 'جديدة', in_progress: 'قيد العمل', waiting_approval: 'بانتظار اعتماد',
  approved: 'معتمدة', completed: 'مكتملة', revision: 'مراجعة', cancelled: 'ملغاة'
};
const ACTION_AR = {
  created: 'إنشاء', status_changed: 'تغيير حالة', commented: 'تعليق',
  updated: 'تعديل', client_approved: 'اعتماد العميل', client_revision: 'مراجعة العميل'
};

export default function Dashboard() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/tasks/stats/dashboard').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader">جاري التحميل...</div>;
  if (!data) return <div className="empty">تعذر تحميل البيانات</div>;

  const { stats, recentTasks, recentLogs } = data;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>لوحة التحكم</h2>

      <div className="stats-grid">
        <div className="stat-card primary" onClick={() => navigate('/tasks?status=in_progress')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">مهام نشطة</div>
        </div>
        <div className="stat-card warning" onClick={() => navigate('/tasks?status=waiting_approval')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{stats.waiting_approval}</div>
          <div className="stat-label">بانتظار اعتماد</div>
        </div>
        <div className="stat-card danger" onClick={() => navigate('/tasks?overdue=1')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">متأخرة</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.completed_today}</div>
          <div className="stat-label">مكتملة اليوم</div>
        </div>
        <div className="stat-card info">
          <div className="stat-value">{stats.completed_week}</div>
          <div className="stat-label">مكتملة هذا الأسبوع</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">المهام النشطة</span>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/tasks')}>عرض الكل</button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty">لا توجد مهام نشطة</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>المهمة</th><th>المسؤول</th><th>العميل</th><th>الحالة</th><th>الأولوية</th></tr></thead>
                <tbody>
                  {recentTasks.map(t => (
                    <tr key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 500 }}>{t.title}</td>
                      <td>{t.assignee_name || '—'}</td>
                      <td>{t.client_name || '—'}</td>
                      <td><span className={`badge badge-${t.status}`}>{STATUS_AR[t.status]}</span></td>
                      <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">آخر النشاطات</span>
          </div>
          {recentLogs.map(l => (
            <div key={l.id} className="log-item">
              <div className="log-dot"></div>
              <div>
                <div><strong>{l.user_name}</strong> {ACTION_AR[l.action] || l.action} — {l.task_title}</div>
                <div className="log-time">{new Date(l.created_at).toLocaleString('ar-SA')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
