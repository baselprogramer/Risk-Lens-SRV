import { API_V1 } from "../config/api";
import { authHeaders, getToken } from "./authService";

const API_URL = `${API_V1}/internal-lists`;

const getJsonHeaders = () => ({
  ...authHeaders(),
  "Content-Type": "application/json",
});

// ===== جلب كل السجلات (الخاصة بالشركة تلقائياً) =====
export const getAllInternal = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ===== العدد =====
export const getInternalCount = async () => {
  const response = await fetch(`${API_URL}/stats/count`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ===== إنشاء =====
export const createInternal = async (data) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// ===== تعديل =====
export const updateInternal = async (id, data) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// ===== حذف =====
export const deleteInternal = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete: ${response.status} - ${errorText}`);
  }
};

// ===== استيراد Excel =====
export const importInternalFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_URL}/import`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  return response.json();
};