import api from './api';

const toIsoDate = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const inferTitleFromFilename = (filename = '') => {
  const cleaned = String(filename).replace(/\.[^/.]+$/, '').trim();
  return cleaned || 'Medical Report';
};

export const getPatientReports = async (params = {}) => {
  const response = await api.get('/patients/reports', { params });
  return response.data;
};

export const getPatientReportById = async (reportId) => {
  const response = await api.get(`/patients/reports/${reportId}`);
  return response.data;
};

export const uploadPatientReport = async (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('report', file);
  formData.append('reportType', metadata.reportType || 'other');
  formData.append('title', metadata.title || inferTitleFromFilename(file?.name));
  formData.append('reportDate', metadata.reportDate || toIsoDate());

  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.hospitalOrLabName) formData.append('hospitalOrLabName', metadata.hospitalOrLabName);
  if (metadata.appointmentId) formData.append('appointmentId', metadata.appointmentId);
  if (metadata.doctorUserId) formData.append('doctorUserId', metadata.doctorUserId);
  if (metadata.doctorEmail) formData.append('doctorEmail', metadata.doctorEmail);
  if (metadata.visibility) formData.append('visibility', metadata.visibility);
  if (metadata.tags) {
    const tags = Array.isArray(metadata.tags) ? metadata.tags.join(',') : String(metadata.tags);
    if (tags.trim()) formData.append('tags', tags);
  }
  if (metadata.isCritical !== undefined) formData.append('isCritical', String(metadata.isCritical));

  const response = await api.post('/patients/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updatePatientReport = async (reportId, payload) => {
  const response = await api.patch(`/patients/reports/${reportId}`, payload);
  return response.data;
};

export const archivePatientReport = async (reportId) => {
  const response = await api.patch(`/patients/reports/${reportId}/archive`);
  return response.data;
};

export const sharePatientReport = async (reportId, doctorUserId) => {
  const response = await api.post(`/patients/reports/${reportId}/share`, { doctorUserId });
  return response.data;
};

export const unsharePatientReport = async (reportId, doctorUserId) => {
  const response = await api.post(`/patients/reports/${reportId}/unshare`, { doctorUserId });
  return response.data;
};

export const getPatientReportDownloadUrl = async (reportId, mode = 'download') => {
  const response = await api.get(`/patients/reports/download/${reportId}`, {
    params: { mode }
  });
  return response.data;
};

export const deletePatientReport = async (reportId) => {
  const response = await api.delete(`/patients/reports/${reportId}`);
  return response.data;
};

export const getPatientMedicalHistory = async () => {
  const response = await api.get('/patients/medical-history');
  return response.data;
};

export const getDoctorSharedReports = async () => {
  const response = await api.get('/patients/reports/shared/me');
  return response.data;
};

export const addDoctorNoteToReport = async (reportId, note) => {
  const response = await api.post(`/patients/reports/${reportId}/doctor-note`, { note });
  return response.data;
};

export const markReportNotesRead = async (reportId) => {
  const response = await api.post(`/patients/reports/${reportId}/doctor-note/read`);
  return response.data;
};

export const getVerifiedDoctorsForSharing = async () => {
  const response = await api.get('/public/doctors');
  return response.data;
};
