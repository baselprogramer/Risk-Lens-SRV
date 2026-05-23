import { API_V1 } from "../config/api";
import { authHeaders } from "./authService";
const API_URL = `${API_V1}/search`;

export const searchSanctions = async (query, threshold = 0.5, page = 0, size = 20) => {
  const response = await fetch(
    `${API_URL}?q=${encodeURIComponent(query)}&threshold=${threshold}&page=${page}&size=${size}`,
    { method: "GET", headers: authHeaders() }
  );
  if (!response.ok) throw new Error(`Search failed! status: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const getPersonDetails = async (id, source) => {
  const response = await fetch(
    `${API_URL}/details?id=${id}&source=${encodeURIComponent(source)}`,
    { method: "GET", headers: authHeaders() }
  );
  if (!response.ok) throw new Error(`Failed to fetch details! status: ${response.status}`);
  try {
    return await response.clone().json();
  } catch {
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }
};