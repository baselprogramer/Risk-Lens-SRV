import { API_V1 } from "../config/api";
import { authHeaders, getToken } from "./authService";

const API_URL = `${API_V1}/batch-screening`;

// ===== رفع ملف الفحص الجماعي → يرجّع { jobId, status, totalRecords, ... } فوراً =====
export const uploadBatch = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!response.ok) {
    // الـ backend بيرجّع رسالة عربية واضحة للملف الغلط (بلا عمود اسم / فاضي)
    const errorText = await response.text();
    throw new Error(errorText || `Upload failed: ${response.status}`);
  }
  return response.json();
};

// ===== حالة الـ job + progressPercent (للـ polling) =====
export const getBatchJob = async (jobId) => {
  const response = await fetch(`${API_URL}/${jobId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ===== نتائج الفحص (صف لكل اسم) =====
export const getBatchResults = async (jobId) => {
  const response = await fetch(`${API_URL}/${jobId}/results`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ===== تاريخ الـ jobs (تبع الشركة، أو الكل للسوبر أدمن) =====
export const getBatchHistory = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};