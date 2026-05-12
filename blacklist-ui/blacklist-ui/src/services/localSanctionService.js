import { API_V1 } from "../config/api";
const API_URL = `${API_V1}/local-sanctions`;

// دالة مساعدة تجيب التوكن
const getAuthHeader = () => {
  const token = localStorage.getItem("jwtToken");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
};

// ===== جلب كل القوائم =====
export const getAllSanctions = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeader()
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// ===== إنشاء =====
export const createSanction = async (data) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// ===== تعديل =====
export const updateSanction = async (id, data) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// ===== حذف =====
export const deleteSanction = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeader()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete: ${response.status} - ${errorText}`);
  }
};
