// client/src/pages/patient/PatientReports.jsx
import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import PatientLayout from './Patientlayout ';

export default function PatientReports() {
  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  const fetchReports = () => {
    api.get('/patients/reports')
      .then(r  => setReports(r.data.reports || []))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchReports, []);

  const uploadFile = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, JPG and PNG files are allowed'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB'); return;
    }

    const fd = new FormData();
    fd.append('report', file);
    setUploading(true); setError('');

    try {
      await api.post('/patients/reports', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Report uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/patients/reports/${id}`);
      setSuccess('Report deleted.');
      setTimeout(() => setSuccess(''), 2000);
      fetchReports();
    } catch {
      setError('Failed to delete report');
    }
  };

  const getIcon = (type) => {
    if (type?.includes('pdf'))  return { icon: '📕', color: '#e53e3e', bg: '#fff5f5' };
    if (type?.includes('image'))return { icon: '🖼️',  color: '#3182ce', bg: '#ebf8ff' };
    return                               { icon: '📄',  color: '#718096', bg: '#f7fafc' };
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PatientLayout title="Medical Reports" subtitle="Upload and manage your medical documents">

      {success && <div style={s.success}>✓ {success}</div>}
      {error   && <div style={s.error}>{error}</div>}

      {/* Upload zone */}
      <div
        style={{ ...s.dropZone, ...(dragOver ? s.dropZoneActive : {}) }}
        onDragOver={e  => { e.preventDefault(); setDragOver(true);  }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false);
          uploadFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileRef.current.click()}
      >
        <div style={s.dropIcon}>{uploading ? '⏳' : '📤'}</div>
        <div style={s.dropTitle}>
          {uploading ? 'Uploading...' : 'Drop your file here or click to browse'}
        </div>
        <div style={s.dropSub}>PDF, JPG, PNG — max 10MB</div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={e => uploadFile(e.target.files[0])} />
      </div>

      {/* Reports list */}
      <div style={s.listHead}>
        <span style={s.listTitle}>Your Reports</span>
        <span style={s.count}>{reports.length} file{reports.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div style={s.empty}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={s.emptyIcon}>📋</div>
          <div style={s.emptyTitle}>No reports uploaded yet</div>
          <div style={s.emptySub}>Upload your first medical report using the area above</div>
        </div>
      ) : (
        <div style={s.list}>
          {reports.map(r => {
            const { icon, color, bg } = getIcon(r.fileType);
            return (
              <div key={r._id} style={s.reportCard}>
                <div style={{ ...s.fileIcon, background: bg, color }}>{icon}</div>
                <div style={s.fileInfo}>
                  <div style={s.fileName}>{r.filename}</div>
                  <div style={s.fileMeta}>
                    {new Date(r.uploadedAt).toLocaleDateString()} · {formatSize(r.size)}
                  </div>
                </div>
                <div style={s.fileActions}>
                  <a href={r.url} target="_blank" rel="noreferrer" style={s.viewBtn}>
                    View ↗
                  </a>
                  <button onClick={() => handleDelete(r._id)} style={s.deleteBtn}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PatientLayout>
  );
}

const s = {
  success:        { background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 },
  error:          { background: '#fff0f0', color: '#cc0000', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 },
  dropZone:       { border: '2px dashed #c3d4f0', borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#f8faff', marginBottom: 28 },
  dropZoneActive: { border: '2px dashed #1a56db', background: '#ebf2ff' },
  dropIcon:       { fontSize: 40, marginBottom: 12 },
  dropTitle:      { fontSize: 15, fontWeight: 600, color: '#0b1f3a', marginBottom: 6 },
  dropSub:        { fontSize: 13, color: '#7a92aa' },
  listHead:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  listTitle:      { fontSize: 14, fontWeight: 700, color: '#0b1f3a' },
  count:          { fontSize: 12, color: '#7a92aa', background: '#f0f4f9', padding: '3px 10px', borderRadius: 20 },
  list:           { display: 'flex', flexDirection: 'column', gap: 10 },
  reportCard:     { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 },
  fileIcon:       { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  fileInfo:       { flex: 1, minWidth: 0 },
  fileName:       { fontSize: 14, fontWeight: 600, color: '#0b1f3a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileMeta:       { fontSize: 12, color: '#7a92aa', marginTop: 3 },
  fileActions:    { display: 'flex', gap: 8, flexShrink: 0 },
  viewBtn:        { padding: '7px 14px', background: '#ebf2ff', color: '#1a56db', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 },
  deleteBtn:      { padding: '7px 14px', background: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  empty:          { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  emptyBox:       { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e4ecf7' },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { fontSize: 16, fontWeight: 700, color: '#0b1f3a', marginBottom: 8 },
  emptySub:       { fontSize: 14, color: '#7a92aa' },
};