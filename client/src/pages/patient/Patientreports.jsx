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

      {success && <div style={s.success}>✓ {success}</div>}
      {error   && <div style={s.error}>{error}</div>}

      {/* Upload zone */}
      <div style={s.metaPanel}>
        <div style={s.metaGrid}>
          <input
            style={s.input}
            placeholder="Report title (optional)"
            value={uploadMeta.title}
            onChange={(e) => setUploadMeta((prev) => ({ ...prev, title: e.target.value }))}
          />
          <select
            style={s.input}
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
            type="date"
            value={uploadMeta.reportDate}
            onChange={(e) => setUploadMeta((prev) => ({ ...prev, reportDate: e.target.value }))}
          />
          <input
            style={s.input}
            placeholder="Hospital/Lab name"
            value={uploadMeta.hospitalOrLabName}
            onChange={(e) => setUploadMeta((prev) => ({ ...prev, hospitalOrLabName: e.target.value }))}
          />
        </div>
        <textarea
          style={s.textarea}
          placeholder="Description (optional)"
          value={uploadMeta.description}
          onChange={(e) => setUploadMeta((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div style={s.shareRow}>
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
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Private Vault</div>
          <div style={s.statValue}>{privateCount}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Shared With Doctors</div>
          <div style={s.statValue}>{sharedCount}</div>
        </div>
      </div>
      <div style={s.filterRow}>
        <button
          onClick={() => setVisibilityFilter('private')}
          style={{ ...s.filterBtn, ...(visibilityFilter === 'private' ? s.filterBtnActive : {}) }}
        >
          Private Vault
        </button>
        <button
          onClick={() => setVisibilityFilter('shared')}
          style={{ ...s.filterBtn, ...(visibilityFilter === 'shared' ? s.filterBtnActive : {}) }}
        >
          Shared With Doctors
        </button>
        <button
          onClick={() => setVisibilityFilter('all')}
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
              <div key={r._id} style={s.reportCard}>
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
                <div style={s.fileActions}>
                  <button onClick={() => handleOpen(r)} style={s.viewBtn}>
                    Open ↗
                  </button>
                  <button onClick={() => handleDownload(r)} style={s.downloadBtn}>
                    Download
                  </button>
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
  metaPanel:      { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 14, padding: 14, marginBottom: 14 },
  metaGrid:       { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 },
  input:          { width: '100%', border: '1px solid #d6e2f4', borderRadius: 8, padding: '9px 10px', fontSize: 13, color: '#1d3557' },
  textarea:       { width: '100%', minHeight: 68, border: '1px solid #d6e2f4', borderRadius: 8, padding: '9px 10px', fontSize: 13, color: '#1d3557', marginBottom: 10, resize: 'vertical' },
  shareRow:       { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
  radioLabel:     { display: 'flex', gap: 6, alignItems: 'center', color: '#334e68', fontSize: 13 },
  helper:         { color: '#6b7f99', fontSize: 12 },
  dropZone:       { border: '2px dashed #c3d4f0', borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#f8faff', marginBottom: 28 },
  dropZoneActive: { border: '2px dashed #1a56db', background: '#ebf2ff' },
  dropIcon:       { fontSize: 40, marginBottom: 12 },
  dropTitle:      { fontSize: 15, fontWeight: 600, color: '#0b1f3a', marginBottom: 6 },
  dropSub:        { fontSize: 13, color: '#7a92aa' },
  listHead:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  listTitle:      { fontSize: 14, fontWeight: 700, color: '#0b1f3a' },
  count:          { fontSize: 12, color: '#7a92aa', background: '#f0f4f9', padding: '3px 10px', borderRadius: 20 },
  statsRow:       { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 12 },
  statCard:       { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 10, padding: '10px 12px' },
  statLabel:      { fontSize: 12, color: '#6f86a3' },
  statValue:      { fontSize: 19, fontWeight: 700, color: '#11345c', marginTop: 3 },
  filterRow:      { display: 'flex', gap: 8, marginBottom: 12 },
  filterBtn:      { padding: '6px 12px', border: '1px solid #d6e2f4', borderRadius: 8, background: '#fff', color: '#4a6380', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  filterBtnActive:{ background: '#ebf2ff', border: '1px solid #1a56db', color: '#1a56db' },
  list:           { display: 'flex', flexDirection: 'column', gap: 10 },
  reportCard:     { background: '#fff', border: '1px solid #e4ecf7', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 },
  fileIcon:       { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  fileInfo:       { flex: 1, minWidth: 0 },
  fileName:       { fontSize: 14, fontWeight: 600, color: '#0b1f3a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileMeta:       { fontSize: 12, color: '#7a92aa', marginTop: 3 },
  badgePrivate:   { display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 999, background: '#f2f5fa', color: '#5f738f', fontSize: 11, fontWeight: 600 },
  badgeShared:    { display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 999, background: '#edfdf4', color: '#1f7a4b', fontSize: 11, fontWeight: 600 },
  fileActions:    { display: 'flex', gap: 8, flexShrink: 0 },
  viewBtn:        { padding: '7px 14px', background: '#ebf2ff', color: '#1a56db', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  downloadBtn:    { padding: '7px 14px', background: '#edfdf4', color: '#1f7a4b', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  deleteBtn:      { padding: '7px 14px', background: '#fff5f5', color: '#e53e3e', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  empty:          { color: '#7a92aa', fontSize: 14, padding: '20px 0' },
  emptyBox:       { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e4ecf7' },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { fontSize: 16, fontWeight: 700, color: '#0b1f3a', marginBottom: 8 },
  emptySub:       { fontSize: 14, color: '#7a92aa' },
};