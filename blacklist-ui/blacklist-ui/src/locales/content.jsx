import {
  LayoutDashboard, Bell, Scale,
  Search, ShieldAlert, AlertTriangle, CheckCircle, Zap,
  TrendingUp, Globe, Clock, XCircle, Eye, FileText, ChevronRight,
  BarChart2, RefreshCw, Radar, ArrowLeftRight, LogOut, User, Users, ClipboardList,
  X, Briefcase, Key, Building2, Shield, Webhook, Activity, Database
} from "lucide-react";

const C_ICON = {
  cyan:   "#00d4ff",
  purple: "#8b5cf6",
  green:  "#10b981",
  orange: "#f59e0b",
  red:    "#ef4444",
};

export const staticContent = {

  sideBar: {
    ar: {
      menuItem: [
        { to: "/dashboard",  label: "لوحة التحكم",       icon: LayoutDashboard, roles: null },
        { to: "/screen",     label: "فحص المخاطر",       icon: Radar,           roles: null },
        { to: "/search",     label: "البحث",              icon: Search,          roles: null },
        { to: "/transfer",   label: "فحص التحويلات",      icon: ArrowLeftRight,  roles: null },
        { to: "/cases",      label: "إدارة الحالات",      icon: Briefcase,       roles: null },
        { to: "/local",      label: "العقوبات المحلية",   icon: Database,        roles: ["SUPER_ADMIN"] },
        { to: "/webhooks",   label: "خطافات الويب",       icon: Webhook,         roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/list",       label: "العقوبات الدولية",   icon: Globe,           roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/audit",      label: "سجل التدقيق",        icon: ClipboardList,   roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/users",      label: "إدارة المستخدمين",   icon: Users,           roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/monitoring", label: "المراقبة",            icon: Activity,        roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/api-keys",   label: "مفاتيح API",          icon: Key,             roles: ["SUPER_ADMIN"] },
        { to: "/companies",  label: "إدارة الشركات",       icon: Building2,       roles: ["SUPER_ADMIN"] },
      ],
      logout: "تسجيل الخروج",
    },
    en: {
      menuItem: [
        { to: "/dashboard",  label: "Dashboard",        icon: LayoutDashboard, roles: null },
        { to: "/screen",     label: "Risk Screening",   icon: Radar,           roles: null },
        { to: "/search",     label: "Search",           icon: Search,          roles: null },
        { to: "/transfer",   label: "Transfer Scan",    icon: ArrowLeftRight,  roles: null },
        { to: "/cases",      label: "Case Management",  icon: Briefcase,       roles: null },
        { to: "/local",      label: "Local Sanctions",  icon: Database,        roles: ["SUPER_ADMIN"] },
        { to: "/webhooks",   label: "Webhooks",         icon: Webhook,         roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/list",       label: "Global Sanctions", icon: Globe,           roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/audit",      label: "Audit Trail",      icon: ClipboardList,   roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/users",      label: "User Management",  icon: Users,           roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/monitoring", label: "Monitoring",       icon: Activity,        roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
        { to: "/api-keys",   label: "API Keys",         icon: Key,             roles: ["SUPER_ADMIN"] },
        { to: "/companies",  label: "Companies",        icon: Building2,       roles: ["SUPER_ADMIN"] },
      ],
      logout: "Logout",
    },
  },

  dashboard: {

    ar: {
      // ── Header ──────────────────────────────────────────────
      page:  "لوحة التحكم",
      badge: "نظرة عامة على المخاطر والامتثال",
      live:  "مباشر",

      // ── Tabs ────────────────────────────────────────────────
      tabs: [
        { id: "overview",   label: "نظرة عامة", icon: LayoutDashboard },
        { id: "monitoring", label: "المراقبة",   icon: Bell            },
        { id: "decisions",  label: "القرارات",   icon: Scale           },
      ],

      // ── Overview ────────────────────────────────────────────
      riskDistribution:     "توزيع المخاطر",
      dataAnalayizeBadge:   "الاتجاهات الشهرية",
      dataAnalayizeTitle:   "آخر 6 أشهر",
      dataAnalayizeBadges:  [{ c: "#00d4ff", l: "عمليات البحث" }, { c: "#ef4444", l: "المطابقات" }],
      sourceTitle:          "أهم المصادر",
      historyTitle:         "آخر عمليات البحث",
      records:              "السجلات",
      recentTableLabels:    ["", "الاسم", "بواسطة", "المخاطر", "المصدر", "الوقت"],
      noData:               "لا توجد بيانات بعد",
      noRecentActivity:     "لا توجد نشاطات حديثة",

      // ── Rate Limit widget ───────────────────────────────────
      rateLimitTitle:       "استخدام API اليوم",
      rateLimitResets:      "إعادة الضبط:",
      rateLimitWarning:     "اقتراب من الحد اليومي — تواصل مع المسؤول للترقية",

      // ── Monitoring tab ──────────────────────────────────────
      monitoringStats: [
        { title: "الحالات المفتوحة",  Icon: Eye,           color: "#00d4ff", delay: "0s"   },
        { title: "متصاعدة",           Icon: AlertTriangle, color: "#ef4444", delay: ".06s" },
        { title: "قيد المراجعة",      Icon: Search,        color: "#f59e0b", delay: ".12s" },
        { title: "مغلقة",             Icon: CheckCircle,   color: "#10b981", delay: ".18s" },
        { title: "حرجة",              Icon: XCircle,       color: "#ef4444", delay: ".24s" },
        { title: "متأخرة",            Icon: Clock,         color: "#f97316", delay: ".30s" },
      ],
      caseBreakdownTitle:   "تفاصيل الحالات",
      totalCasesLabel:      "إجمالي الحالات",
      noCaseStats:          "لا توجد بيانات للحالات",

      // ── Decisions tab ───────────────────────────────────────
      decisionStats: [
        { title: "مطابقات حقيقية",    Icon: XCircle,     color: "#ef4444", delay: "0s"   },
        { title: "إيجابيات كاذبة",    Icon: CheckCircle, color: "#10b981", delay: ".06s" },
        { title: "بانتظار المراجعة",  Icon: Clock,       color: "#f59e0b", delay: ".12s" },
        { title: "تم قبول المخاطرة",  Icon: Shield,      color: "#00d4ff", delay: ".18s" },
        { title: "الإجمالي",          Icon: FileText,    color: "#8b5cf6", delay: ".24s" },
      ],
      auditTrailTitle:      "سجل التدقيق",
      auditRefresh:         "تحديث",
      auditTableHeaders:    ["القرار", "بواسطة", "النوع", "المرجع", "التعليق", "التاريخ"],
      noDecisions:          "لم يتم تسجيل أي قرارات بعد",
      noComment:            "لا يوجد تعليق",

      // ── Risk / Decision config ───────────────────────────────
      riskMeta: {
        CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   label: "حرجة"          },
        HIGH:     { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)",  label: "عالية"         },
        MEDIUM:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  label: "متوسطة"        },
        LOW:      { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)",  label: "منخفضة"        },
        VERY_LOW: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  label: "منخفضة جداً"   },
      },
      decisionCFG: {
        TRUE_MATCH:     { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: <XCircle size={11}/>,       label: "مطابقة حقيقية"      },
        FALSE_POSITIVE: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <CheckCircle size={11}/>,   label: "إيجابي كاذب"        },
        PENDING_REVIEW: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <Clock size={11}/>,         label: "بانتظار المراجعة"   },
        RISK_ACCEPTED:  { color: "#00d4ff", bg: "rgba(0,212,255,0.12)",  icon: <AlertTriangle size={11}/>, label: "تم قبول المخاطرة"   },
      },
    },

    en: {
      // ── Header ──────────────────────────────────────────────
      page:  "Dashboard",
      badge: "Risk & Compliance Overview",
      live:  "LIVE",

      // ── Tabs ────────────────────────────────────────────────
      tabs: [
        { id: "overview",   label: "Overview",   icon: LayoutDashboard },
        { id: "monitoring", label: "Monitoring", icon: Bell            },
        { id: "decisions",  label: "Decisions",  icon: Scale           },
      ],

      // ── Overview ────────────────────────────────────────────
      riskDistribution:     "Risk Distribution",
      dataAnalayizeBadge:   "Monthly Trends",
      dataAnalayizeTitle:   "last 6 months",
      dataAnalayizeBadges:  [{ c: "#00d4ff", l: "Searches" }, { c: "#ef4444", l: "Matches" }],
      sourceTitle:          "Top Sources",
      historyTitle:         "Recent Activity",
      records:              "records",
      recentTableLabels:    ["", "NAME", "BY", "RISK", "SOURCE", "TIME"],
      noData:               "No data yet",
      noRecentActivity:     "No recent activity",

      // ── Rate Limit widget ───────────────────────────────────
      rateLimitTitle:       "API Usage Today",
      rateLimitResets:      "Resets:",
      rateLimitWarning:     "Approaching daily limit — contact your administrator to upgrade",

      // ── Monitoring tab ──────────────────────────────────────
      monitoringStats: [
        { title: "Open Cases",  Icon: Eye,           color: "#00d4ff", delay: "0s"   },
        { title: "Escalated",   Icon: AlertTriangle, color: "#ef4444", delay: ".06s" },
        { title: "In Review",   Icon: Search,        color: "#f59e0b", delay: ".12s" },
        { title: "Closed",      Icon: CheckCircle,   color: "#10b981", delay: ".18s" },
        { title: "Critical",    Icon: XCircle,       color: "#ef4444", delay: ".24s" },
        { title: "Overdue",     Icon: Clock,         color: "#f97316", delay: ".30s" },
      ],
      caseBreakdownTitle:   "Case Breakdown",
      totalCasesLabel:      "Total Cases",
      noCaseStats:          "No case data available",

      // ── Decisions tab ───────────────────────────────────────
      decisionStats: [
        { title: "True Matches",    Icon: XCircle,     color: "#ef4444", delay: "0s"   },
        { title: "False Positives", Icon: CheckCircle, color: "#10b981", delay: ".06s" },
        { title: "Pending Review",  Icon: Clock,       color: "#f59e0b", delay: ".12s" },
        { title: "Risk Accepted",   Icon: Shield,      color: "#00d4ff", delay: ".18s" },
        { title: "Total",           Icon: FileText,    color: "#8b5cf6", delay: ".24s" },
      ],
      auditTrailTitle:      "Audit Trail",
      auditRefresh:         "Refresh",
      auditTableHeaders:    ["DECISION", "BY", "TYPE", "REF", "COMMENT", "DATE"],
      noDecisions:          "No decisions recorded yet",
      noComment:            "No comment",

      // ── Risk / Decision config ───────────────────────────────
      riskMeta: {
        CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   label: "Critical" },
        HIGH:     { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)",  label: "High"     },
        MEDIUM:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  label: "Medium"   },
        LOW:      { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)",  label: "Low"      },
        VERY_LOW: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  label: "Very Low" },
      },
      decisionCFG: {
        TRUE_MATCH:     { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: <XCircle size={11}/>,       label: "True Match"     },
        FALSE_POSITIVE: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <CheckCircle size={11}/>,   label: "False Positive" },
        PENDING_REVIEW: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <Clock size={11}/>,         label: "Pending Review" },
        RISK_ACCEPTED:  { color: "#00d4ff", bg: "rgba(0,212,255,0.12)",  icon: <AlertTriangle size={11}/>, label: "Risk Accepted"  },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  SCREENING PAGE
