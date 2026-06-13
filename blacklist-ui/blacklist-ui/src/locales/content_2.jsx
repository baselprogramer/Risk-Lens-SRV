import {
  Users, Plus, Trash2, RefreshCw, Shield, User, Key, Building2, ChevronDown, ChevronRight,
  XCircle, CheckCircle, Clock, AlertTriangle, Scale, Edit2, ArrowLeftRight, Download,
  Activity, Database, Zap, TrendingUp,
} from "lucide-react";

const C_ICON = {
  cyan:   "#00d4ff",
  purple: "#8b5cf6",
  green:  "#10b981",
  orange: "#f59e0b",
  red:    "#ef4444",
};

export const staticContent2 = {

  // ─────────────────────────────────────────────────────────────────────────
  //  USER MANAGEMENT PAGE
  // ─────────────────────────────────────────────────────────────────────────
  users: {
    ar: {
      pageTitle: "إدارة المستخدمين",
      subtitleSuper: "كل الشركات والمستخدمين",
      subtitleAdmin: "أعضاء فريقك",
      newUserBtn: "مستخدم جديد",

      // ── Messages ─────────────────────────────────────────────
      msgLoadUsersFailed: "فشل تحميل المستخدمين",
      msgUserCreated:     "تم إنشاء المستخدم ✅",
      msgRoleChanged:     "تم تغيير الدور ✅",
      msgFailed:          "فشلت العملية",
      msgError:           "حدث خطأ",
      msgPasswordReset:   "تم إعادة تعيين كلمة المرور ✅",
      msgUserDeleted:     "تم حذف المستخدم ✅",
      msgMinChars:        "6 أحرف على الأقل",
      confirmDelete:      "حذف",

      // ── Create form ──────────────────────────────────────────
      createTitle:    "إنشاء مستخدم جديد",
      usernameLabel:  "اسم المستخدم *",
      usernamePlaceholder: "اسم المستخدم",
      passwordLabel:  "كلمة المرور *",
      passwordPlaceholder: "6 أحرف على الأقل",
      roleLabel:      "الدور",
      companyLabel:   "الشركة",
      noCompanyOption: "بدون شركة (نظام)",
      creatingBtn:    "جارٍ الإنشاء...",
      createBtn:      "إنشاء المستخدم",

      // ── Role labels ──────────────────────────────────────────
      roleLabels: {
        SUPER_ADMIN:   "مسؤول عام",
        COMPANY_ADMIN: "مسؤول الشركة",
        SUBSCRIBER:    "مشترك",
      },

      // ── Super Admin view ─────────────────────────────────────
      superAdminsTitle: "المسؤولون العامون",
      userSingular: "مستخدم",
      userPlural:   "مستخدمين",
      adminLabel:   "المسؤول",
      subscribersLabel: "مشتركين",
      noSubscribersYet: "لا يوجد مشتركون بعد",

      // ── Stats ────────────────────────────────────────────────
      statsSuper: [
        { key:"companies",     label:"الشركات",        color:C_ICON.cyan   },
        { key:"companyAdmins", label:"مسؤولو الشركات", color:C_ICON.cyan   },
        { key:"subscribers",   label:"المشتركون",      color:C_ICON.green  },
        { key:"totalUsers",    label:"إجمالي المستخدمين", color:C_ICON.purple },
      ],
      statsAdmin: [
        { key:"total",  label:"الإجمالي", color:C_ICON.cyan  },
        { key:"active", label:"نشط",      color:C_ICON.green },
      ],

      // ── Company Admin view ───────────────────────────────────
      tableHeaders: ["#","اسم المستخدم","الدور","الإجراءات",""],
      noTeamMembers: "لا يوجد أعضاء فريق بعد — أنشئ أول مشترك",

      // ── Reset password modal ─────────────────────────────────
      resetPasswordTitle: "إعادة تعيين كلمة المرور",
      userLabel: "المستخدم:",
      newPasswordPlaceholder: "كلمة مرور جديدة (6 أحرف على الأقل)",
      cancelBtn: "إلغاء",
      resetBtn: "إعادة تعيين",

      // ── Row actions ──────────────────────────────────────────
      resetTooltip: "إعادة تعيين كلمة المرور",
      deleteTooltip: "حذف",
      resetMobileBtn: "إعادة تعيين",
    },

    en: {
      pageTitle: "User Management",
      subtitleSuper: "All companies & users",
      subtitleAdmin: "Your team members",
      newUserBtn: "New User",

      // ── Messages ─────────────────────────────────────────────
      msgLoadUsersFailed: "Failed to load users",
      msgUserCreated:     "User created ✅",
      msgRoleChanged:     "Role updated ✅",
      msgFailed:          "Failed",
      msgError:           "Error",
      msgPasswordReset:   "Password reset ✅",
      msgUserDeleted:     "User deleted ✅",
      msgMinChars:        "Min 6 characters",
      confirmDelete:      "Delete",

      // ── Create form ──────────────────────────────────────────
      createTitle:    "Create New User",
      usernameLabel:  "Username *",
      usernamePlaceholder: "username",
      passwordLabel:  "Password *",
      passwordPlaceholder: "min 6 chars",
      roleLabel:      "Role",
      companyLabel:   "Company",
      noCompanyOption: "No Company (System)",
      creatingBtn:    "Creating...",
      createBtn:      "Create User",

      // ── Role labels ──────────────────────────────────────────
      roleLabels: {
        SUPER_ADMIN:   "SUPER ADMIN",
        COMPANY_ADMIN: "COMPANY ADMIN",
        SUBSCRIBER:    "SUBSCRIBER",
      },

      // ── Super Admin view ─────────────────────────────────────
      superAdminsTitle: "Super Admins",
      userSingular: "user",
      userPlural:   "users",
      adminLabel:   "Admin",
      subscribersLabel: "subscribers",
      noSubscribersYet: "No subscribers yet",

      // ── Stats ────────────────────────────────────────────────
      statsSuper: [
        { key:"companies",     label:"Companies",     color:C_ICON.cyan   },
        { key:"companyAdmins", label:"Company Admin", color:C_ICON.cyan   },
        { key:"subscribers",   label:"Subscribers",   color:C_ICON.green  },
        { key:"totalUsers",    label:"Total Users",   color:C_ICON.purple },
      ],
      statsAdmin: [
        { key:"total",  label:"Total",  color:C_ICON.cyan  },
        { key:"active", label:"Active", color:C_ICON.green },
      ],

      // ── Company Admin view ───────────────────────────────────
      tableHeaders: ["#","Username","Role","Actions",""],
      noTeamMembers: "No team members yet — create your first subscriber",

      // ── Reset password modal ─────────────────────────────────
      resetPasswordTitle: "Reset Password",
      userLabel: "User:",
      newPasswordPlaceholder: "New password (min 6 chars)",
      cancelBtn: "Cancel",
      resetBtn: "Reset",

      // ── Row actions ──────────────────────────────────────────
      resetTooltip: "Reset Password",
      deleteTooltip: "Delete",
      resetMobileBtn: "Reset",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  AUDIT TRAIL PAGE
  // ─────────────────────────────────────────────────────────────────────────
  
  audit: {
     ar: {
       pageTitle: "سجل التدقيق",
       subtitleSuper: "قرارات كل الشركات",
       subtitleAdmin: "قرارات شركتك",
       exportBtn: "تصدير التقرير",
       refreshBtn: "تحديث",
       typeCfg: {
         PERSON:   { label: "شخص",   color: C_ICON.cyan,   icon: <User size={11}/> },
         TRANSFER: { label: "تحويل", color: C_ICON.purple, icon: <ArrowLeftRight size={11}/> },
         },
 
       // ── Stats ────────────────────────────────────────────────
       statsLabels: [
         { key:"total",          label:"الإجمالي",        color:C_ICON.cyan,   icon:<Scale size={12}/>         },
         { key:"trueMatches",    label:"مطابقة حقيقية",   color:C_ICON.red,    icon:<XCircle size={12}/>       },
         { key:"falsePositives", label:"إيجابي كاذب",     color:C_ICON.green,  icon:<CheckCircle size={12}/>    },
         { key:"pendingReview",  label:"بانتظار",          color:C_ICON.orange, icon:<Clock size={12}/>         },
         { key:"riskAccepted",   label:"تم قبول المخاطرة",color:C_ICON.purple, icon:<AlertTriangle size={12}/> },
       ],
 
       // ── Filters ──────────────────────────────────────────────
       filters: [
         { value:"ALL",            label:"الكل",            color:C_ICON.text2 || "#7a8fa8", icon:null                 },
         { value:"TRUE_MATCH",     label:"مطابقة حقيقية",   color:C_ICON.red,    icon:<XCircle size={11}/>        },
         { value:"FALSE_POSITIVE", label:"إيجابي كاذب",     color:C_ICON.green,  icon:<CheckCircle size={11}/>    },
         { value:"PENDING_REVIEW", label:"بانتظار",          color:C_ICON.orange, icon:<Clock size={11}/>          },
         { value:"RISK_ACCEPTED",  label:"تم قبول المخاطرة",color:C_ICON.cyan,   icon:<AlertTriangle size={11}/>  },
       ],
       searchPlaceholder: "بحث...",
 
       // ── Decision config ──────────────────────────────────────
       decisionCFG: {
         TRUE_MATCH:     { color:C_ICON.red,    bg:"rgba(239,68,68,0.12)",  icon:<XCircle size={11}/>,      label:"مطابقة حقيقية"    },
         FALSE_POSITIVE: { color:C_ICON.green,  bg:"rgba(16,185,129,0.12)", icon:<CheckCircle size={11}/>,  label:"إيجابي كاذب"      },
         PENDING_REVIEW: { color:C_ICON.orange, bg:"rgba(245,158,11,0.12)", icon:<Clock size={11}/>,         label:"بانتظار المراجعة" },
         RISK_ACCEPTED:  { color:C_ICON.cyan,   bg:"rgba(0,212,255,0.12)",  icon:<AlertTriangle size={11}/>, label:"تم قبول المخاطرة" },
       },
       decisions: [
         { value:"TRUE_MATCH",     label:"مطابقة حقيقية",    color:C_ICON.red,    icon:<XCircle size={13}/>     },
         { value:"FALSE_POSITIVE", label:"إيجابي كاذب",      color:C_ICON.green,  icon:<CheckCircle size={13}/> },
         { value:"PENDING_REVIEW", label:"بانتظار المراجعة", color:C_ICON.orange, icon:<Clock size={13}/>        },
         { value:"RISK_ACCEPTED",  label:"تم قبول المخاطرة", color:C_ICON.cyan,   icon:<AlertTriangle size={13}/>},
       ],
 
       // ── Table headers ────────────────────────────────────────
       tableHeaders: ["#","النوع","المرجع","الموضوع","القرار","التعليق","بواسطة","التاريخ"],
 
       // ── Empty states ─────────────────────────────────────────
       noResultsFor: "لا توجد نتائج لـ",
       noDecisions:  "لم يتم تسجيل أي قرارات بعد",
       showingOf:    "عرض",
       ofLabel:      "من",
       allTypes:     "كل الأنواع",
 
       // ── Edit modal ───────────────────────────────────────────
       editTitle: "تعديل القرار",
       subjectLabel: "الموضوع",
       currentLabel: "الحالي:",
       changeToLabel: "تغيير إلى:",
       commentPlaceholder: "تحديث التعليق / السبب...",
       errSaveFailed: "فشل الحفظ — حاول مجدداً",
       cancelBtn: "إلغاء",
       savingBtn: "جارٍ الحفظ...",
       updateBtn: "تحديث",
       editBtn: "تعديل",
 
       // ── Export HTML ───────────────────────────────────────────
       export: {
         reportTitle: "سجل التدقيق",
         printBtn: "طباعة / حفظ PDF",
         confidential: "تقرير امتثال مكافحة غسل الأموال · سري",
 
         screeningDecisions: "قرارات فحص العقوبات ومكافحة غسل الأموال",
 
         generatedBy: "تم الإنشاء بواسطة",
         generatedAt: "تاريخ الإنشاء",
         filterApplied: "الفلتر المطبق",
         totalRecords: "إجمالي السجلات",
 
         decisionSummary: "ملخص القرارات",
 
         tableHeaders: [
             "#",
             "النوع",
             "المرجع",
             "الموضوع",
             "القرار",
             "بواسطة",
             "التعليق",
             "التاريخ"
         ],
 
         footerText: "RiskLens — منصة ذكاء العقوبات ومكافحة غسل الأموال",
 
         footerNote: "هذا التقرير سري ومخصص لأغراض الامتثال فقط"
         }
     },
 
     en: {
       pageTitle: "Audit Trail",
       subtitleSuper: "All companies decisions",
       subtitleAdmin: "Your company decisions",
       exportBtn: "Export Report",
       refreshBtn: "Refresh",
       typeCfg: {
         PERSON:   { label: "Person",   color: C_ICON.cyan,   icon: <User size={11}/> },
         TRANSFER: { label: "Transfer", color: C_ICON.purple, icon: <ArrowLeftRight size={11}/> },
         },
 
       // ── Stats ────────────────────────────────────────────────
       statsLabels: [
         { key:"total",          label:"Total",          color:C_ICON.cyan,   icon:<Scale size={12}/>         },
         { key:"trueMatches",    label:"True Match",     color:C_ICON.red,    icon:<XCircle size={12}/>       },
         { key:"falsePositives", label:"False Positive", color:C_ICON.green,  icon:<CheckCircle size={12}/>   },
         { key:"pendingReview",  label:"Pending",        color:C_ICON.orange, icon:<Clock size={12}/>         },
         { key:"riskAccepted",   label:"Risk Accepted",  color:C_ICON.purple, icon:<AlertTriangle size={12}/> },
       ],
 
       // ── Filters ──────────────────────────────────────────────
       filters: [
         { value:"ALL",            label:"All",            color:"#7a8fa8",     icon:null                        },
         { value:"TRUE_MATCH",     label:"True Match",     color:C_ICON.red,    icon:<XCircle size={11}/>        },
         { value:"FALSE_POSITIVE", label:"False Positive", color:C_ICON.green,  icon:<CheckCircle size={11}/>    },
         { value:"PENDING_REVIEW", label:"Pending",        color:C_ICON.orange, icon:<Clock size={11}/>          },
         { value:"RISK_ACCEPTED",  label:"Risk Accepted",  color:C_ICON.cyan,   icon:<AlertTriangle size={11}/>  },
       ],
       searchPlaceholder: "Search...",
 
       // ── Decision config ──────────────────────────────────────
       decisionCFG: {
         TRUE_MATCH:     { color:C_ICON.red,    bg:"rgba(239,68,68,0.12)",  icon:<XCircle size={11}/>,      label:"True Match"     },
         FALSE_POSITIVE: { color:C_ICON.green,  bg:"rgba(16,185,129,0.12)", icon:<CheckCircle size={11}/>,  label:"False Positive" },
         PENDING_REVIEW: { color:C_ICON.orange, bg:"rgba(245,158,11,0.12)", icon:<Clock size={11}/>,         label:"Pending Review" },
         RISK_ACCEPTED:  { color:C_ICON.cyan,   bg:"rgba(0,212,255,0.12)",  icon:<AlertTriangle size={11}/>, label:"Risk Accepted"  },
       },
       decisions: [
         { value:"TRUE_MATCH",     label:"True Match",     color:C_ICON.red,    icon:<XCircle size={13}/>     },
         { value:"FALSE_POSITIVE", label:"False Positive", color:C_ICON.green,  icon:<CheckCircle size={13}/> },
         { value:"PENDING_REVIEW", label:"Pending Review", color:C_ICON.orange, icon:<Clock size={13}/>        },
         { value:"RISK_ACCEPTED",  label:"Risk Accepted",  color:C_ICON.cyan,   icon:<AlertTriangle size={13}/>},
       ],
 
       // ── Table headers ────────────────────────────────────────
       tableHeaders: ["#","Type","Ref","Subject","Decision","Comment","By","Date"],
 
       // ── Empty states ─────────────────────────────────────────
       noResultsFor: "No results for",
       noDecisions:  "No decisions recorded yet",
       showingOf:    "Showing",
       ofLabel:      "of",
       allTypes:     "All types",
 
       // ── Edit modal ───────────────────────────────────────────
       editTitle: "Edit Decision",
       subjectLabel: "Subject",
       currentLabel: "Current:",
       changeToLabel: "Change to:",
       commentPlaceholder: "Update comment / reason...",
       errSaveFailed: "Failed to save — try again",
       cancelBtn: "Cancel",
       savingBtn: "Saving...",
       updateBtn: "Update",
       editBtn: "Edit",
 
       // ── Export HTML ───────────────────────────────────────────
       export: {
         reportTitle: "Audit Trail",
         printBtn: "Print / Save as PDF",
         confidential: "AML Compliance Report · Confidential",
 
         screeningDecisions: "Sanctions & AML Screening Decisions",
 
         generatedBy: "Generated By",
         generatedAt: "Generated At",
         filterApplied: "Filter Applied",
         totalRecords: "Total Records",
 
         decisionSummary: "Decision Summary",
 
         tableHeaders: [
             "#",
             "Type",
             "Ref",
             "Subject",
             "Decision",
             "Decided By",
             "Comment",
             "Date"
         ],
 
         footerText: "RiskLens — Sanctions & AML Intelligence Platform",
 
         footerNote: "This report is confidential and for compliance purposes only"
         }
     },
   },

  // ─────────────────────────────────────────────────────────────────────────
  //  MONITORING PAGE
  // ─────────────────────────────────────────────────────────────────────────
  monitoring: {
    ar: {
      pageTitle: "المراقبة",
      activeCount: "نشطة",
      refreshBtn: "تحديث",

      typeMeta: {
        ES_DOWN:        { label: "Elasticsearch",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",  icon: Database     },
        RATE_LIMIT:     { label: "حد الاستخدام",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: Zap          },
        IMPORT_FAILED:  { label: "فشل الاستيراد",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: AlertTriangle },
        CRITICAL_SPIKE: { label: "ارتفاع حرج",      color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",  icon: TrendingUp   },
      },

      severityLabels: { CRITICAL: "حرج", WARNING: "تحذير" },

      noActiveAlerts: "كل شي شغّال — لا يوجد تنبيهات نشطة",
      noAlerts:       "لا يوجد تنبيهات",

      resolvedBadge: "تم الحل",
      resolvedAtLabel: "تم الحل:",
      resolveBtn: "حل",

      activeTab: "نشطة",
      allAlertsTab: "كل التنبيهات",
    },

    en: {
      pageTitle: "Monitoring",
      activeCount: "active",
      refreshBtn: "Refresh",

      typeMeta: {
        ES_DOWN:        { label: "Elasticsearch",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",  icon: Database      },
        RATE_LIMIT:     { label: "Rate Limit",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: Zap           },
        IMPORT_FAILED:  { label: "Import Failed",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: AlertTriangle },
        CRITICAL_SPIKE: { label: "Critical Spike", color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",  icon: TrendingUp    },
      },

      severityLabels: { CRITICAL: "CRITICAL", WARNING: "WARNING" },

      noActiveAlerts: "All clear — no active alerts",
      noAlerts:       "No alerts",

      resolvedBadge: "Resolved",
      resolvedAtLabel: "Resolved:",
      resolveBtn: "Resolve",

      activeTab: "Active",
      allAlertsTab: "All Alerts",
    },
  },

// ─────────────────────────────────────────────────────────────────────────
//  LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────
  login: {
    ar: {
      // Logo
      appName: "RiskLens",
      logoTag: "مكافحة غسل الأموال · العقوبات · الامتثال",

      // Left Panel
      brandKicker: "معلومات آنية",

      headlineLine1: "فحص العقوبات العالمية",
      headlineBeforeEm: "ومكافحة",
      headlineEm: "غسل الأموال",
      headlineAfterEm: "والقوائم السوداء",

      brandBody:
        "مطابقة فورية عبر أكثر من 200 قائمة مراقبة دولية وقواعد بيانات الأشخاص السياسيين البارزين (PEP) والأخبار السلبية وسجلات القوائم السوداء لفرق الامتثال التي تتطلب أعلى درجات الدقة.",

      // Stats
      watchlistsCount: "200+",
      watchlistsLabel: "قوائم المراقبة",

      responseTimeValue: "<300ms",
      responseTimeLabel: "زمن الاستجابة",

      uptimeValue: "99.9%",
      uptimeLabel: "التوافر",

      // Certifications
      certISO: "ISO 27001",
      certSOC: "SOC 2",
      certGDPR: "GDPR",
      certFATF: "FATF",

      // Orbit labels
      ofac: "قائمة OFAC",
      unsc: "الأمم المتحدة",
      euList: "الاتحاد الأوروبي",
      hmt: "الخزانة البريطانية",
      pep: "الأشخاص السياسيون",
      fatf: "FATF",

      // Form
      authorizedAccess: "دخول للمصرح لهم فقط",

      signInTitle: "تسجيل الدخول الآمن",
      signInSubtitle: "بوابة العقوبات الدولية والمحلية",

      username: "اسم المستخدم",
      usernamePlaceholder: "أدخل اسم المستخدم",

      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",

      // Messages
      invalidCredentials: "اسم المستخدم أو كلمة المرور غير صحيحة",
      loginFailed: "فشل تسجيل الدخول",
      networkError: "تعذر الاتصال بالخادم",

      // Button
      authenticating: "جاري التحقق...",
      signInButton: "تسجيل الدخول",

      // Footer
      tls: "تشفير TLS ‏256 بت",
      mfa: "مصادقة متعددة العوامل",
      version: "الإصدار",
    },

    en: {
      // Logo
      appName: "RiskLens",
      logoTag: "AML · Sanctions · Compliance",

      // Left Panel
      brandKicker: "Real-time Intelligence",

      headlineLine1: "Global Sanctions",
      headlineBeforeEm: "&",
      headlineEm: "AML",
      headlineAfterEm: "Screening",

      brandBody:
        "Instant matching across 200+ international watchlists, PEP databases, adverse media, and blacklist registries for compliance teams that demand precision.",

      // Stats
      watchlistsCount: "200+",
      watchlistsLabel: "Watchlists",

      responseTimeValue: "<300ms",
      responseTimeLabel: "Response",

      uptimeValue: "99.9%",
      uptimeLabel: "Uptime",

      // Certifications
      certISO: "ISO 27001",
      certSOC: "SOC 2",
      certGDPR: "GDPR",
      certFATF: "FATF",

      // Orbit labels
      ofac: "OFAC SDN",
      unsc: "UN SC",
      euList: "EU LIST",
      hmt: "HMT",
      pep: "PEP",
      fatf: "FATF",

      // Form
      authorizedAccess: "Authorized Access Only",

      signInTitle: "Secure Sign In",
      signInSubtitle: "International & Domestic Sanctions Portal",

      username: "Username",
      usernamePlaceholder: "Enter your username",

      password: "Password",
      passwordPlaceholder: "Enter your password",

      // Messages
      invalidCredentials: "Invalid username or password",
      loginFailed: "Login Failed",
      networkError: "Unable to connect to server",

      // Button
      authenticating: "Authenticating...",
      signInButton: "Sign In to Portal",

      // Footer
      tls: "256-bit TLS",
      mfa: "MFA Enforced",
      version: "Version",
    },
  }
};