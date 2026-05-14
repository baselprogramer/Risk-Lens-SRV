export const BASE_URL = "https://api.risklens.com";
export const API_V1   = `${BASE_URL}/api/v1`;

export const ENDPOINTS = {
  // Auth
  LOGIN:    `${API_V1}/auth/authenticate`,
  REGISTER: `${API_V1}/auth/register`,

  // Screening
  SCREENING:            `${API_V1}/screening`,
  SCREENING_HISTORY:    `${API_V1}/screening/my-history`,

  // Transfer
  TRANSFER:             `${API_V1}/transfer`,
  TRANSFER_HISTORY:     `${API_V1}/transfer/history`,
  TRANSFER_STATS:       `${API_V1}/transfer/stats`,

  // Decisions
  DECISIONS:            `${API_V1}/decisions`,
  DECISIONS_STATS:      `${API_V1}/decisions/stats`,
  DECISIONS_ALL:        `${API_V1}/decisions/all`,

  // Dashboard
  DASHBOARD:            `${API_V1}/dashboard`,

  // Search
  SEARCH:                 `${API_V1}/elastic`,

  // Admin
  USERS:                `${API_V1}/admin/users`,
  LOCAL:                `${API_V1}/local-sanctions`,
  SYNC:                 `${API_V1}/sync`,
  ELASTIC:              `${API_V1}/elastic`,

// Webhooks

  WEBHOOKS:   `${API_V1}/webhooks`,

  MONITORING: `${API_V1}/monitoring`,


};
