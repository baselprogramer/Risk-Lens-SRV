import { API_V1 } from "../config/api";

export const getDashboardStats = async () => {
const response = await fetch(`${API_V1}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.json();
};
