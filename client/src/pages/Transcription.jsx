import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Transcription() {
  const { api, apiUpload } = useAuth();
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [title, setTitle] = useState('');
  const [editText, setEditText] = useState('');

  const load = () => api('/transcriptions').then(setTranscriptions).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('audio', file);
    fd.append('title', title || file.name);
    try {
      const result = await apiUpload('/transcriptions', fd);
      setTitle('');
      load();
      // بدء التفريغ تلقائياً
      setProcessing(true);
      await api(`/transcriptions/${result.id}/transcribe`, { method: 'POST' });
      setProcessing(false);
      load();
    } catch (err) {
      alert(err.message);
      setProcessing(false);
    }
  };

  const selectTr = async (tr) => {
    const full = await api(`/transcriptions/${tr.id}`);
    setSelected(full);
    setEditText(full.formatted_text || full.raw_text || '');
  };

  const saveText = async () => {
    await api(`/transcriptions/${selected.id}`, { method: 'PUT', body: JSON.stringify({ formatted_text: editText }) });
    alert('تم الحفظ');
    load();
  };

  const retranscribe = async (id) => {
    setProcessing(true);
    try {
      await api(`/transcriptions/${id}/transcribe`, { method: 'POST' });
      load();
      if (selected?.id === id) selectTr({ id });
    } catch (err) { alert(err.message); }
    setProcessing(false);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>مُفرّغ — التفريغ النصي</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Sidebar - List & Upload */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>تفريغ جديد</div>
            <div className="form-group">
              <input className="form-input" placeholder="عنوان الدرس" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <label className="btn btn-primary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
              {processing ? 'جاري التفريغ...' : '🎙️ رفع ملف صوتي'}
              <input type="file" accept="audio/*,video/*" onChange={handleUpload} style={{ display: 'none' }} disabled={processing} />
            </label>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>التفريغات السابقة</div>
            {loading ? <div className="loader">جاري التحميل...</div> : transcriptions.length === 0 ? (
              <div className="empty" style={{ padding: 20 }}>لا توجد تفريغات</div>
            ) : (
              transcriptions.map(tr => (
                <div key={tr.id} onClick={() => selectTr(tr)}
                  style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: selected?.id === tr.id ? '#dbeafe' : undefined, borderRadius: 4 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{tr.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span className={`badge badge-${tr.status === 'completed' ? 'completed' : tr.status === 'processing' ? 'in_progress' : tr.status === 'failed' ? 'revision' : 'pending'}`}>
                      {tr.status === 'completed' ? 'مكتمل' : tr.status === 'processing' ? 'جاري' : tr.status === 'failed' ? 'فشل' : 'جديد'}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(tr.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main - Editor */}
        <div className="card">
          {!selected ? (
            <div className="empty"><div className="empty-icon">🎙️</div>اختر تفريغاً أو ارفع ملفاً صوتياً جديداً</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>{selected.title}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => retranscribe(selected.id)} disabled={processing}>
                    {processing ? 'جاري...' : '🔄 إعادة التفريغ'}
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={saveText}>💾 حفظ</button>
                </div>
              </div>
              <div contentEditable dir="rtl" className="transcript-editor"
                dangerouslySetInnerHTML={{ __html: editText.replace(/\n/g, '<br/>') }}
                onBlur={e => setEditText(e.target.innerText)}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                يمكنك تعديل النص مباشرة ثم الضغط على "حفظ"
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
