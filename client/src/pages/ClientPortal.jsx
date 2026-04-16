import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_AR = {
  pending: 'جديدة', in_progress: 'قيد العمل', waiting_approval: 'بانتظار اعتمادكم',
  approved: 'معتمدة', completed: 'مكتملة', revision: 'قيد المراجعة', cancelled: 'ملغاة'
};

export default function ClientPortal() {
  const { api, user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  const load = () => api('/tasks').then(setTasks).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const selectTask = async (t) => {
    const full = await api(`/tasks/${t.id}`);
    setSelected(full);
  };

  const approve = async (action) => {
    const notes = action === 'revision' ? prompt('ملاحظاتكم:') : '';
    if (action === 'revision' && !notes) return;
    await api(`/tasks/${selected.id}/approve`, { method: 'POST', body: JSON.stringify({ action, notes }) });
    load();
    selectTask({ id: selected.id });
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await api(`/tasks/${selected.id}/comments`, { method: 'POST', body: JSON.stringify({ comment, is_client_visible: true }) });
    setComment('');
    selectTask({ id: selected.id });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div className="portal-header">
        <h1>بوابة العميل</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{user?.name}</span>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }} onClick={logout}>خروج</button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24, direction: 'rtl' }}>
        {loading ? <div className="loader">جاري التحميل...</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 2fr' : '1fr', gap: 20 }}>
            <div>
              <h3 style={{ marginBottom: 12 }}>المهام ({tasks.length})</h3>
              {tasks.length === 0 ? <div className="card"><div className="empty">لا توجد مهام حالياً</div></div> : (
                tasks.map(t => (
                  <div key={t.id} className="card" style={{ marginBottom: 8, cursor: 'pointer', borderRight: selected?.id === t.id ? '3px solid var(--primary)' : undefined }}
                    onClick={() => selectTask(t)}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{t.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge badge-${t.status}`}>{STATUS_AR[t.status]}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{t.assignee_name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selected && (
              <div className="card">
                <h3 style={{ marginBottom: 8 }}>{selected.title}</h3>
                <span className={`badge badge-${selected.status}`}>{STATUS_AR[selected.status]}</span>
                {selected.description && <p style={{ marginTop: 12, color: '#4b5563' }}>{selected.description}</p>}

                {selected.status === 'waiting_approval' && (
                  <div style={{ marginTop: 16, padding: 16, background: '#fef3c7', borderRadius: 8 }}>
                    <p style={{ marginBottom: 12, fontWeight: 500 }}>هذه المهمة بانتظار اعتمادكم</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success" onClick={() => approve('approved')}>✓ اعتماد</button>
                      <button className="btn btn-danger" onClick={() => approve('revision')}>✗ طلب تعديل</button>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 20 }}>
                  <h4 style={{ marginBottom: 8 }}>التعليقات</h4>
                  {selected.comments?.filter(c => c.is_client_visible || c.user_role === 'client').map(c => (
                    <div key={c.id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{c.user_name}</span>
                        <span className="comment-date">{new Date(c.created_at).toLocaleString('ar-SA')}</span>
                      </div>
                      <div className="comment-text">{c.comment}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <textarea className="form-textarea" style={{ minHeight: 50 }} placeholder="أضف ملاحظة..." value={comment} onChange={e => setComment(e.target.value)} />
                    <button className="btn btn-primary btn-sm" onClick={addComment} style={{ alignSelf: 'flex-end' }}>إرسال</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
