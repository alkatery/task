import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_AR = {
  pending: 'جديدة', in_progress: 'قيد العمل', waiting_approval: 'بانتظار اعتماد',
  approved: 'معتمدة', completed: 'مكتملة', revision: 'مراجعة', cancelled: 'ملغاة'
};
const ACTION_AR = {
  created: 'إنشاء مهمة', status_changed: 'تغيير حالة', commented: 'تعليق',
  updated: 'تعديل', client_approved: 'اعتماد العميل', client_revision: 'طلب مراجعة'
};

export default function TaskDetail() {
  const { id } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const load = () => {
    api(`/tasks/${id}`).then(t => { setTask(t); setEditForm({ assigned_to: t.assigned_to || '', priority: t.priority, due_date: t.due_date?.split('T')[0] || '' }); setLoading(false); }).catch(() => navigate('/tasks'));
  };

  useEffect(() => { load(); api('/users').then(setUsers).catch(() => {}); }, [id]);

  const changeStatus = async (status) => {
    await api(`/tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await api(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment, is_client_visible: false }) });
    setComment('');
    load();
  };

  const saveEdit = async () => {
    await api(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(editForm) });
    setEditing(false);
    load();
  };

  const approve = async (action, notes) => {
    await api(`/tasks/${id}/approve`, { method: 'POST', body: JSON.stringify({ action, notes }) });
    load();
  };

  if (loading) return <div className="loader">جاري التحميل...</div>;
  if (!task) return null;

  const steps = task.workflow_steps || [];

  return (
    <div>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/tasks')} style={{ marginBottom: 16 }}>→ العودة للمهام</button>

      <div className="task-detail">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ marginBottom: 8 }}>{task.title}</h2>
                <span className={`badge badge-${task.status}`}>{STATUS_AR[task.status]}</span>
                <span className={`badge badge-${task.priority}`} style={{ marginRight: 8 }}>{task.priority}</span>
              </div>
              {user.role === 'admin' && (
                <button className="btn btn-sm btn-outline" onClick={() => setEditing(!editing)}>
                  {editing ? 'إلغاء' : 'تعديل'}
                </button>
              )}
            </div>

            {task.description && <p style={{ marginTop: 12, color: '#4b5563' }}>{task.description}</p>}

            {editing && (
              <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">المسؤول</label>
                    <select className="form-select" value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}>
                      <option value="">غير محدد</option>
                      {users.filter(u => u.role === 'team').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">الأولوية</label>
                    <select className="form-select" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">منخفضة</option><option value="medium">متوسطة</option>
                      <option value="high">عالية</option><option value="urgent">عاجلة</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ التسليم</label>
                  <input className="form-input" type="date" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={saveEdit}>حفظ</button>
              </div>
            )}

            {/* Workflow Steps Progress */}
            {steps.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ marginBottom: 8, fontSize: 14 }}>مراحل المسار</h4>
                <div className="workflow-steps">
                  {steps.map((s, i) => {
                    const stepTask = task.subtasks?.find(st => st.current_step === s.order);
                    const cls = stepTask?.status === 'completed' ? 'done' : stepTask?.status === 'in_progress' ? 'active' : '';
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="wf-arrow">←</span>}
                        <span className={`wf-step ${cls}`}>{s.name}</span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {task.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => changeStatus('in_progress')}>بدء العمل</button>}
              {task.status === 'in_progress' && <button className="btn btn-warning btn-sm" onClick={() => changeStatus('waiting_approval')}>إرسال للاعتماد</button>}
              {task.status === 'in_progress' && <button className="btn btn-success btn-sm" onClick={() => changeStatus('completed')}>إكمال</button>}
              {task.status === 'waiting_approval' && user.role === 'admin' && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => approve('approved')}>اعتماد</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { const n = prompt('ملاحظات المراجعة:'); if (n) approve('revision', n); }}>إرجاع للمراجعة</button>
                </>
              )}
              {task.status === 'revision' && <button className="btn btn-primary btn-sm" onClick={() => changeStatus('in_progress')}>إعادة العمل</button>}
            </div>
          </div>

          {/* Subtasks */}
          {task.subtasks?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>المهام الفرعية</div>
              <table>
                <thead><tr><th>المهمة</th><th>المسؤول</th><th>الحالة</th></tr></thead>
                <tbody>
                  {task.subtasks.map(st => (
                    <tr key={st.id} onClick={() => navigate(`/tasks/${st.id}`)} style={{ cursor: 'pointer' }}>
                      <td>{st.title}</td>
                      <td>{st.assignee_name || '—'}</td>
                      <td><span className={`badge badge-${st.status}`}>{STATUS_AR[st.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>التعليقات</div>
            {task.comments?.map(c => (
              <div key={c.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">{c.user_name} <span className={`badge badge-${c.user_role === 'client' ? 'approved' : 'in_progress'}`} style={{ fontSize: 10 }}>{c.user_role === 'client' ? 'عميل' : 'فريق'}</span></span>
                  <span className="comment-date">{new Date(c.created_at).toLocaleString('ar-SA')}</span>
                </div>
                <div className="comment-text">{c.comment}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <textarea className="form-textarea" style={{ minHeight: 60 }} placeholder="أضف تعليقاً..." value={comment} onChange={e => setComment(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addComment} disabled={!comment.trim()} style={{ alignSelf: 'flex-end' }}>إرسال</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>التفاصيل</div>
            <div className="task-meta">
              <div className="meta-item"><div className="meta-label">المسؤول</div><div className="meta-value">{task.assignee_name || 'غير محدد'}</div></div>
              <div className="meta-item"><div className="meta-label">العميل</div><div className="meta-value">{task.client_name || '—'}</div></div>
              <div className="meta-item"><div className="meta-label">المسار</div><div className="meta-value">{task.workflow_name || 'مهمة يدوية'}</div></div>
              <div className="meta-item"><div className="meta-label">الأولوية</div><div className="meta-value"><span className={`badge badge-${task.priority}`}>{task.priority}</span></div></div>
              <div className="meta-item"><div className="meta-label">تاريخ الإنشاء</div><div className="meta-value">{new Date(task.created_at).toLocaleDateString('ar-SA')}</div></div>
              <div className="meta-item"><div className="meta-label">الموعد النهائي</div><div className="meta-value" style={{ color: task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'var(--danger)' : undefined }}>{task.due_date ? new Date(task.due_date).toLocaleDateString('ar-SA') : '—'}</div></div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>سجل النشاط</div>
            {task.logs?.map(l => (
              <div key={l.id} className="log-item">
                <div className="log-dot"></div>
                <div>
                  <div style={{ fontSize: 13 }}><strong>{l.user_name}</strong> — {ACTION_AR[l.action] || l.action}</div>
                  <div className="log-time">{new Date(l.created_at).toLocaleString('ar-SA')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
