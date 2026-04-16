import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLE_AR = { admin: 'مدير', team: 'فريق', client: 'عميل' };

export default function Users() {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '123456', role: 'team' });

  const load = () => api('/users').then(setUsers).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api('/users', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      setForm({ name: '', email: '', password: '123456', role: 'team' });
      load();
    } catch (err) { alert(err.message); }
  };

  const toggleActive = async (u) => {
    await api(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !u.is_active }) });
    load();
  };

  const resetPass = async (u) => {
    const pw = prompt('كلمة المرور الجديدة:', '123456');
    if (!pw) return;
    await api(`/users/${u.id}/reset-password`, { method: 'POST', body: JSON.stringify({ password: pw }) });
    alert('تم إعادة تعيين كلمة المرور');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>المستخدمون</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ مستخدم جديد</button>
      </div>
      <div className="card">
        {loading ? <div className="loader">جاري التحميل...</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{u.email}</td>
                    <td><span className={`badge badge-${u.role === 'admin' ? 'approved' : u.role === 'team' ? 'in_progress' : 'pending'}`}>{ROLE_AR[u.role]}</span></td>
                    <td><span className={`badge ${u.is_active ? 'badge-completed' : 'badge-cancelled'}`}>{u.is_active ? 'نشط' : 'معطل'}</span></td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => toggleActive(u)}>{u.is_active ? 'تعطيل' : 'تفعيل'}</button>
                      <button className="btn btn-sm btn-outline" onClick={() => resetPass(u)}>إعادة كلمة المرور</button>
                    </td>
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
            <div className="modal-title">مستخدم جديد</div>
            <div className="form-group"><label className="form-label">الاسم</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">البريد</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">كلمة المرور</label><input className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">الدور</label>
                <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="team">عضو فريق</option><option value="admin">مدير</option><option value="client">عميل</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={save} disabled={!form.name || !form.email}>إنشاء</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
