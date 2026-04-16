import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { api } = useAuth();
  const [tab, setTab] = useState('team');
  const [teamData, setTeamData] = useState([]);
  const [clientData, setClientData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/reports/team-performance').then(setTeamData).catch(() => {}),
      api('/reports/client-status').then(setClientData).catch(() => {}),
      api('/reports/overdue').then(setOverdueData).catch(() => {}),
      api('/reports/workflow-bottlenecks').then(setBottlenecks).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'team', label: 'أداء الفريق' },
    { key: 'clients', label: 'حالة العملاء' },
    { key: 'overdue', label: 'المتأخرات' },
    { key: 'bottlenecks', label: 'نقاط الاختناق' }
  ];

  if (loading) return <div className="loader">جاري التحميل...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>التقارير</h2>
      <div className="filters" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'team' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>أداء أعضاء الفريق</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>العضو</th><th>مكتملة</th><th>نشطة</th><th>متأخرة</th><th>متوسط الإنجاز (أيام)</th></tr></thead>
              <tbody>
                {teamData.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td><span className="badge badge-completed">{r.completed}</span></td>
                    <td><span className="badge badge-in_progress">{r.active}</span></td>
                    <td>{r.overdue > 0 ? <span className="badge badge-revision">{r.overdue}</span> : <span className="badge badge-completed">0</span>}</td>
                    <td>{r.avg_days ? Math.round(r.avg_days) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'clients' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>حالة العملاء</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>العميل</th><th>النوع</th><th>المشاريع</th><th>مهام نشطة</th><th>بانتظار اعتماد</th><th>مكتملة</th></tr></thead>
              <tbody>
                {clientData.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>{r.type === 'sheikh' ? 'شيخ' : r.type === 'association' ? 'جمعية' : 'أخرى'}</td>
                    <td>{r.projects}</td>
                    <td>{r.active_tasks}</td>
                    <td>{r.awaiting_approval > 0 ? <span className="badge badge-waiting_approval">{r.awaiting_approval}</span> : '0'}</td>
                    <td>{r.completed_tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'overdue' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>المهام المتأخرة ({overdueData.length})</div>
          {overdueData.length === 0 ? <div className="empty">لا توجد مهام متأخرة 🎉</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>المهمة</th><th>المسؤول</th><th>العميل</th><th>أيام التأخر</th></tr></thead>
                <tbody>
                  {overdueData.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.title}</td>
                      <td>{r.assignee_name || '—'}</td>
                      <td>{r.client_name || '—'}</td>
                      <td><span className="badge badge-revision">{r.days_overdue} يوم</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'bottlenecks' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>نقاط الاختناق في المسارات</div>
          {bottlenecks.length === 0 ? <div className="empty">لا توجد اختناقات حالياً</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>المسار</th><th>الخطوة</th><th>عدد المهام العالقة</th><th>متوسط أيام التوقف</th></tr></thead>
                <tbody>
                  {bottlenecks.map((r, i) => (
                    <tr key={i}>
                      <td>{r.workflow_name}</td>
                      <td style={{ fontWeight: 500 }}>{r.step_name}</td>
                      <td><span className="badge badge-warning">{r.stuck_count}</span></td>
                      <td><span className="badge badge-revision">{Math.round(r.avg_days_stuck)} يوم</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
