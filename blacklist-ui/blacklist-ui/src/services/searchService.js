import { API_V1 } from "../config/api";
import { authHeaders } from "./authService";
const API_URL = `${API_V1}/search`;

// 🔍 Search with JWT token
export const searchSanctions = async (
  query,
  threshold = 0.5,
  page = 0,
  size = 20
) => {
  const response = await fetch(
    `${API_URL}?q=${encodeURIComponent(query)}&threshold=${threshold}&page=${page}&size=${size}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed! status: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

// 👤 Get Details with JWT token
export const getPersonDetails = async (id, source) => {
  const response = await fetch(
    `${API_URL}/details?id=${id}&source=${encodeURIComponent(source)}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch details! status: ${response.status}`);
  }

  try {
    // 💡 الحل السحري: نعمل استنساخ للـ Response لقراءة الـ JSON بأمان دون التأثر باستهلاك الـ Stream
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    
    console.log("البيانات المستخرجة بنجاح من النسخة المستنسخة:", data);
    return data;
  } catch (error) {
    console.error("فشلت قراءة الـ JSON من النسخة المستنسخة، محاولة القراءة كنص:", error);
    
    // حل احتياطي (Fallback) في حال كان السيرفر يعيد نصاً عادياً وليس JSON
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("فشلت المحاولة الاحتياطية أيضاً:", e);
      return null;
    }
  }
};