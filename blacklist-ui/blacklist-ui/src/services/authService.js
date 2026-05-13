// 🔑 Get Token
export const getToken    = () => localStorage.getItem("jwtToken");

// � Auth headers helper
export const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// �👤 Get username
export const getUsername = () => localStorage.getItem("username");

// 🛡 Get role
export const getUserRole = () => localStorage.getItem("role");

// 🏢 Get tenantId
export const getTenantId = () => localStorage.getItem("tenantId");

// ── Role Helpers ──
export const isSuperAdmin   = () => localStorage.getItem("role") === "SUPER_ADMIN";
export const isCompanyAdmin = () => localStorage.getItem("role") === "COMPANY_ADMIN";

// أي نوع من الـ admins
export const isAdmin = () =>
  ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(localStorage.getItem("role"));

// موظف عادي
export const isSubscriber = () => localStorage.getItem("role") === "SUBSCRIBER";

// مسجل دخول
export const isLoggedIn = () => !!localStorage.getItem("jwtToken");

// يقدر يسجل decisions
export const canDecide = () =>
  ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(localStorage.getItem("role"));

// يقدر يدير cases
export const canManageCases = () =>
  ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(localStorage.getItem("role"));

// 🚪 Logout
export const logout = () => {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("tenantId"); // ✅ جديد
};