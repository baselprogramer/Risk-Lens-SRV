// src/utils/roleHelpers.js
// ── استخدم هذه الـ helpers في كل الصفحات ──

export const getRole = () => localStorage.getItem("role");

export const isSuperAdmin   = () => getRole() === "SUPER_ADMIN";
export const isCompanyAdmin = () => getRole() === "COMPANY_ADMIN";


// أي نوع من الـ admins
export const isAdmin = () =>
  ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(getRole());

// SUPER_ADMIN فقط
export const isSuperOnly = () => getRole() === "SUPER_ADMIN";

// يقدر يسجل decisions
export const canDecide = () =>
  ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(getRole());

// يقدر يغير حالة الـ case
export const canManageCases = () =>
  ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(getRole());