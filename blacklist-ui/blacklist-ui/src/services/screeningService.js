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
//
// يقبل إما:
//   createScreeningRequest("Ahmad Mohammad")         ← بسيط كما كان
//   createScreeningRequest({ fullName, fullNameAr,   ← مع KYC
//     nationality, dob, idType, idNumber, country })
// ══════════════════════════════════════════
export const createScreeningRequest = async (input) => {

  // دعم الطريقتين — string بسيط أو object كامل
  const body = typeof input === "string"
    ? { fullName: input }
    : {
        fullName:    input.fullName    || "",
        fullNameAr:  input.fullNameAr  || undefined,
        nationality: input.nationality || undefined,
        dob:         input.dob         || undefined,   // yyyy-MM-dd
        idType:      input.idType      || undefined,
        idNumber:    input.idNumber    || undefined,
        country:     input.country     || undefined,
        motherName: input.motherName || undefined,
      };

  // حذف الحقول الفارغة حتى ما تُرسَل للباكند
  Object.keys(body).forEach(k => {
    if (body[k] === undefined || body[k] === "") delete body[k];
  });

  const res = await fetch(`${API_V1}/screening/screen`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Screening failed");
  return res.json();
};