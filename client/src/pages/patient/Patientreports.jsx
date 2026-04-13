// client/src/pages/patient/PatientReports.jsx
import { useEffect, useState, useRef } from 'react';
import {
  deletePatientReport,
  getPatientReportDownloadUrl,
  getPatientReports,
  getVerifiedDoctorsForSharing,
  uploadPatientReport
} from '../../services/patientApi';
import PatientLayout from './Patientlayout ';

export default function PatientReports() {
  const [reports,   setReports]   = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [visibilityFilter, setVisibilityFilter] = useState('private');
  const [uploadMeta, setUploadMeta] = useState({
    title: '',
    reportType: 'other',
    reportDate: new Date().toISOString().slice(0, 10),
    description: '',
    hospitalOrLabName: '',
    visibility: 'private',
    doctorUserId: '',
    doctorEmail: ''
  });
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();

  const fetchReports = () => {
    getPatientReports({ page: 1, limit: 100, status: 'active' })
      .then((data) => setReports(data.reports || []))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
    getVerifiedDoctorsForSharing()
      .then((data) => setDoctors(data.doctors || []))
      .catch(() => setDoctors([]));
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, JPG and PNG files are allowed'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB'); return;
    }
    if (uploadMeta.visibility === 'shared' && !uploadMeta.doctorUserId.trim() && !uploadMeta.doctorEmail.trim()) {
      setError('Select a doctor or enter doctor email');
      return;
    }

    setUploading(true); setError('');

    try {
      const cleanTitle = uploadMeta.title.trim() || file.name.replace(/\.[^/.]+$/, '');
      await uploadPatientReport(file, {
        reportType: uploadMeta.reportType,
        title: cleanTitle,
        reportDate: uploadMeta.reportDate,
        description: uploadMeta.description,
        hospitalOrLabName: uploadMeta.hospitalOrLabName,
        visibility: uploadMeta.visibility,
        doctorUserId: uploadMeta.visibility === 'shared' ? uploadMeta.doctorUserId.trim() : undefined,
        doctorEmail: uploadMeta.visibility === 'shared' ? uploadMeta.doctorEmail.trim() : undefined
      });
      setSuccess('Report uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setUploadMeta((prev) => ({
        ...prev,
        title: '',
        description: '',
        hospitalOrLabName: '',
        visibility: 'private',
        doctorUserId: '',
        doctorEmail: '',
        reportDate: new Date().toISOString().slice(0, 10)
      }));
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await deletePatientReport(id);
      setSuccess('Report deleted.');
      setTimeout(() => setSuccess(''), 2000);
      fetchReports();
    } catch {
      setError('Failed to delete report');
    }
  };

  const handleOpen = async (report) => {
    const popup = window.open('', '_blank');
    try {
      const result = await getPatientReportDownloadUrl(report._id, 'view');
      const targetUrl = result?.downloadUrl || report.url;
      if (targetUrl && popup && !popup.closed) {
        popup.opener = null;
        popup.location.href = targetUrl;
        return;
      }
      if (targetUrl) {
        window.location.href = targetUrl;
        return;
      }
      if (popup && !popup.closed) popup.close();
      setError('Failed to open report');
    } catch {
      if (report.url && popup && !popup.closed) {
        popup.opener = null;
        popup.location.href = report.url;
      } else {
        if (popup && !popup.closed) popup.close();
        setError('Failed to open report');
      }
    }
  };

  const handleDownload = async (report) => {
    try {
      const result = await getPatientReportDownloadUrl(report._id, 'download');
      const targetUrl = result?.downloadUrl || report.url;
      if (!targetUrl) {
        setError('Failed to download report');
        return;
      }

      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = report.filename || 'medical-report';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      if (report.url) {
        const link = document.createElement('a');
        link.href = report.url;
        link.download = report.filename || 'medical-report';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Failed to download report');
      }
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

  const getVisibility = (report) => {
    if (report?.visibility === 'private' || report?.visibility === 'shared') {
      return report.visibility;
    }
    return Array.isArray(report?.sharedWithDoctors) && report.sharedWithDoctors.length > 0 ? 'shared' : 'private';
  };

  const filteredReports = reports.filter((report) => {
    if (visibilityFilter === 'all') return true;
    return getVisibility(report) === visibilityFilter;
  });

  const privateCount = reports.filter((report) => getVisibility(report) === 'private').length;
  const sharedCount = reports.filter((report) => getVisibility(report) === 'shared').length;

  return (
    <PatientLayout title="Medical Reports" subtitle="Private vault for your records, plus shared doctor reports">
      <style>{reportCss}</style>

      {success && <div style={s.success}>✓ {success}</div>}
      {error   && <div style={s.error}>{error}</div>}

      {/* Upload zone */}
      <div style={s.metaPanel} className="patient-reports-meta-panel">
        <div style={s.metaGrid} className="patient-reports-meta-grid">
          <input
            style={s.input}
            className="patient-report-input"
            placeholder="Report title (optional)"
            value={uploadMeta.title}
            onChange={(e) => setUploadMeta((prev) => ({ ...prev, title: e.target.value }))}
          />
          <select
            style={s.input}
            className="patient-report-input"
            value={uploadMeta.reportType}
            onChange={(e) => setUploadMeta((prev) => ({ ...prev, reportType: e.target.value }))}
          >
            <option value="other">Other</option>
            <option value="lab">Lab</option>
            <option value="radiology">Radiology</option>
            <option value="prescription-scan">Prescription Scan</option>
            <option value="discharge-summary">Discharge Summary</option>
          </select>
          <input
            style={s.input}
            className="patient-report-input"
            type="date"
            value={uploadMeta.reportDate}
            onChange={(e) => setUploadMeta((prev) => ({ ...prev, reportDate: e.target.value }))}
          />
          <input
            style={s.input}
            className="patient-report-input"
            placeholder="Hospital/Lab name"
            value={uploadMeta.hospitalOrLabName}
            onChange={(e) => setUploadMeta((prev) => ({ ...prev, hospitalOrLabName: e.target.value }))}
          />
        </div>
        <textarea
          style={s.textarea}
          className="patient-report-input"
          placeholder="Description (optional)"
          value={uploadMeta.description}
          onChange={(e) => setUploadMeta((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div style={s.shareRow} className="patient-reports-share-row">
          <label style={s.radioLabel}>
            <input
              type="radio"
              checked={uploadMeta.visibility === 'private'}
              onChange={() => setUploadMeta((prev) => ({ ...prev, visibility: 'private', doctorUserId: '', doctorEmail: '' }))}
            />
            Private report
          </label>
          <label style={s.radioLabel}>
            <input
              type="radio"
              checked={uploadMeta.visibility === 'shared'}
              onChange={() => setUploadMeta((prev) => ({ ...prev, visibility: 'shared' }))}
            />
            Share with specific doctor
          </label>
          {uploadMeta.visibility === 'shared' && (
            <>
              <select
                style={s.input}
                className="patient-report-input"
                value={uploadMeta.doctorUserId}
                onChange={(e) => {
                  const selected = doctors.find((d) => (d.userId || d._id) === e.target.value);
                  setUploadMeta((prev) => ({
                    ...prev,
                    doctorUserId: e.target.value,
                    doctorEmail: selected?.email || prev.doctorEmail
                  }));
                }}
              >
                <option value="">Select verified doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.userId || doctor._id} value={doctor.userId || doctor._id}>
                    {doctor.name} ({doctor.email})
                  </option>
                ))}
              </select>
              <input
                style={s.input}
                className="patient-report-input"
                type="email"
                placeholder="Or type doctor email manually"
                value={uploadMeta.doctorEmail}
                onChange={(e) => setUploadMeta((prev) => ({ ...prev, doctorEmail: e.target.value, doctorUserId: '' }))}
              />
            </>
          )}
        </div>
        <div style={s.helper}>
          Upload as Private stays in your personal records. Shared reports appear under "Shared With Doctor".
        </div>
      </div>
      <div
        style={{ ...s.dropZone, ...(dragOver ? s.dropZoneActive : {}) }}
        className="patient-reports-dropzone"
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
        <span style={s.listTitle}>
          {visibilityFilter === 'private'
            ? 'Private Vault'
            : visibilityFilter === 'shared'
              ? 'Shared With Doctors'
              : 'All Reports'}
        </span>
        <span style={s.count}>{reports.length} file{reports.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={s.statsRow} className="patient-reports-stats-row">
        <div style={s.statCard} className="patient-reports-stat-card">
          <div style={s.statLabel}>Private Vault</div>
          <div style={s.statValue}>{privateCount}</div>
        </div>
        <div style={s.statCard} className="patient-reports-stat-card">
          <div style={s.statLabel}>Shared With Doctors</div>
          <div style={s.statValue}>{sharedCount}</div>
        </div>
      </div>
      <div style={s.filterRow} className="patient-reports-filter-row">
        <button
          onClick={() => setVisibilityFilter('private')}
          className="patient-reports-filter-btn"
          style={{ ...s.filterBtn, ...(visibilityFilter === 'private' ? s.filterBtnActive : {}) }}
        >
          Private Vault
        </button>
        <button
          onClick={() => setVisibilityFilter('shared')}
          className="patient-reports-filter-btn"
          style={{ ...s.filterBtn, ...(visibilityFilter === 'shared' ? s.filterBtnActive : {}) }}
        >
          Shared With Doctors
        </button>
        <button
          onClick={() => setVisibilityFilter('all')}
          className="patient-reports-filter-btn"
          style={{ ...s.filterBtn, ...(visibilityFilter === 'all' ? s.filterBtnActive : {}) }}
        >
          All Reports
        </button>
      </div>

      {loading ? (
        <div style={s.empty}>Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={s.emptyIcon}>📋</div>
          <div style={s.emptyTitle}>No reports in this section</div>
          <div style={s.emptySub}>Upload and share reports to organize them by visibility</div>
        </div>
      ) : (
        <div style={s.list}>
          {filteredReports.map(r => {
            const { icon, color, bg } = getIcon(r.fileType);
            const visibility = getVisibility(r);
            return (
              <div key={r._id} style={s.reportCard} className="patient-report-card">
                <div style={{ ...s.fileIcon, background: bg, color }}>{icon}</div>
                <div style={s.fileInfo}>
                  <div style={s.fileName}>{r.filename}</div>
                  <div style={s.fileMeta}>
                    {new Date(r.uploadedAt).toLocaleDateString()} · {formatSize(r.size)}
                  </div>
                  <div style={visibility === 'shared' ? s.badgeShared : s.badgePrivate}>
                    {visibility === 'shared' ? 'Shared With Doctor' : 'Private'}
                  </div>
                </div>
                <div style={s.fileActions} className="patient-report-actions">
                  <button onClick={() => handleOpen(r)} style={s.viewBtn} className="patient-report-action-btn">
                    Open ↗
                  </button>
                  <button onClick={() => handleDownload(r)} style={s.downloadBtn} className="patient-report-action-btn">
                    Download
                  </button>
                  <button onClick={() => handleDelete(r._id)} style={s.deleteBtn} className="patient-report-action-btn">
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
  success:        { background: '#ecfdf5', color: '#0f7a47', border: '1px solid #c8f1dc', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600 },
  error:          { background: '#fff1f1', color: '#bf3131', border: '1px solid #f1cece', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 13 },
  metaPanel:      { background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)', border: '1px solid #d8e6f5', borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: '0 12px 26px rgba(3, 40, 88, 0.06)' },
  metaGrid:       { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 },
  input:          { width: '100%', border: '1px solid #cfe0f2', borderRadius: 10, padding: '10px 11px', fontSize: 13, color: '#1d3557', background: '#fdfefe' },
  textarea:       { width: '100%', minHeight: 68, border: '1px solid #cfe0f2', borderRadius: 10, padding: '10px 11px', fontSize: 13, color: '#1d3557', marginBottom: 10, resize: 'vertical', background: '#fdfefe' },
  shareRow:       { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
  radioLabel:     { display: 'flex', gap: 6, alignItems: 'center', color: '#334e68', fontSize: 13, padding: '5px 8px', borderRadius: 8, background: '#f2f7fd', border: '1px solid #dce8f4' },
  helper:         { color: '#5c7893', fontSize: 12 },
  dropZone:       { border: '2px dashed #bdd2ea', borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)', marginBottom: 28 },
  dropZoneActive: { border: '2px dashed #1d4ed8', background: '#eaf3ff' },
  dropIcon:       { fontSize: 40, marginBottom: 12 },
  dropTitle:      { fontSize: 15, fontWeight: 700, color: '#10314d', marginBottom: 6 },
  dropSub:        { fontSize: 13, color: '#648199' },
  listHead:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  listTitle:      { fontSize: 14, fontWeight: 700, color: '#0e2f4b' },
  count:          { fontSize: 12, color: '#5f7d95', background: '#eef4fb', border: '1px solid #d6e4f2', padding: '3px 10px', borderRadius: 20 },
  statsRow:       { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 12 },
  statCard:       { background: 'linear-gradient(180deg, #ffffff 0%, #f6faff 100%)', border: '1px solid #d8e6f5', borderRadius: 12, padding: '11px 12px' },
  statLabel:      { fontSize: 12, color: '#63819b' },
  statValue:      { fontSize: 22, fontWeight: 700, color: '#11345c', marginTop: 3, fontFamily: "'Sora', sans-serif" },
  filterRow:      { display: 'flex', gap: 8, marginBottom: 12 },
  filterBtn:      { padding: '7px 12px', border: '1px solid #d1e0ef', borderRadius: 9, background: '#f8fbff', color: '#395b77', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  filterBtnActive:{ background: '#eaf3ff', border: '1px solid #2f6fae', color: '#1f4f7b' },
  list:           { display: 'flex', flexDirection: 'column', gap: 10 },
  reportCard:     { background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', border: '1px solid #d8e6f5', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 10px 24px rgba(3, 40, 88, 0.06)' },
  fileIcon:       { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  fileInfo:       { flex: 1, minWidth: 0 },
  fileName:       { fontSize: 14, fontWeight: 700, color: '#0f3150', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileMeta:       { fontSize: 12, color: '#66839b', marginTop: 3 },
  badgePrivate:   { display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 999, background: '#edf3fa', color: '#4f6d88', fontSize: 11, fontWeight: 700, border: '1px solid #d8e3ef' },
  badgeShared:    { display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 999, background: '#ecfbf3', color: '#176b41', fontSize: 11, fontWeight: 700, border: '1px solid #cdeedc' },
  fileActions:    { display: 'flex', gap: 8, flexShrink: 0 },
  viewBtn:        { padding: '7px 14px', background: '#eaf3ff', color: '#1e5483', borderRadius: 8, border: '1px solid #c8dcf0', cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  downloadBtn:    { padding: '7px 14px', background: '#ecfbf3', color: '#176b41', border: '1px solid #cdeedc', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  deleteBtn:      { padding: '7px 14px', background: '#fff2f2', color: '#c63c3c', border: '1px solid #f0d1d1', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
  empty:          { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  emptyBox:       { textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)', borderRadius: 14, border: '1px solid #d8e6f5' },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { fontSize: 16, fontWeight: 700, color: '#0e2f4b', marginBottom: 8 },
  emptySub:       { fontSize: 14, color: '#6b879e' },
};

const reportCss = `
.patient-report-input {
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}
.patient-report-input:focus {
  border-color: #86afd6 !important;
  box-shadow: 0 0 0 3px rgba(55, 125, 193, 0.16);
  background: #ffffff;
  outline: none;
}
.patient-reports-dropzone,
.patient-report-card,
.patient-report-action-btn,
.patient-reports-filter-btn,
.patient-reports-stat-card {
  transition: transform 0.16s ease, box-shadow 0.2s ease, border-color 0.16s ease, background-color 0.16s ease;
}
.patient-reports-dropzone:hover {
  border-color: #9dbbe0;
  transform: translateY(-1px);
}
.patient-reports-stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(3, 40, 88, 0.1);
}
.patient-reports-filter-btn:hover {
  border-color: #b8d0e7;
  background: #f0f7ff;
}
.patient-report-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(3, 40, 88, 0.12);
  border-color: #c6daee;
}
.patient-report-action-btn:hover {
  transform: translateY(-1px);
}
@media (max-width: 980px) {
  .patient-reports-meta-grid {
    grid-template-columns: 1fr !important;
  }
  .patient-reports-filter-row {
    flex-wrap: wrap;
  }
}
@media (max-width: 760px) {
  .patient-reports-share-row {
    flex-direction: column;
    align-items: stretch;
  }
  .patient-report-card {
    padding: 14px !important;
    flex-direction: column;
    align-items: stretch !important;
    gap: 10px !important;
  }
  .patient-report-actions {
    width: 100%;
    display: grid !important;
    grid-template-columns: 1fr;
  }
  .patient-report-actions button {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .patient-reports-dropzone,
  .patient-report-card,
  .patient-report-action-btn,
  .patient-reports-filter-btn,
  .patient-reports-stat-card,
  .patient-report-input {
    transition: none !important;
  }
}
`;