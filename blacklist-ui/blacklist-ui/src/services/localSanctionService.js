import { API_V1 } from "../config/api";
import { authHeaders } from "./authService";
const API_URL = `${API_V1}/local-sanctions`;

// دالة مساعدة لتوحيد الـ Headers لعمليات JSON
const getJsonHeaders = () => ({
  ...authHeaders(),
  "Content-Type": "application/json",
});


// ===== جلب كل القوائم =====
export const getAllSanctions = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: authHeaders(), // هنا نحتاج التوكن فقط
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
    headers: getJsonHeaders(), // التوكن + نوع البيانات JSON
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
    headers: getJsonHeaders(), // التوكن + نوع البيانات JSON
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
    headers: authHeaders(), // تم تصحيح المسمى هنا
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete: ${response.status} - ${errorText}`);
  }
};