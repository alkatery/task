import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Workflows() {
  const { api } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/workflows').then(setWorkflows).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loader">جاري التحميل...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>مسارات العمل</h2>
      <div style={{ display: 'grid', gap: 16 }}>
        {workflows.map(w => (
          <div key={w.id} className="card">
            <div className="card-header">
              <span className="card-title">{w.name}</span>
              <span className="badge badge-in_progress">{w.steps?.length || 0} خطوات</span>
            </div>
            {w.description && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{w.description}</p>}
            <div className="workflow-steps">
              {w.steps?.map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="wf-arrow">←</span>}
                  <span className="wf-step" style={s.type === 'approval' ? { borderColor: 'var(--warning)', background: 'var(--warning-light)' } : s.type === 'fork' ? { borderColor: 'var(--info)', background: 'var(--info-light)' } : {}}>
                    {s.name}
                    {s.default_assignee && <span style={{ display: 'block', fontSize: 10, opacity: 0.7 }}>{s.default_assignee.split('@')[0]}</span>}
                    {s.type === 'approval' && <span style={{ display: 'block', fontSize: 10, color: 'var(--warning)' }}>⏳ اعتماد</span>}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
