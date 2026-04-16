import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Clients() {
  const { api, user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'sheikh', contact_name: '', contact_phone: '', contact_email: '', notes: '' });
  const [selected, setSelected] = useState(null);

  const load = () => api('/clients').then(setClients).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (selected) {
        await api(`/clients/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/clients', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false);
      setForm({ name: '', type: 'sheikh', contact_name: '', contact_phone: '', contact_email: '', notes: '' });
      setSelected(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const edit = (c) => { setSelected(c); setForm({ name: c.name, type: c.type, contact_name: c.contact_name || '', contact_phone: c.contact_phone || '', contact_email: c.contact_email || '', notes: c.notes || '' }); setShowModal(true); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>العملاء</h2>
        {user.role === 'admin' && <button className="btn btn-primary" onClick={() => { setSelected(null); setForm({ name: '', type: 'sheikh', contact_name: '', contact_phone: '', contact_email: '', notes: '' }); setShowModal(true); }}>+ عميل جديد</button>}
      </div>

      <div className="card">
        {loading ? <div className="loader">جاري التحميل...</div> : clients.length === 0 ? (
          <div className="empty"><div className="empty-icon">👥</div>لا يوجد عملاء</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>الاسم</th><th>النوع</th><th>جهة الاتصال</th><th>مشاريع نشطة</th><th>مهام معلقة</th><th></th></tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td><span className="badge badge-in_progress">{c.type === 'sheikh' ? 'شيخ' : c.type === 'association' ? 'جمعية' : 'أخرى'}</span></td>
                    <td>{c.contact_name || '—'}<br/><span style={{ fontSize: 12, color: '#9ca3af' }}>{c.contact_phone}</span></td>
                    <td>{c.active_projects}</td>
                    <td>{c.pending_tasks}</td>
                    <td>{user.role === 'admin' && <button className="btn btn-sm btn-outline" onClick={() => edit(c)}>تعديل</button>}</td>
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
            <div className="modal-title">{selected ? 'تعديل عميل' : 'عميل جديد'}</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">الاسم *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">النوع</label>
                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="sheikh">شيخ</option><option value="association">جمعية</option><option value="other">أخرى</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">اسم جهة الاتصال</label><input className="form-input" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">الهاتف</label><input className="form-input" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label className="form-label">البريد الإلكتروني (لبوابة العميل)</label><input className="form-input" type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={save} disabled={!form.name}>حفظ</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
