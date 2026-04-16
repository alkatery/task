import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_AR = {
  pending: 'جديدة', in_progress: 'قيد العمل', waiting_approval: 'بانتظار اعتماد',
  approved: 'معتمدة', completed: 'مكتملة', revision: 'مراجعة', cancelled: 'ملغاة'
};

export default function Tasks() {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    assigned_to: searchParams.get('assigned_to') || '',
    client_id: '',
    overdue: searchParams.get('overdue') || ''
  });

  const loadTasks = () => {
    const qs = Object.entries(filters).filter(([,v]) => v).map(([k,v]) => `${k}=${v}`).join('&');
    api(`/tasks?${qs}`).then(setTasks).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    api('/users').then(setUsers).catch(() => {});
    api('/clients').then(setClients).catch(() => {});
    api('/workflows').then(setWorkflows).catch(() => {});
  }, [filters]);

  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', client_id: '', workflow_id: '', priority: 'medium', due_date: '' });

  const createTask = async () => {
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
      await api('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      setForm({ title: '', description: '', assigned_to: '', client_id: '', workflow_id: '', priority: 'medium', due_date: '' });
      loadTasks();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>المهام</h2>
        {['admin', 'team'].includes(user?.role) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ مهمة جديدة</button>
        )}
      </div>

      <div className="filters">
        <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="form-select" value={filters.assigned_to} onChange={e => setFilters(f => ({ ...f, assigned_to: e.target.value }))}>
          <option value="">كل الفريق</option>
          <option value="me">مهامي</option>
          {users.filter(u => u.role === 'team').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="form-select" value={filters.client_id} onChange={e => setFilters(f => ({ ...f, client_id: e.target.value }))}>
          <option value="">كل العملاء</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={filters.overdue === '1'} onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked ? '1' : '' }))} />
          متأخرة فقط
        </label>
      </div>

      <div className="card">
        {loading ? <div className="loader">جاري التحميل...</div> : tasks.length === 0 ? (
          <div className="empty"><div className="empty-icon">📋</div>لا توجد مهام</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>المهمة</th><th>المسار</th><th>المسؤول</th><th>العميل</th><th>الحالة</th><th>الأولوية</th><th>الموعد</th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{t.workflow_name || '—'}</td>
                    <td>{t.assignee_name || '—'}</td>
                    <td>{t.client_name || '—'}</td>
                    <td><span className={`badge badge-${t.status}`}>{STATUS_AR[t.status]}</span></td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td style={{ fontSize: 13 }}>{t.due_date ? new Date(t.due_date).toLocaleDateString('ar-SA') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">مهمة جديدة</div>
            <div className="form-group">
              <label className="form-label">العنوان *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">الوصف</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">المسار</label>
                <select className="form-select" value={form.workflow_id} onChange={e => setForm(f => ({ ...f, workflow_id: e.target.value }))}>
                  <option value="">بدون مسار (مهمة يدوية)</option>
                  {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">العميل</label>
                <select className="form-select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">اختر العميل</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">المسؤول</label>
                <select className="form-select" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">غير محدد</option>
                  {users.filter(u => u.role === 'team').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الأولوية</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">تاريخ التسليم</label>
              <input className="form-input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={createTask} disabled={!form.title}>إنشاء</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
