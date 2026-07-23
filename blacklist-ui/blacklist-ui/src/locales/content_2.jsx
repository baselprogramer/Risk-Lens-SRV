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
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  FORM SANCTIONS LIST 
  // ─────────────────────────────────────────────────────────────────────────


// locales/content_2.tsx
//
// Self-contained: the form owns every string it renders, so BOTH the
// Internal Lists page and the Local Sanctions page share one copy.
//
// Shape is form -> lang -> keys  (not lang -> form -> keys), so the
// component reads staticContent2.form[lang].motherName

  form: {
      ar: {
        // --- Record type toggle ---
        person                    : "شخص",
        entity                    : "كيان",

        // --- Name (label + placeholder switch on record type) ---
        fullName                  : "الاسم الكامل",
        companyName               : "اسم الشركة",
        namePlaceholderPerson     : "مثال: أحمد محمد",
        namePlaceholderEntity     : "مثال: شركة الخليج للتجارة ذ.م.م",

        // --- Person fields ---
        aliases                   : "الأسماء المستعارة",
        aliasesHint               : "💡 افصل بين الأسماء المستعارة بفاصلة منقوطة (;)",
        aliasesPlaceholder        : "مثال: أبو محمد; أحمد م.",
        dateOfBirth               : "تاريخ الميلاد",
        nationality               : "الجنسية",
        nationalityPlaceholder    : "مثال: سوري",
        motherName                : "اسم الأم",
        motherNamePlaceholder     : "مثال: فاطمة",
        idNumber                  : "رقم الهوية / الجواز",
        idNumberPlaceholder       : "مثال: 784-1025-1349965-6",
        issuingAuthority          : "جهة الإصدار",
        issuingAuthorityPhPerson  : "مثال: الاستخبارات الجنائية",
        additionalInfo            : "معلومات إضافية",
        additionalInfoPlaceholder : "مثال: إدراج ضمن القائمة السوداء",

        // --- Entity fields ---
        entityType                : "نوع الكيان",
        entityTypePlaceholder     : "مثال: شركة مساهمة",
        commercialRegNo           : "رقم السجل التجاري",
        commercialRegNoPlaceholder: "مثال: 903918/CR",
        issuingAuthorityPhEntity  : "مثال: المباحث المالية",

        // --- Notes ---
        note                      : "ملاحظات",
        notePlaceholder           : "أضف أي ملاحظات أو تفاصيل إضافية...",

        // --- Buttons ---
        // Generic on purpose: this form is shared by Internal Lists and
        // Local Sanctions, so it can't say "Sanction".
        submitAdd                 : "إضافة سجل",
        submitUpdate              : "تحديث السجل",
        cancel                    : "إلغاء",
      },

      en: {
        // --- Record type toggle ---
        person                    : "Person",
        entity                    : "Entity",

        // --- Name ---
        fullName                  : "Full Name",
        companyName               : "Company Name",
        namePlaceholderPerson     : "e.g. Ahmad Mohammed",
        namePlaceholderEntity     : "e.g. Gulf Trading LLC",

        // --- Person fields ---
        aliases                   : "Aliases",
        aliasesHint               : "💡 Separate multiple aliases with semicolons (;)",
        aliasesPlaceholder        : "e.g. Abo Mohammad; Ahmad M.",
        dateOfBirth               : "Date of Birth",
        nationality               : "Nationality",
        nationalityPlaceholder    : "e.g. Syrian",
        motherName                : "Mother Name",
        motherNamePlaceholder     : "e.g. Fatima",
        idNumber                  : "ID / Passport Number",
        idNumberPlaceholder       : "e.g. 784-1025-1349965-6",
        issuingAuthority          : "Issuing Authority",
        issuingAuthorityPhPerson  : "e.g. Criminal Intelligence",
        additionalInfo            : "Additional Info",
        additionalInfoPlaceholder : "e.g. Listed on the blacklist",

        // --- Entity fields ---
        entityType                : "Entity Type",
        entityTypePlaceholder     : "e.g. Joint-stock company",
        commercialRegNo           : "Commercial Reg. No.",
        commercialRegNoPlaceholder: "e.g. 903918/CR",
        issuingAuthorityPhEntity  : "e.g. Financial Investigations",

        // --- Notes ---
        note                      : "Notes",
        notePlaceholder           : "Add any additional notes or remarks...",

        // --- Buttons ---
        submitAdd                 : "Add Record",
        submitUpdate              : "Update Record",
        cancel                    : "Cancel",
      },
    },

  // ─────────────────────────────────────────────────────────────────────────
  //  GLOBAL SANCTIONS LIST PAGE
  // ─────────────────────────────────────────────────────────────────────────
  globalSanctions: {
    ar: {
      pageTitle: "قوائم العقوبات",
      pageSubtitle: "OFAC · الأمم المتحدة · الاتحاد الأوروبي · المملكة المتحدة · الإنتربول · البنك الدولي",
      recordsLabel: "سجل",

      // ── Source labels (icons/colors stay in the page file) ────
      sourceLabels: {
        ALL:        "كل القوائم",
        OFAC:       "OFAC",
        UN:         "الأمم المتحدة",
        EU:         "الاتحاد الأوروبي",
        UK:         "المملكة المتحدة",
        INTERPOL:   "الإنتربول",
        WORLD_BANK: "البنك الدولي",
      },

      // ── Record type labels ─────────────────────────────────────
      typeLabels: {
        INDIVIDUAL: "فرد",
        ENTITY:     "كيان",
        VESSEL:     "سفينة",
        AIRCRAFT:   "طائرة",
      },

      searchPlaceholder: "🔍 بحث بالاسم، البلد...",
      resultsSuffix: "نتيجة · اضغط على الصف للتفاصيل",

      tableHeaders: ["#","الاسم","الأسماء المستعارة","النوع","البلد","المصدر","تاريخ الميلاد"],

      noResultsFound:     "لا توجد نتائج",
      noRecordsAvailable: "لا توجد سجلات متاحة",

      moreSuffix: "أخرى",
      paginationOf: "من",
      dash: "—",

      // ── Detail popup ─────────────────────────────────────────
      detail: {
        aliasesTitle:  "الأسماء المستعارة",
        noAliases:     "لا توجد أسماء مستعارة",
        countryTitle:  "البلد / الجنسية",
        dobTitle:      "تاريخ الميلاد",
        programTitle:  "البرنامج / النظام",
        idsTitle:      "الهويات / الوثائق",
        moreLabel:     "المزيد",
      },

      // ── Country code → Arabic name ───────────────────────────
      countryNames: {
        af:"أفغانستان", al:"ألبانيا", dz:"الجزائر", ao:"أنغولا", ar:"الأرجنتين",
        am:"أرمينيا", au:"أستراليا", at:"النمسا", az:"أذربيجان", bh:"البحرين",
        by:"بيلاروسيا", be:"بلجيكا", bz:"بليز", bo:"بوليفيا", ba:"البوسنة والهرسك",
        br:"البرازيل", bg:"بلغاريا", kh:"كمبوديا", cm:"الكاميرون", ca:"كندا",
        cf:"جمهورية أفريقيا الوسطى", td:"تشاد", cl:"تشيلي", cn:"الصين", co:"كولومبيا",
        cd:"الكونغو (الديمقراطية)", cr:"كوستاريكا", hr:"كرواتيا", cu:"كوبا", cy:"قبرص",
        cz:"التشيك", dk:"الدنمارك", do:"جمهورية الدومينيكان", ec:"الإكوادور",
        eg:"مصر", sv:"السلفادور", et:"إثيوبيا", fi:"فنلندا", fr:"فرنسا",
        ge:"جورجيا", de:"ألمانيا", gh:"غانا", gr:"اليونان", gt:"غواتيمالا",
        gn:"غينيا", ht:"هايتي", hn:"هندوراس", hk:"هونغ كونغ", hu:"المجر",
        in:"الهند", id:"إندونيسيا", ir:"إيران", iq:"العراق", ie:"أيرلندا", il:"إسرائيل",
        it:"إيطاليا", jm:"جامايكا", jp:"اليابان", jo:"الأردن", kz:"كازاخستان",
        ke:"كينيا", kp:"كوريا الشمالية", kr:"كوريا الجنوبية", kw:"الكويت", kg:"قيرغيزستان",
        lb:"لبنان", ly:"ليبيا", lt:"ليتوانيا", lu:"لوكسمبورغ", mk:"مقدونيا الشمالية",
        my:"ماليزيا", ml:"مالي", mx:"المكسيك", md:"مولدوفا", mn:"منغوليا",
        me:"الجبل الأسود", ma:"المغرب", mz:"موزمبيق", mm:"ميانمار", np:"نيبال",
        nl:"هولندا", nz:"نيوزيلندا", ni:"نيكاراغوا", ne:"النيجر", ng:"نيجيريا",
        no:"النرويج", om:"عُمان", pk:"باكستان", pa:"بنما", py:"باراغواي", pe:"بيرو",
        ph:"الفلبين", pl:"بولندا", pt:"البرتغال", qa:"قطر", ro:"رومانيا",
        ru:"روسيا", rw:"رواندا", sa:"السعودية", sn:"السنغال", rs:"صربيا",
        sl:"سيراليون", so:"الصومال", za:"جنوب أفريقيا", ss:"جنوب السودان",
        es:"إسبانيا", lk:"سريلانكا", sd:"السودان", se:"السويد", ch:"سويسرا",
        sy:"سوريا", tw:"تايوان", tj:"طاجيكستان", tz:"تنزانيا", th:"تايلاند",
        tn:"تونس", tr:"تركيا", tm:"تركمانستان", ug:"أوغندا", ua:"أوكرانيا",
        ae:"الإمارات العربية المتحدة", gb:"المملكة المتحدة", us:"الولايات المتحدة",
        uy:"أوروغواي", uz:"أوزبكستان", ve:"فنزويلا", vn:"فيتنام", ye:"اليمن",
        zm:"زامبيا", zw:"زيمبابوي", un:"الأمم المتحدة", eu:"الاتحاد الأوروبي",
      },
    },

    en: {
      pageTitle: "Sanctions Lists",
      pageSubtitle: "OFAC · UN · EU · UK · Interpol · World Bank",
      recordsLabel: "records",

      // ── Source labels ───────────────────────────────────────
      sourceLabels: {
        ALL:        "All Lists",
        OFAC:       "OFAC",
        UN:         "UN",
        EU:         "EU",
        UK:         "UK",
        INTERPOL:   "Interpol",
        WORLD_BANK: "World Bank",
      },

      // ── Record type labels ─────────────────────────────────────
      typeLabels: {
        INDIVIDUAL: "INDIVIDUAL",
        ENTITY:     "ENTITY",
        VESSEL:     "VESSEL",
        AIRCRAFT:   "AIRCRAFT",
      },

      searchPlaceholder: "🔍 Search name, country...",
      resultsSuffix: "results · click row for details",

      tableHeaders: ["#","Name","Aliases","Type","Country","Source","DOB"],

      noResultsFound:     "No results found",
      noRecordsAvailable: "No records available",

      moreSuffix: "more",
      paginationOf: "of",
      dash: "—",

      // ── Detail popup ─────────────────────────────────────────
      detail: {
        aliasesTitle:  "Aliases / AKA",
        noAliases:     "No aliases",
        countryTitle:  "Country / Nationality",
        dobTitle:      "Date of Birth",
        programTitle:  "Program / Regime",
        idsTitle:      "IDs / Documents",
        moreLabel:     "more",
      },

      // ── Country code → English name ──────────────────────────
      countryNames: {
        af:"Afghanistan",al:"Albania",dz:"Algeria",ao:"Angola",ar:"Argentina",
        am:"Armenia",au:"Australia",at:"Austria",az:"Azerbaijan",bh:"Bahrain",
        by:"Belarus",be:"Belgium",bz:"Belize",bo:"Bolivia",ba:"Bosnia and Herzegovina",
        br:"Brazil",bg:"Bulgaria",kh:"Cambodia",cm:"Cameroon",ca:"Canada",
        cf:"Central African Republic",td:"Chad",cl:"Chile",cn:"China",co:"Colombia",
        cd:"Congo (DRC)",cr:"Costa Rica",hr:"Croatia",cu:"Cuba",cy:"Cyprus",
        cz:"Czech Republic",dk:"Denmark",do:"Dominican Republic",ec:"Ecuador",
        eg:"Egypt",sv:"El Salvador",et:"Ethiopia",fi:"Finland",fr:"France",
        ge:"Georgia",de:"Germany",gh:"Ghana",gr:"Greece",gt:"Guatemala",
        gn:"Guinea",ht:"Haiti",hn:"Honduras",hk:"Hong Kong",hu:"Hungary",
        in:"India",id:"Indonesia",ir:"Iran",iq:"Iraq",ie:"Ireland",il:"Israel",
        it:"Italy",jm:"Jamaica",jp:"Japan",jo:"Jordan",kz:"Kazakhstan",
        ke:"Kenya",kp:"North Korea",kr:"South Korea",kw:"Kuwait",kg:"Kyrgyzstan",
        lb:"Lebanon",ly:"Libya",lt:"Lithuania",lu:"Luxembourg",mk:"North Macedonia",
        my:"Malaysia",ml:"Mali",mx:"Mexico",md:"Moldova",mn:"Mongolia",
        me:"Montenegro",ma:"Morocco",mz:"Mozambique",mm:"Myanmar",np:"Nepal",
        nl:"Netherlands",nz:"New Zealand",ni:"Nicaragua",ne:"Niger",ng:"Nigeria",
        no:"Norway",om:"Oman",pk:"Pakistan",pa:"Panama",py:"Paraguay",pe:"Peru",
        ph:"Philippines",pl:"Poland",pt:"Portugal",qa:"Qatar",ro:"Romania",
        ru:"Russia",rw:"Rwanda",sa:"Saudi Arabia",sn:"Senegal",rs:"Serbia",
        sl:"Sierra Leone",so:"Somalia",za:"South Africa",ss:"South Sudan",
        es:"Spain",lk:"Sri Lanka",sd:"Sudan",se:"Sweden",ch:"Switzerland",
        sy:"Syria",tw:"Taiwan",tj:"Tajikistan",tz:"Tanzania",th:"Thailand",
        tn:"Tunisia",tr:"Turkey",tm:"Turkmenistan",ug:"Uganda",ua:"Ukraine",
        ae:"United Arab Emirates",gb:"United Kingdom",us:"United States",
        uy:"Uruguay",uz:"Uzbekistan",ve:"Venezuela",vn:"Vietnam",ye:"Yemen",
        zm:"Zambia",zw:"Zimbabwe",un:"United Nations",eu:"European Union",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  LOCAL SANCTIONS LIST PAGE
  // ─────────────────────────────────────────────────────────────────────────
  localSanction : {
    ar: {
      // --- Page header ---
      pagetitle        : "العقوبات المحلية",
      pageSubtitle     : "إدارة سجلات العقوبات المحلية",
      recordsCount     : "سجل",
      addSanction      : "إضافة عقوبة",

      // --- Excel upload ---
      excelImport      : "استيراد ملف Excel",
      chooseExcelFile  : "اختر ملف Excel (.xlsx, .xls)",
      underUpload      : "جاري الرفع...",
      upload           : "رفع الملف",

      // --- Toolbar ---
      recordsTitle     : "السجلات",
      typeFilter       : [
        { val:"ALL",    label:"الكل" },
        { val:"PERSON", label:"أشخاص" },
        { val:"ENTITY", label:"كيانات" },
      ],
      searchPlaceholder: "بحث...",
      reindex          : "إعادة الفهرسة",

      // --- Table headers ---
      person_headers   : ["#","الاسم","النوع","اسم الأم","الجنسية","تاريخ الميلاد","رقم الهوية / الجواز","جهة الإصدار","الحالة","إجراءات"],
      entity_headers   : ["#","الاسم","النوع","نوع الكيان","السجل التجاري","جهة الإصدار","الحالة","إجراءات"],

      // --- Empty states ---
      noResults        : "لا توجد نتائج",
      noRecords        : "لا توجد عقوبات",

      // --- Badges ---
      typePerson       : "شخص",
      typeEntity       : "كيان",
      statusActive     : "فعّال",
      statusInactive   : "معطّل",

      // --- Shared actions ---
      edit             : "تعديل",
      delete           : "حذف",
      cancel           : "إلغاء",
      underProccess    : "جاري المعالجة...",

      // --- Pagination ---
      paginationOf     : "من",

      // --- View modal (InfoRow labels) ---
      motherName       : "اسم الأم",
      nationality      : "الجنسية",
      dateOfBirth      : "تاريخ الميلاد",
      idNumber         : "رقم الهوية / الجواز",
      issuingAuthority : "جهة الإصدار",
      additionalInfo   : "معلومات إضافية",
      aliases          : "الأسماء المستعارة",
      entityType       : "نوع الكيان",
      commercialRegNo  : "السجل التجاري",
      note             : "ملاحظات",
      createdAt        : "أُضيف في",

      // --- Form modal ---
      editSanction     : "تعديل عقوبة",
      addNewSanction   : "إضافة عقوبة جديدة",

      // --- Delete confirmation ---
      deleteRecordTitle: "حذف السجل",
      confirmDelete    : "هل أنت متأكد من حذف",
      confirmQuestion  : "؟",
      noRollback       : "لا يمكن التراجع عن هذا الإجراء.",

      // --- Reindex confirmation ---
      reindexTitle     : "إعادة فهرسة العقوبات المحلية",
      reindexMessage   : "سيؤدي هذا إلى إعادة بناء فهرس Elasticsearch لجميع سجلات العقوبات المحلية. قد تستغرق العملية بضع ثوانٍ.",
    },

    en: {
      // --- Page header ---
      pagetitle        : "Local Sanctions",
      pageSubtitle     : "Manage local sanction records",
      recordsCount     : "records",
      addSanction      : "Add Sanction",

      // --- Excel upload ---
      excelImport      : "Import Excel",
      chooseExcelFile  : "Choose Excel file (.xlsx, .xls)",
      underUpload      : "Uploading...",
      upload           : "Upload",

      // --- Toolbar ---
      recordsTitle     : "Records",
      typeFilter       : [
        { val:"ALL",    label:"All" },
        { val:"PERSON", label:"Persons" },
        { val:"ENTITY", label:"Entities" },
      ],
      searchPlaceholder: "Search...",
      reindex          : "Reindex",

      // --- Table headers ---
      person_headers   : ["#","Name","Type","Mother Name","Nationality","Date of Birth","ID / Passport","Issuing Authority","Status","Actions"],
      entity_headers   : ["#","Name","Type","Entity Type","Commercial Reg.","Issuing Authority","Status","Actions"],

      // --- Empty states ---
      noResults        : "No results found",
      noRecords        : "No sanctions found",

      // --- Badges ---
      typePerson       : "PERSON",
      typeEntity       : "ENTITY",
      statusActive     : "Active",
      statusInactive   : "Inactive",

      // --- Shared actions ---
      edit             : "Edit",
      delete           : "Delete",
      cancel           : "Cancel",
      underProccess    : "Processing...",

      // --- Pagination ---
      paginationOf     : "of",

      // --- View modal (InfoRow labels) ---
      motherName       : "Mother Name",
      nationality      : "Nationality",
      dateOfBirth      : "Date of Birth",
      idNumber         : "ID / Passport",
      issuingAuthority : "Issuing Authority",
      additionalInfo   : "Additional Info",
      aliases          : "Aliases",
      entityType       : "Entity Type",
      commercialRegNo  : "Commercial Reg.",
      note             : "Notes",
      createdAt        : "Created At",

      // --- Form modal ---
      editSanction     : "Edit Sanction",
      addNewSanction   : "Add New Sanction",

      // --- Delete confirmation ---
      deleteRecordTitle: "Delete Record",
      confirmDelete    : "Are you sure you want to delete",
      confirmQuestion  : "?",
      noRollback       : "This action cannot be undone.",

      // --- Reindex confirmation ---
      reindexTitle     : "Reindex Local Sanctions",
      reindexMessage   : "This will rebuild the Elasticsearch index for all local sanction records. The process may take a few seconds.",
    }
  },

// ─────────────────────────────────────────────────────────────────────────
//  COMPANY PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────
comapnyProfile: {
  en: {
    page: "Company Policy",
    badge: "Screening thresholds, block rules and branches for your institution",
    save: "Save changes",
    saved: "Saved",
    saving: "Saving…",
    genericError: "Something went wrong. Try again.",

    thresholdTitle: "Match sensitivity",
    thresholdDesc: "How close a name must be to a sanctions record before it counts as a match. Lower catches more, raises false positives; higher is stricter.",
    thresholdCurrent: "Current threshold",
    thresholdRange: "Allowed range",
    thresholdDefault: "Default",
    thresholdLooser: "Catches more (looser)",
    thresholdStricter: "Fewer, closer matches (stricter)",

    blockTitle: "Block rules",
    blockDesc: "Countries and nationalities your bank refuses regardless of sanctions status. A blocked hit opens a high-priority case. To change a type or value, delete the rule and add a new one.",
    blockType: "Rule type",
    blockCountry: "Country",
    blockNationality: "Nationality",
    blockValue: "Value",
    blockValuePlaceholder: "e.g. Syria  /  SY",
    blockMessage: "Message shown on block",
    blockMessagePlaceholder: "e.g. Country prohibited by bank policy",
    blockAdd: "Add rule",
    blockSearch: "Filter rules…",
    blockEmpty: "No block rules yet. Add one above.",
    blockActive: "Active",
    blockInactive: "Off",
    blockDeleteConfirm: "Delete this rule? This cannot be undone.",
    colType: "Type",
    colValue: "Value",
    colMessage: "Message",
    colStatus: "Status",
    colActions: "",

    editTitle: "Edit rule",
    editActiveLabel: "Rule active",
    editHint: "Type and value can't be edited. To change them, delete this rule and add a new one.",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",

    branchTitle: "Branches",
    branchDesc: "Your bank's branches. Staff bound to a branch (branch managers, officers, tellers) are assigned to one of these when created.",
    branchName: "Branch name",
    branchNamePlaceholder: "e.g. Damascus Main",
    branchCode: "Code",
    branchCodePlaceholder: "e.g. DAM",
    branchAdd: "Add branch",
    branchEmpty: "No branches yet. Add your first one above.",
    branchColName: "Name",
    branchColCode: "Code",
    branchColStatus: "Status",
    branchDeactivateConfirm: "Deactivate this branch? Staff and cases stay linked, but it won't be selectable for new users.",
    branchActive: "Active",
    branchInactive: "Inactive",
    branchDeactivate: "Deactivate",
  },
  ar: {
    page: "سياسة المؤسسة",
    badge: "عتبات الفحص وقواعد الحظر والفروع الخاصة بمؤسستك",
    save: "حفظ التغييرات",
    saved: "تم الحفظ",
    saving: "جارٍ الحفظ…",
    genericError: "حدث خطأ غير متوقع. يرجى المحاولة مجدداً.",

    thresholdTitle: "حساسية المطابقة",
    thresholdDesc: "تحدد مدى قرب الاسم من سجل العقوبات لاعتباره تطابقاً. القيمة المنخفضة تُوسّع نطاق الرصد وتزيد التنبيهات الوهمية؛ والقيمة المرتفعة تضيّق النطاق وتُعطي نتائج أدق.",
    thresholdCurrent: "العتبة الحالية",
    thresholdRange: "النطاق المسموح",
    thresholdDefault: "الافتراضي",
    thresholdLooser: "نطاق أوسع (أقل تقييداً)",
    thresholdStricter: "نطاق أضيق (أكثر دقة)",

    blockTitle: "قواعد الحظر",
    blockDesc: "الدول والجنسيات التي يرفضها البنك بصرف النظر عن وضعها على قوائم العقوبات. أي تطابق محظور يُفتح تلقائياً كقضية ذات أولوية قصوى. لتغيير النوع أو القيمة، احذف القاعدة وأنشئ قاعدة جديدة.",
    blockType: "نوع القاعدة",
    blockCountry: "دولة",
    blockNationality: "جنسية",
    blockValue: "القيمة",
    blockValuePlaceholder: "مثال: سوريا  /  SY",
    blockMessage: "الرسالة عند الحظر",
    blockMessagePlaceholder: "مثال: دولة محظورة بموجب سياسة البنك",
    blockAdd: "إضافة قاعدة",
    blockSearch: "تصفية القواعد…",
    blockEmpty: "لا توجد قواعد حظر بعد. أضف قاعدة أعلاه.",
    blockActive: "مفعّلة",
    blockInactive: "معطّلة",
    blockDeleteConfirm: "هل تريد حذف هذه القاعدة؟ لا يمكن التراجع عن هذا الإجراء.",
    colType: "النوع",
    colValue: "القيمة",
    colMessage: "الرسالة",
    colStatus: "الحالة",
    colActions: "",

    editTitle: "تعديل القاعدة",
    editActiveLabel: "القاعدة مفعّلة",
    editHint: "لا يمكن تعديل النوع أو القيمة. لتغييرهما، احذف القاعدة وأنشئ قاعدة جديدة.",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",

    branchTitle: "الفروع",
    branchDesc: "فروع البنك. يُعيَّن الموظفون المرتبطون بفرع (مدراء الفروع، الموظفون، الصرافون) إلى أحد هذه الفروع عند إنشاء حساباتهم.",
    branchName: "اسم الفرع",
    branchNamePlaceholder: "مثال: دمشق الرئيسي",
    branchCode: "الرمز",
    branchCodePlaceholder: "مثال: DAM",
    branchAdd: "إضافة فرع",
    branchEmpty: "لا توجد فروع بعد. أضف أول فرع أعلاه.",
    branchColName: "الاسم",
    branchColCode: "الرمز",
    branchColStatus: "الحالة",
    branchDeactivateConfirm: "هل تريد تعطيل هذا الفرع؟ سيبقى الموظفون والقضايا مرتبطين به، لكنه لن يكون متاحاً للمستخدمين الجدد.",
    branchActive: "نشط",
    branchInactive: "معطّل",
    branchDeactivate: "تعطيل",
  },
}

};