// ─────────────────────────────────────────────────────────────────────────────
staticContent.screening = {
  ar: {
    // ── Page header ────────────────────────────────────────────
    pageTitle:   "فحص المخاطر",
    pageSubtitle:"فحص مقابل قوائم العقوبات العالمية وقاعدة بيانات PEP",

    // ── Tabs ────────────────────────────────────────────────────
    tabs: [
      { id: "screen",  label: "تشغيل الفحص",   icon: Shield },
      { id: "history", label: "سجلي",           icon: Clock  },
    ],

    // ── Screening form ──────────────────────────────────────────
    fullNameLabel:      "الاسم الكامل (إنجليزي) *",
    fullNameArLabel:    "الاسم الكامل (عربي)",
    fullNamePlaceholder:"أدخل الاسم الكامل بالإنجليزية...",
    fullNameArPlaceholder:"الاسم الكامل بالعربي",
    nationalityLabel:   "الجنسية",
    dobLabel:           "تاريخ الميلاد",
    idTypeLabel:        "نوع الهوية",
    idNumberLabel:      "رقم الهوية",
    idNumberPlaceholder:"رقم الوثيقة...",
    selectPlaceholder:  "— اختر —",
    runScreeningBtn:    "تشغيل الفحص",
    processingBtn:      "جارٍ المعالجة...",
    screeningProgress:  "جارٍ الفحص...",

    // ── KYC toggle ──────────────────────────────────────────────
    kycHide:       "إخفاء",
    kycAdd:        "إضافة",
    kycDataLabel:  "بيانات KYC",
    kycImproves:   "— تحسّن دقة المطابقة",
    kycActive:     "نشط",
    kycTip:        "💡 بيانات KYC تحسّن الدقة:",
    kycIdBonus:    " تطابق الهوية +25 نقطة",
    kycDobBonus:   " تطابق تاريخ الميلاد +15 نقطة",
    kycNatBonus:   " الجنسية +10 نقاط",

    // ── Result header ───────────────────────────────────────────
    overallRiskLabel: "تقييم المخاطر الإجمالي",
    recordDecisionBtn:"تسجيل قرار",

    // ── Matches section ─────────────────────────────────────────
    matchesFoundTitle:"المطابقات المكتشفة",
    matchScoreLabel:  "نسبة التطابق",
    riskPointsLabel:  "نقاط الخطر",
    viewDetailsBtn:   "عرض التفاصيل",
    noMatchTitle:     "لا توجد مطابقات",
    noMatchSub:       "هذا الاسم غير مُدرج في أي قائمة",

    // ── Decisions ───────────────────────────────────────────────
    decisions: [
      { value: "TRUE_MATCH",     label: "مطابقة حقيقية",     color: C_ICON.red,    icon: <XCircle size={13}/>      },
      { value: "FALSE_POSITIVE", label: "إيجابي كاذب",       color: C_ICON.green,  icon: <CheckCircle size={13}/>  },
      { value: "PENDING_REVIEW", label: "بانتظار المراجعة",  color: C_ICON.orange, icon: <Clock size={13}/>        },
      { value: "RISK_ACCEPTED",  label: "تم قبول المخاطرة",  color: C_ICON.cyan,   icon: <AlertTriangle size={13}/> },
    ],
    decisionCFG: {
      TRUE_MATCH:     { color: C_ICON.red,    bg: "rgba(239,68,68,0.12)",  icon: <XCircle size={11}/>,       label: "مطابقة حقيقية"     },
      FALSE_POSITIVE: { color: C_ICON.green,  bg: "rgba(16,185,129,0.12)", icon: <CheckCircle size={11}/>,   label: "إيجابي كاذب"       },
      PENDING_REVIEW: { color: C_ICON.orange, bg: "rgba(245,158,11,0.12)", icon: <Clock size={11}/>,         label: "بانتظار المراجعة"  },
      RISK_ACCEPTED:  { color: C_ICON.cyan,   bg: "rgba(0,212,255,0.12)",  icon: <AlertTriangle size={11}/>, label: "تم قبول المخاطرة"  },
    },

    // ── Decision modal ──────────────────────────────────────────
    decisionModalTitle:      "تسجيل قرار",
    decisionModalSubtitle:   "نتيجة الفحص #",
    decisionCommentPlaceholder: "تعليق (اختياري)",
    decisionSelectError:     "اختر قراراً أولاً",
    decisionSaveError:       "فشل الحفظ — حاول مجدداً",
    decisionCancel:          "إلغاء",
    decisionSaving:          "جارٍ الحفظ...",
    decisionSave:            "حفظ",

    // ── Details modal ───────────────────────────────────────────
    detailsTitle:        "تفاصيل الكيان",
    detailsFetching:     "جارٍ جلب التفاصيل...",
    detailsPepTitle:     "شخصية سياسية بارزة (PEP)",
    detailsPepSource:    "المصدر: Wikidata — قاعدة بيانات الشخصيات العامة",
    detailsNoSanction:   "لا توجد تفاصيل عقوبات متاحة",
    detailsNone:         "لا توجد تفاصيل متاحة",
    detailsClose:        "إغلاق",
    detailsFields: {
      fullName:    "الاسم الكامل",
      aliases:     "الأسماء المستعارة",
      dob:         "تاريخ الميلاد",
      nationality: "الجنسية",
      program:     "البرنامج",
      remarks:     "ملاحظات",
      description: "الوصف",
      wikidataId:  "معرّف Wikidata",
    },

    // ── History tab ─────────────────────────────────────────────
    noHistory:         "لا يوجد سجل فحص بعد",
    noDecision:        "لا يوجد قرار",
    decisionHistory:   "سجل القرارات",
    noDecisionsRecord: "لم يتم تسجيل أي قرارات",
    hideBtn:           "إخفاء",
    historyBtn:        "السجل",
  },

  en: {
    // ── Page header ────────────────────────────────────────────
    pageTitle:   "Risk Screening",
    pageSubtitle:"Screen against global sanctions lists + PEP database",

    // ── Tabs ────────────────────────────────────────────────────
    tabs: [
      { id: "screen",  label: "Run Screening", icon: Shield },
      { id: "history", label: "My History",    icon: Clock  },
    ],

    // ── Screening form ──────────────────────────────────────────
    fullNameLabel:      "Full Name (English) *",
    fullNameArLabel:    "Full Name (Arabic)",
    fullNamePlaceholder:"Enter full name in English...",
    fullNameArPlaceholder:"الاسم الكامل بالعربي",
    nationalityLabel:   "Nationality",
    dobLabel:           "Date of Birth",
    idTypeLabel:        "ID Type",
    idNumberLabel:      "ID Number",
    idNumberPlaceholder:"Document number...",
    selectPlaceholder:  "— Select —",
    runScreeningBtn:    "Run Screening",
    processingBtn:      "Processing...",
    screeningProgress:  "Screening in progress...",

    // ── KYC toggle ──────────────────────────────────────────────
    kycHide:       "Hide",
    kycAdd:        "Add",
    kycDataLabel:  "KYC Data",
    kycImproves:   "— improves match confidence",
    kycActive:     "Active",
    kycTip:        "💡 KYC data improves accuracy:",
    kycIdBonus:    " ID match +25pts",
    kycDobBonus:   " DOB match +15pts",
    kycNatBonus:   " Nationality +10pts",

    // ── Result header ───────────────────────────────────────────
    overallRiskLabel: "Overall Risk Assessment",
    recordDecisionBtn:"Record Decision",

    // ── Matches section ─────────────────────────────────────────
    matchesFoundTitle:"Matches Found",
    matchScoreLabel:  "Match Score",
    riskPointsLabel:  "Risk Points",
    viewDetailsBtn:   "View Details",
    noMatchTitle:     "No Matches Found",
    noMatchSub:       "This name is clear",

    // ── Decisions ───────────────────────────────────────────────
    decisions: [
      { value: "TRUE_MATCH",     label: "True Match",     color: C_ICON.red,    icon: <XCircle size={13}/>      },
      { value: "FALSE_POSITIVE", label: "False Positive", color: C_ICON.green,  icon: <CheckCircle size={13}/>  },
      { value: "PENDING_REVIEW", label: "Pending Review", color: C_ICON.orange, icon: <Clock size={13}/>        },
      { value: "RISK_ACCEPTED",  label: "Risk Accepted",  color: C_ICON.cyan,   icon: <AlertTriangle size={13}/> },
    ],
    decisionCFG: {
      TRUE_MATCH:     { color: C_ICON.red,    bg: "rgba(239,68,68,0.12)",  icon: <XCircle size={11}/>,       label: "True Match"     },
      FALSE_POSITIVE: { color: C_ICON.green,  bg: "rgba(16,185,129,0.12)", icon: <CheckCircle size={11}/>,   label: "False Positive" },
      PENDING_REVIEW: { color: C_ICON.orange, bg: "rgba(245,158,11,0.12)", icon: <Clock size={11}/>,         label: "Pending Review" },
      RISK_ACCEPTED:  { color: C_ICON.cyan,   bg: "rgba(0,212,255,0.12)",  icon: <AlertTriangle size={11}/>, label: "Risk Accepted"  },
    },

    // ── Decision modal ──────────────────────────────────────────
    decisionModalTitle:         "Record Decision",
    decisionModalSubtitle:      "Screening Result #",
    decisionCommentPlaceholder: "Comment (optional)",
    decisionSelectError:        "Select a decision first",
    decisionSaveError:          "Failed to save — try again",
    decisionCancel:             "Cancel",
    decisionSaving:             "Saving...",
    decisionSave:               "Save",

    // ── Details modal ───────────────────────────────────────────
    detailsTitle:        "Entity Details",
    detailsFetching:     "Fetching details...",
    detailsPepTitle:     "Politically Exposed Person (PEP)",
    detailsPepSource:    "Source: Wikidata — Public figure database",
    detailsNoSanction:   "No sanction details available",
    detailsNone:         "No details available",
    detailsClose:        "Close",
    detailsFields: {
      fullName:    "Full Name",
      aliases:     "Aliases",
      dob:         "Date of Birth",
      nationality: "Nationality",
      program:     "Program",
      remarks:     "Remarks",
      description: "Description",
      wikidataId:  "Wikidata ID",
    },

    // ── History tab ─────────────────────────────────────────────
    noHistory:         "No screening history yet",
    noDecision:        "No Decision",
    decisionHistory:   "Decision History",
    noDecisionsRecord: "No decisions recorded",
    hideBtn:           "Hide",
    historyBtn:        "History",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  SANCTIONS SEARCH PAGE
// ─────────────────────────────────────────────────────────────────────────────
staticContent.search = {
  ar: {
    // ── Header ──────────────────────────────────────────────────
    pageTitle:    "بحث العقوبات",
    pageSubtitle: "OFAC · EU · UN · UK · محلي",

    // ── Search box ───────────────────────────────────────────────
    searchPlaceholder: "أدخل اسماً للبحث...",
    searchBtn:         "🔍 بحث",
    searchingBtn:      "جارٍ البحث...",

    // ── Loading ──────────────────────────────────────────────────
    loadingText: "جارٍ البحث في قواعد بيانات العقوبات...",

    // ── No results ───────────────────────────────────────────────
    noResultsTitle: "لم يتم العثور على سجلات مطابقة",
    noResultsSub:   "جرب اسماً مختلفاً أو تهجئة أخرى",

    // ── Score card labels ────────────────────────────────────────
    scoreLabels: [
      { key: "score",           label: "التطابق"        },
      { key: "nameSimilarity",  label: "الاسم"           },
      { key: "aliasSimilarity", label: "الاسم المستعار" },
    ],

    // ── Buttons ──────────────────────────────────────────────────
    viewDetailsBtn: "عرض التفاصيل ←",
    closeBtn:       "✕ إغلاق",

    // ── Modal ────────────────────────────────────────────────────
    modalTitle: "تفاصيل الكيان",
    detailFields: [
      { key: "name",        label: "الاسم الكامل"       },
      { key: "aliases",     label: "الأسماء المستعارة"  },
      { key: "dateOfBirth", label: "تاريخ الميلاد"      },
      { key: "nationality", label: "الجنسية"             },
      { key: "program",     label: "البرنامج"            },
      { key: "remarks",     label: "ملاحظات"             },
    ],

    // ── Errors ───────────────────────────────────────────────────
    searchError: "فشل البحث",
  },

  en: {
    // ── Header ──────────────────────────────────────────────────
    pageTitle:    "Sanctions Search",
    pageSubtitle: "OFAC · EU · UN · UK · Local",

    // ── Search box ───────────────────────────────────────────────
    searchPlaceholder: "Enter name to search...",
    searchBtn:         "🔍 Search",
    searchingBtn:      "Searching...",

    // ── Loading ──────────────────────────────────────────────────
    loadingText: "Searching sanctions databases...",

    // ── No results ───────────────────────────────────────────────
    noResultsTitle: "No Matching Records Found",
    noResultsSub:   "Try a different name or spelling",

    // ── Score card labels ────────────────────────────────────────
    scoreLabels: [
      { key: "score",           label: "Match" },
      { key: "nameSimilarity",  label: "Name"  },
      { key: "aliasSimilarity", label: "Alias" },
    ],

    // ── Buttons ──────────────────────────────────────────────────
    viewDetailsBtn: "View Details →",
    closeBtn:       "✕ Close",

    // ── Modal ────────────────────────────────────────────────────
    modalTitle: "Entity Details",
    detailFields: [
      { key: "name",        label: "Full Name"    },
      { key: "aliases",     label: "Aliases"      },
      { key: "dateOfBirth", label: "Date of Birth"},
      { key: "nationality", label: "Nationality"  },
      { key: "program",     label: "Program"      },
      { key: "remarks",     label: "Remarks"      },
    ],

    // ── Errors ───────────────────────────────────────────────────
    searchError: "Search failed",
  },
};

export const getDynamicContent = (data, lang) => {
  const {
    stats        = {},
    rateLimit    = null,
    monthlyData  = [],
    recentActivity = [],
    caseStats    = null,
    decStats     = null,
  } = data;

  const total = stats.totalSearches || 0;

  const content = {
    ar: {
      // ── Overview stat cards ──────────────────────────────────
      overViewBoxes: [
        { title: "إجمالي عمليات البحث", value: stats.totalSearches ?? 0, sub: `+${stats.todaySearches || 0} اليوم`,       Icon: Search,      color: "#00d4ff", delay: "0s"   },
        { title: "المطابقات الإيجابية", value: stats.positiveMatches ?? 0, sub: `${total ? ((stats.positiveMatches / total) * 100).toFixed(1) : 0}% معدل`, Icon: ShieldAlert, color: "#8b5cf6", delay: ".05s" },
        { title: "حالات حرجة",          value: stats.criticalRisk ?? 0,   sub: "إجراء فوري",                               Icon: XCircle,     color: "#ef4444", delay: ".1s"  },
        { title: "مخاطر عالية",         value: stats.highRisk ?? 0,        sub: "تتطلب مراجعة",                             Icon: AlertTriangle,color: "#f97316", delay: ".15s" },
        { title: "مخاطر متوسطة",        value: stats.mediumRisk ?? 0,      sub: "قيد المراقبة",                             Icon: Zap,         color: "#f59e0b", delay: ".2s"  },
        { title: "منخفضة / سليمة",      value: stats.lowRisk ?? 0,         sub: "تمت الموافقة",                             Icon: CheckCircle, color: "#10b981", delay: ".25s" },
      ],

      // ── Risk distribution progress bar ───────────────────────
      progressBar: [
        { label: "حرجة",   color: "#ef4444", val: stats.criticalRisk ?? 0 },
        { label: "عالية",  color: "#f97316", val: stats.highRisk ?? 0     },
        { label: "متوسطة", color: "#f59e0b", val: stats.mediumRisk ?? 0   },
        { label: "منخفضة", color: "#60a5fa", val: stats.lowRisk ?? 0      },
        { label: "سليمة",  color: "#10b981", val: total - (stats.positiveMatches ?? 0) },
      ],

      // ── Rate limit dynamic labels ────────────────────────────
      rateLimitUsed:      rateLimit ? `${rateLimit.usagePercent}% مُستخدم` : "",
      rateLimitRemaining: rateLimit ? `${rateLimit.remaining?.toLocaleString()} متبقٍ` : "",

      // ── Monitoring case breakdown rows ───────────────────────
      caseBreakdownRows: caseStats ? [
        { label: "مفتوحة",      value: caseStats.open,      total: caseStats.total, color: "#00d4ff" },
        { label: "متصاعدة",     value: caseStats.escalated, total: caseStats.total, color: "#ef4444" },
        { label: "قيد المراجعة",value: caseStats.inReview,  total: caseStats.total, color: "#f59e0b" },
        { label: "مغلقة",       value: caseStats.closed,    total: caseStats.total, color: "#10b981" },
        { label: "متأخرة",      value: caseStats.overdue,   total: caseStats.total, color: "#f97316" },
      ] : [],

      // ── Monitoring stat card values (live data) ──────────────
      monitoringValues: caseStats ? [
        caseStats.open,
        caseStats.escalated,
        caseStats.inReview,
        caseStats.closed,
        caseStats.critical,
        caseStats.overdue,
      ] : ["—", "—", "—", "—", "—", "—"],

      // ── Decision stat card values (live data) ────────────────
      decisionValues: decStats ? [
        decStats.trueMatches,
        decStats.falsePositives,
        decStats.pendingReview,
        decStats.riskAccepted,
        decStats.total,
      ] : [0, 0, 0, 0, 0],
    },

    en: {
      // ── Overview stat cards ──────────────────────────────────
      overViewBoxes: [
        { title: "Total Searches",    value: stats.totalSearches ?? 0,   sub: `+${stats.todaySearches || 0} today`,                                                       Icon: Search,       color: "#00d4ff", delay: "0s"   },
        { title: "Positive Matches",  value: stats.positiveMatches ?? 0, sub: `${total ? ((stats.positiveMatches / total) * 100).toFixed(1) : 0}% rate`,                  Icon: ShieldAlert,  color: "#8b5cf6", delay: ".05s" },
        { title: "Critical",          value: stats.criticalRisk ?? 0,    sub: "Immediate action",                                                                          Icon: XCircle,      color: "#ef4444", delay: ".1s"  },
        { title: "High Risk",         value: stats.highRisk ?? 0,        sub: "Requires review",                                                                           Icon: AlertTriangle,color: "#f97316", delay: ".15s" },
        { title: "Medium Risk",       value: stats.mediumRisk ?? 0,      sub: "Under monitoring",                                                                          Icon: Zap,          color: "#f59e0b", delay: ".2s"  },
        { title: "Low / Clear",       value: stats.lowRisk ?? 0,         sub: "Approved",                                                                                  Icon: CheckCircle,  color: "#10b981", delay: ".25s" },
      ],

      // ── Risk distribution progress bar ───────────────────────
      progressBar: [
        { label: "Critical", color: "#ef4444", val: stats.criticalRisk ?? 0 },
        { label: "High",     color: "#f97316", val: stats.highRisk ?? 0     },
        { label: "Medium",   color: "#f59e0b", val: stats.mediumRisk ?? 0   },
        { label: "Low",      color: "#60a5fa", val: stats.lowRisk ?? 0      },
        { label: "Clear",    color: "#10b981", val: total - (stats.positiveMatches ?? 0) },
      ],

      // ── Rate limit dynamic labels ────────────────────────────
      rateLimitUsed:      rateLimit ? `${rateLimit.usagePercent}% used`      : "",
      rateLimitRemaining: rateLimit ? `${rateLimit.remaining?.toLocaleString()} remaining` : "",

      // ── Monitoring case breakdown rows ───────────────────────
      caseBreakdownRows: caseStats ? [
        { label: "Open",      value: caseStats.open,      total: caseStats.total, color: "#00d4ff" },
        { label: "Escalated", value: caseStats.escalated, total: caseStats.total, color: "#ef4444" },
        { label: "In Review", value: caseStats.inReview,  total: caseStats.total, color: "#f59e0b" },
        { label: "Closed",    value: caseStats.closed,    total: caseStats.total, color: "#10b981" },
        { label: "Overdue",   value: caseStats.overdue,   total: caseStats.total, color: "#f97316" },
      ] : [],

      // ── Monitoring stat card values (live data) ──────────────
      monitoringValues: caseStats ? [
        caseStats.open,
        caseStats.escalated,
        caseStats.inReview,
        caseStats.closed,
        caseStats.critical,
        caseStats.overdue,
      ] : ["—", "—", "—", "—", "—", "—"],

      // ── Decision stat card values (live data) ────────────────
      decisionValues: decStats ? [
        decStats.trueMatches,
        decStats.falsePositives,
        decStats.pendingReview,
        decStats.riskAccepted,
        decStats.total,
      ] : [0, 0, 0, 0, 0],
    },
  };

  return content[lang] || content["en"];
};