import { API_V1 } from "../config/api";
import { authHeaders } from "./authService";

// ══════════════════════════════════════════
// Dashboard
// ══════════════════════════════════════════
export const getDashboardData = async () => {
  const res = await fetch(`${API_V1}/dashboard`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
};

// ══════════════════════════════════════════
// Screening
// ══════════════════════════════════════════
export const createScreeningRequest = async (fullName) => {
  const res = await fetch(`${API_V1}/screening/screen`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fullName }),
  });
  if (!res.ok) throw new Error("Screening failed");
  return res.json();
};