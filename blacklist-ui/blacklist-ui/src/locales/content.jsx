import {
  LayoutDashboard, Bell, Scale,
  Search, ShieldAlert, AlertTriangle, CheckCircle, Zap,
  TrendingUp, Globe, Clock, XCircle, Eye, FileText, ChevronRight,
  BarChart2, RefreshCw, Radar, ArrowLeftRight, LogOut, User, Users, ClipboardList,
  X, Briefcase, Key, Building2, Shield, Webhook, Activity, Database
} from "lucide-react";
const NavIcons = {
  Dashboard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Screen: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Search: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Transfer: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
      <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
      <path d="M7 12h10"/><path d="m14 9 3 3-3 3"/>
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Cases: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  ),
};
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
          { to: "/webhooks",   label: "الإشعارات الفورية",       icon: Webhook,         roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
          { to: "/list",       label: "العقوبات الدولية",   icon: Globe,           roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
          { to: "/audit",      label: "سجل التدقيق",        icon: ClipboardList,   roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
          { to: "/users",      label: "إدارة المستخدمين",   icon: Users,           roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
          { to: "/monitoring", label: "المراقبة",            icon: Activity,        roles: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
          { to: "/api-keys",   label: "مفاتيح API",          icon: Key,             roles: ["SUPER_ADMIN"] },
          { to: "/companies",  label: "إدارة الشركات",       icon: Building2,       roles: ["SUPER_ADMIN"] },
        ],
       NAV_ITEMS :[
          { path: "/dashboard", label: "الرئيسية", Icon: NavIcons.Dashboard },
          { path: "/screen",    label: "الشاشة",    Icon: NavIcons.Screen },
          { path: "/search",    label: "بحث",      Icon: NavIcons.Search },
          { path: "/transfer",  label: "تحويل",    Icon: NavIcons.Transfer },
          { path: "/cases",     label: "الحالات",   Icon: NavIcons.Cases },
          { path: "#menu",      label: "المزيد",    Icon: NavIcons.Menu },
        ],
      sections: [
          { label: "الأساسية", items: ["/dashboard", "/screen", "/search", "/transfer", "/cases"] },
          { label: "الإدارة", items: ["/local", "/webhooks", "/list", "/audit", "/users", "/monitoring"] },
          { label: "النظام", items: ["/api-keys", "/companies"] },
        ],
      rolesCfg : {
        SUPER_ADMIN:   { label:"مدير خارق",   color:"#f59e0b", iconColor:"#f59e0b", gradA:"rgba(245,158,11,0.18)", gradB:"rgba(239,68,68,0.12)",  border:"rgba(245,158,11,0.28)" },
        COMPANY_ADMIN: { label:"مدير شركة", color:"#00c4f0", iconColor:"#00c4f0", gradA:"rgba(0,196,240,0.15)",  gradB:"rgba(100,100,255,0.12)", border:"rgba(0,196,240,0.28)"  },
        ADMIN:         { label:"مدير",         color:"#00c4f0", iconColor:"#00c4f0", gradA:"rgba(0,196,240,0.15)",  gradB:"rgba(100,100,255,0.12)", border:"rgba(0,196,240,0.28)"  },
        SUBSCRIBER:    { label:"مشترك",    color:"#10b981", iconColor:"#10b981", gradA:"rgba(16,185,129,0.15)", gradB:"rgba(0,196,240,0.12)",   border:"rgba(16,185,129,0.28)" },
      },
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
      NAV_ITEMS : [
        { path:"/dashboard", label:"Dashboard", Icon:NavIcons.Dashboard },
        { path:"/screen",    label:"Screen",    Icon:NavIcons.Screen    },
        { path:"/search",    label:"Search",    Icon:NavIcons.Search    },
        { path:"/transfer",  label:"Transfer",  Icon:NavIcons.Transfer  },
        { path:"/cases",     label:"Cases",     Icon:NavIcons.Cases     },
        { path:"#menu",      label:"More",      Icon:NavIcons.Menu      },
      ],
      sections :  [
        { label:"Core",        items:["/dashboard","/screen","/search","/transfer","/cases"] },
        { label:"Admin",       items:["/local","/webhooks","/list","/audit","/users","/monitoring"] },
        { label:"System",      items:["/api-keys","/companies"] },
      ],
      rolesCfg : {
        SUPER_ADMIN:   { label:"SUPER ADMIN",   color:"#f59e0b", iconColor:"#f59e0b", gradA:"rgba(245,158,11,0.18)", gradB:"rgba(239,68,68,0.12)",  border:"rgba(245,158,11,0.28)" },
        COMPANY_ADMIN: { label:"COMPANY ADMIN", color:"#00c4f0", iconColor:"#00c4f0", gradA:"rgba(0,196,240,0.15)",  gradB:"rgba(100,100,255,0.12)", border:"rgba(0,196,240,0.28)"  },
        ADMIN:         { label:"ADMIN",         color:"#00c4f0", iconColor:"#00c4f0", gradA:"rgba(0,196,240,0.15)",  gradB:"rgba(100,100,255,0.12)", border:"rgba(0,196,240,0.28)"  },
        SUBSCRIBER:    { label:"SUBSCRIBER",    color:"#10b981", iconColor:"#10b981", gradA:"rgba(16,185,129,0.15)", gradB:"rgba(0,196,240,0.12)",   border:"rgba(16,185,129,0.28)" },
      },
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

  webhooksContent : {
    ar: {
      title: "Webhooks",
      newButton: "إنشاء Webhook جديد",
      tabs: {
        webhooks: "الروابط (Webhooks)",
        deliveries: "سجل التسليم"
      },
      emptyState: {
        webhooks: "لا يوجد Webhooks — أضف واحد الآن",
        deliveries: "لا يوجد deliveries بعد"
      },
      webhookCard: {
        active: "نشط",
        inactive: "غير نشط",
        failures: "فشل",
        lastTriggered: "آخر تفعيل:",
        logs: "السجلات",
        deleteConfirm: "هل أنت متأكد من حذف هذا الـ Webhook؟"
      },
      form: {
        title: "إضافة Webhook جديد",
        urlLabel: "رابط النهاية (Endpoint URL) *",
        urlPlaceholder: "https://your-server.com/webhook",
        eventTitle: "الأحداث المشتركة",
        secretLabel: "المفتاح السري (اختياري)",
        secretPlaceholder: "أدخل مفتاح التوقيع",
        createBtn: "إنشاء",
        cancelBtn: "إلغاء"
      },
      deliveryCard: {
        success: "ناجح",
        failed: "فاشل",
        attempt: "محاولة"
      },
      events: [
        { key: "SCREENING_HIGH", label: "فحص مخاطر عالية" },
        { key: "SCREENING_CRITICAL", label: "فحص مخاطر حرجة" },
        { key: "DECISION_CHANGED", label: "تغيير القرار" },
        { key: "TRANSFER_HIGH", label: "تحويل عالي/حرج المخاطر" },
    ],
    },
    
    en: {
      title: "Webhooks",
      newButton: "New Webhook",
      tabs: {
        webhooks: "Webhooks",
        deliveries: "Delivery Log"
      },
      emptyState: {
        webhooks: "No Webhooks — add one now",
        deliveries: "No deliveries yet"
      },
      webhookCard: {
        active: "Active",
        inactive: "Inactive",
        failures: "failures",
        lastTriggered: "Last triggered:",
        logs: "Logs",
        deleteConfirm: "Delete this Webhook?"
      },
      form: {
        title: "New Webhook",
        urlLabel: "Endpoint URL *",
        urlPlaceholder: "https://your-server.com/webhook",
        eventTitle: "Events",
        secretLabel: "Secret (Optional)",
        secretPlaceholder: "my-secret-key",
        createBtn: "Create",
        cancelBtn: "Cancel"
      },
      deliveryCard: {
        success: "Success",
        failed: "Failed",
        attempt: "Attempt"
      },
      events: [
        { key: "SCREENING_HIGH", label: "Screening HIGH" },
        { key: "SCREENING_CRITICAL", label: "Screening CRITICAL" },
        { key: "DECISION_CHANGED", label: "Decision Changed" },
        { key: "TRANSFER_HIGH", label: "Transfer HIGH/CRITICAL" },
    ],
    }
  }
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

// ─────────────────────────────────────────────────────────────────────────────
//  TRANSFER SCREENING PAGE
// ─────────────────────────────────────────────────────────────────────────────
staticContent.transfer = {
  ar: {
    pageTitle:    "فحص التحويلات",
    pageSubtitle: "فحص العقوبات في الوقت الفعلي",
    live:         "مباشر",

    // ── Stats ────────────────────────────────────────────────────
    statsLabels: [
      { key:"total",    label:"الإجمالي",  Icon: FileText,    color:"#00d4ff" },
      { key:"approved", label:"مقبولة",    Icon: CheckCircle, color:"#10b981" },
      { key:"reviewed", label:"مراجعة",    Icon: AlertTriangle, color:"#f59e0b" },
      { key:"blocked",  label:"محظورة",   Icon: XCircle,     color:"#ef4444" },
      { key:"today",    label:"اليوم",      Icon: Shield,      color:"#8b5cf6" },
    ],

    // ── Tabs ─────────────────────────────────────────────────────
    tabs: [
      { id:"screen",  label:"فحص",   Icon: Shield   },
      { id:"history", label:"السجل", Icon: FileText },
    ],

    // ── Action / Risk config ─────────────────────────────────────
    actionCFG: {
      APPROVE:{ color:"#10b981", bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.25)", label:"مقبول"  },
      REVIEW: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.25)", label:"مراجعة" },
      BLOCK:  { color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.25)",  label:"محظور"  },
    },

    // ── Decisions ────────────────────────────────────────────────
    decisions: [
      { value:"TRUE_MATCH",     label:"مطابقة حقيقية",    color:"#ef4444" },
      { value:"FALSE_POSITIVE", label:"إيجابي كاذب",      color:"#10b981" },
      { value:"PENDING_REVIEW", label:"بانتظار المراجعة", color:"#f59e0b" },
      { value:"RISK_ACCEPTED",  label:"تم قبول المخاطرة", color:"#00d4ff" },
    ],

    // ── Form fields ──────────────────────────────────────────────
    transferDetailsTitle: "تفاصيل التحويل",
    senderNameLabel:      "اسم المرسل *",
    senderNameArLabel:    "اسم المرسل (عربي)",
    receiverNameLabel:    "اسم المستفيد *",
    receiverNameArLabel:  "اسم المستفيد (عربي)",
    fullNamePlaceholder:  "الاسم الكامل بالإنجليزية",
    fullNameArPlaceholder:"الاسم بالعربية",
    amountLabel:          "المبلغ",
    ccyLabel:             "العملة",
    countryLabel:         "البلد (مخاطر FATF)",
    selectCountryPlaceholder: "— اختر الدولة —",
    selectPlaceholder:    "— اختر —",

    // ── KYC section ──────────────────────────────────────────────
    kycHide: "إخفاء", kycAdd: "إضافة", kycLabel: "KYC",
    kycActive: "نشط",
    nationalityLabel:  "الجنسية",
    motherNameLabel:   "اسم الأم",
    motherNamePlaceholder: "اسم الأم",
    dobLabel:          "تاريخ الميلاد",
    idTypeLabel:       "نوع الهوية",
    idNumberLabel:     "رقم الهوية",
    idNumberPlaceholder: "رقم الوثيقة",

    // ── Extra transfer details ──────────────────────────────────
    extraDetailsHide: "إخفاء", extraDetailsAdd: "إضافة",
    extraDetailsLabel: "تفاصيل إضافية للتحويل",
    cityLabel:           "المدينة",
    cityPlaceholder:     "مدينة الوجهة",
    amountUsdLabel:      "المبلغ بالدولار",
    amountUsdPlaceholder:"للتحقق من الحدود",
    transferPurposeLabel:"الغرض من التحويل",
    agentNameLabel:      "اسم الوكيل",
    agentNamePlaceholder:"الوكيل المستلم",
    externalRefLabel:    "المرجع الخارجي",
    externalRefPlaceholder: "مرجع نظام الصرافة",

    // ── Errors ───────────────────────────────────────────────────
    errRequiredNames:  "اسم المرسل والمستفيد مطلوبان",
    errForbidden:      "تم رفض الوصول (403)",
    errUnauthorized:   "غير مصرح — يرجى تسجيل الدخول مجدداً",
    errEmptyResponse:  "استجابة فارغة من الخادم",
    errGeneric:        "خطأ",

    // ── Buttons / states ─────────────────────────────────────────
    screeningBtn:    "جارٍ الفحص...",
    screenTransferBtn:"فحص التحويل",
    awaitingTitle:   "بانتظار التحويل",
    awaitingSub:     "أدخل التفاصيل واضغط فحص",
    screeningProgress:"جارٍ الفحص مقابل قوائم العقوبات...",
    refLabel:        "المرجع",
    recordDecisionBtn:"تسجيل قرار",
    riskLevelLabel:  "مستوى الخطر",
    riskPointsLabel: "نقاط الخطر",
    matchSingular:   "مطابقة",
    matchPlural:     "مطابقات",
    clickToView:     "— اضغط للعرض",
    newScreeningBtn: "فحص جديد",

    // ── History table ────────────────────────────────────────────
    historyTitle: "السجل",
    pageLabel:    "صفحة",
    historyHeaders: ["المرجع","المرسل","المستفيد","المبلغ","الإجراء","الخطر","بواسطة","التاريخ",""],
    noScreenings: "لا توجد عمليات فحص بعد",
    detailsBtn:   "التفاصيل",
    viewDetailsBtn: "عرض التفاصيل",
    prevBtn: "← السابق",
    nextBtn: "التالي →",

    // ── Detail modal ─────────────────────────────────────────────
    screeningDetailsTitle: "تفاصيل الفحص",
    decisionBtn: "قرار",
    detailFieldLabels: {
      sender:"المرسل", receiver:"المستفيد", amount:"المبلغ", country:"البلد",
      city:"المدينة", purpose:"الغرض", riskLevel:"مستوى الخطر", riskPoints:"نقاط الخطر",
      speed:"السرعة", screenedBy:"تم الفحص بواسطة", operator:"المُشغّل",
      externalRef:"المرجع الخارجي", agent:"الوكيل", amountUsd:"المبلغ بالدولار",
      senderNat:"جنسية المرسل", receiverNat:"جنسية المستفيد",
    },

    // ── Match detail modal ───────────────────────────────────────
    pepDetailsTitle:    "تفاصيل PEP",
    entityDetailsTitle: "تفاصيل الكيان",
    pepFullTitle:       "شخصية سياسية بارزة (PEP)",
    matchScoreLabel:    "نسبة التطابق",
    partyLabel:         "الجهة",
    noDetailsAvailable: "لا توجد تفاصيل متاحة",
    closeBtn:           "إغلاق",
    detailsFields: {
      fullName:"الاسم الكامل", aliases:"الأسماء المستعارة", dob:"تاريخ الميلاد",
      nationality:"الجنسية", program:"البرنامج", remarks:"ملاحظات",
      description:"الوصف", wikidataId:"معرّف Wikidata",
    },

    // ── Decision modal ───────────────────────────────────────────
    decisionModalTitle: "تسجيل قرار",
    transferRefLabel:   "تحويل #",
    decisionCommentPlaceholder: "تعليق (اختياري)",
    decisionSelectError: "اختر قراراً أولاً",
    decisionSaveError:   "فشل الحفظ — حاول مجدداً",
    decisionCancel: "إلغاء", decisionSaving: "جارٍ الحفظ...", decisionSave: "حفظ",
  },

  en: {
    pageTitle:    "Transfer Screening",
    pageSubtitle: "Real-time sanctions screening",
    live:         "LIVE",

    // ── Stats ────────────────────────────────────────────────────
    statsLabels: [
      { key:"total",    label:"Total",    Icon: FileText,    color:"#00d4ff" },
      { key:"approved", label:"Approved", Icon: CheckCircle, color:"#10b981" },
      { key:"reviewed", label:"Review",   Icon: AlertTriangle, color:"#f59e0b" },
      { key:"blocked",  label:"Blocked",  Icon: XCircle,     color:"#ef4444" },
      { key:"today",    label:"Today",    Icon: Shield,      color:"#8b5cf6" },
    ],

    // ── Tabs ─────────────────────────────────────────────────────
    tabs: [
      { id:"screen",  label:"Screen",  Icon: Shield   },
      { id:"history", label:"History", Icon: FileText },
    ],

    // ── Action / Risk config ─────────────────────────────────────
    actionCFG: {
      APPROVE:{ color:"#10b981", bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.25)", label:"APPROVED" },
      REVIEW: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.25)", label:"REVIEW"   },
      BLOCK:  { color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.25)",  label:"BLOCKED"  },
    },

    // ── Decisions ────────────────────────────────────────────────
    decisions: [
      { value:"TRUE_MATCH",     label:"True Match",     color:"#ef4444" },
      { value:"FALSE_POSITIVE", label:"False Positive", color:"#10b981" },
      { value:"PENDING_REVIEW", label:"Pending Review", color:"#f59e0b" },
      { value:"RISK_ACCEPTED",  label:"Risk Accepted",  color:"#00d4ff" },
    ],

    // ── Form fields ──────────────────────────────────────────────
    transferDetailsTitle: "Transfer Details",
    senderNameLabel:      "Sender Name *",
    senderNameArLabel:    "اسم المرسل (عربي)",
    receiverNameLabel:    "Receiver Name *",
    receiverNameArLabel:  "اسم المستفيد (عربي)",
    fullNamePlaceholder:  "Full name in English",
    fullNameArPlaceholder:"الاسم بالعربية",
    amountLabel:          "Amount",
    ccyLabel:             "CCY",
    countryLabel:         "Country (FATF Risk)",
    selectCountryPlaceholder: "— Select Country —",
    selectPlaceholder:    "— Select —",

    // ── KYC section ──────────────────────────────────────────────
    kycHide: "Hide", kycAdd: "Add", kycLabel: "KYC",
    kycActive: "Active",
    nationalityLabel:  "Nationality",
    motherNameLabel:   "Mother Name",
    motherNamePlaceholder: "Mother Name",
    dobLabel:          "Date of Birth",
    idTypeLabel:       "ID Type",
    idNumberLabel:     "ID Number",
    idNumberPlaceholder: "Document number",

    // ── Extra transfer details ──────────────────────────────────
    extraDetailsHide: "Hide", extraDetailsAdd: "Add",
    extraDetailsLabel: "Transfer Details",
    cityLabel:           "City",
    cityPlaceholder:     "Destination city",
    amountUsdLabel:      "Amount in USD",
    amountUsdPlaceholder:"For threshold check",
    transferPurposeLabel:"Transfer Purpose",
    agentNameLabel:      "Agent Name",
    agentNamePlaceholder:"Receiving agent",
    externalRefLabel:    "External Ref.",
    externalRefPlaceholder: "Ref from sarafa system",

    // ── Errors ───────────────────────────────────────────────────
    errRequiredNames:  "Sender and Receiver names are required",
    errForbidden:      "Access denied (403)",
    errUnauthorized:   "Unauthorized — please login again",
    errEmptyResponse:  "Empty response from server",
    errGeneric:        "Error",

    // ── Buttons / states ─────────────────────────────────────────
    screeningBtn:    "Screening...",
    screenTransferBtn:"Screen Transfer",
    awaitingTitle:   "Awaiting Transfer",
    awaitingSub:     "Fill in the details and click Screen",
    screeningProgress:"Screening against sanctions lists...",
    refLabel:        "REF",
    recordDecisionBtn:"Record Decision",
    riskLevelLabel:  "Risk Level",
    riskPointsLabel: "Risk Points",
    matchSingular:   "Match",
    matchPlural:     "Matches",
    clickToView:     "— Click to view details",
    newScreeningBtn: "New Screening",

    // ── History table ────────────────────────────────────────────
    historyTitle: "History",
    pageLabel:    "Page",
    historyHeaders: ["Reference","Sender","Receiver","Amount","Action","Risk","By","Date",""],
    noScreenings: "No screenings yet",
    detailsBtn:   "Details",
    viewDetailsBtn: "View Details",
    prevBtn: "← Prev",
    nextBtn: "Next →",

    // ── Detail modal ─────────────────────────────────────────────
    screeningDetailsTitle: "Screening Details",
    decisionBtn: "Decision",
    detailFieldLabels: {
      sender:"Sender", receiver:"Receiver", amount:"Amount", country:"Country",
      city:"City", purpose:"Purpose", riskLevel:"Risk Level", riskPoints:"Risk Points",
      speed:"Speed", screenedBy:"Screened by", operator:"Operator",
      externalRef:"External Ref", agent:"Agent", amountUsd:"Amount USD",
      senderNat:"Sender Nat.", receiverNat:"Receiver Nat.",
    },

    // ── Match detail modal ───────────────────────────────────────
    pepDetailsTitle:    "PEP Details",
    entityDetailsTitle: "Entity Details",
    pepFullTitle:       "Politically Exposed Person (PEP)",
    matchScoreLabel:    "Match Score",
    partyLabel:         "Party",
    noDetailsAvailable: "No details available",
    closeBtn:           "Close",
    detailsFields: {
      fullName:"Full Name", aliases:"Aliases", dob:"Date of Birth",
      nationality:"Nationality", program:"Program", remarks:"Remarks",
      description:"Description", wikidataId:"Wikidata ID",
    },

    // ── Decision modal ───────────────────────────────────────────
    decisionModalTitle: "Record Decision",
    transferRefLabel:   "Transfer #",
    decisionCommentPlaceholder: "Comment (optional)",
    decisionSelectError: "Select a decision first",
    decisionSaveError:   "Failed to save — try again",
    decisionCancel: "Cancel", decisionSaving: "Saving...", decisionSave: "Save",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  CASE MANAGEMENT PAGE
// ─────────────────────────────────────────────────────────────────────────────
staticContent.cases = {
  ar: {
    pageTitle:    "إدارة الحالات",
    pageSubtitle: "تتبّع وحل حالات الامتثال",
    newCaseBtn:   "حالة جديدة",

    // ── Stats ────────────────────────────────────────────────────
    statsLabels: [
      { key:"total",     label:"الإجمالي",  color:C_ICON.cyan   },
      { key:"open",      label:"مفتوحة",    color:C_ICON.cyan   },
      { key:"inReview",  label:"مراجعة",    color:C_ICON.orange },
      { key:"escalated", label:"متصاعدة",   color:C_ICON.red    },
      { key:"critical",  label:"حرجة",      color:C_ICON.red    },
      { key:"overdue",   label:"متأخرة",    color:C_ICON.red    },
      { key:"closed",    label:"مغلقة",     color:C_ICON.green  },
    ],

    // ── Status / Priority config ────────────────────────────────
    statusCFG: {
      OPEN:      { color:"#00d4ff", bg:"rgba(0,212,255,0.1)",  border:"rgba(0,212,255,0.3)",  icon:<Clock size={11}/>,         label:"مفتوحة"    },
      IN_REVIEW: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.3)", icon:<Search size={11}/>,        label:"قيد المراجعة" },
      ESCALATED: { color:"#ef4444", bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.3)",  icon:<AlertTriangle size={11}/>, label:"متصاعدة"   },
      CLOSED:    { color:"#10b981", bg:"rgba(16,185,129,0.1)", border:"rgba(16,185,129,0.3)", icon:<CheckCircle size={11}/>,   label:"مغلقة"      },
    },
    priorityLabels: { LOW:"منخفضة", MEDIUM:"متوسطة", HIGH:"عالية", CRITICAL:"حرجة" },

    // ── Filters ──────────────────────────────────────────────────
    filters: [
      { value:"ALL",       label:"الكل",        color:C_ICON.cyan   }, // text2 applied separately
      { value:"OPEN",      label:"مفتوحة",      color:C_ICON.cyan   },
      { value:"IN_REVIEW", label:"قيد المراجعة", color:C_ICON.orange },
      { value:"ESCALATED", label:"متصاعدة",     color:C_ICON.red    },
      { value:"CLOSED",    label:"مغلقة",       color:C_ICON.green  },
    ],
    searchPlaceholder: "بحث في الحالات...",

    // ── Table ────────────────────────────────────────────────────
    tableHeaders: ["المرجع","الموضوع","النوع","الحالة","القرار","الأولوية","معيّن إلى","التاريخ",""],
    unassigned:   "غير معيّن",
    noCasesFound: "لا توجد حالات",
    prevBtn: "← السابق", nextBtn: "التالي →",

    // ── Decisions ────────────────────────────────────────────────
    decisions: [
      { value:"TRUE_MATCH",     label:"مطابقة حقيقية",    color:C_ICON.red,    icon:<XCircle size={13}/>      },
      { value:"FALSE_POSITIVE", label:"إيجابي كاذب",      color:C_ICON.green,  icon:<CheckCircle size={13}/>  },
      { value:"PENDING_REVIEW", label:"بانتظار المراجعة", color:C_ICON.orange, icon:<Clock size={13}/>        },
      { value:"RISK_ACCEPTED",  label:"تم قبول المخاطرة", color:C_ICON.cyan,   icon:<AlertTriangle size={13}/> },
    ],
    decisionCFG: {
      TRUE_MATCH:     { color:C_ICON.red,    bg:"rgba(239,68,68,0.12)",  icon:<XCircle size={11}/>,      label:"مطابقة حقيقية"    },
      FALSE_POSITIVE: { color:C_ICON.green,  bg:"rgba(16,185,129,0.12)", icon:<CheckCircle size={11}/>,  label:"إيجابي كاذب"      },
      PENDING_REVIEW: { color:C_ICON.orange, bg:"rgba(245,158,11,0.12)", icon:<Clock size={11}/>,         label:"بانتظار المراجعة" },
      RISK_ACCEPTED:  { color:C_ICON.cyan,   bg:"rgba(0,212,255,0.12)",  icon:<AlertTriangle size={11}/>, label:"تم قبول المخاطرة" },
    },
    noDecisionBadge: "لا يوجد قرار",

    // ── Create Case Modal ───────────────────────────────────────
    createTitle:        "إنشاء حالة جديدة",
    caseTypeLabel:      "نوع الحالة",
    caseTypePerson:     "فحص شخص",
    caseTypeTransfer:   "تحويل",
    screeningIdLabel:   "رقم الفحص *",
    screeningIdPlaceholder: "مثال: 42",
    subjectNameLabel:   "اسم الموضوع *",
    subjectNamePlaceholder: "الاسم الكامل",
    priorityLabel:      "الأولوية",
    dueDateLabel:       "تاريخ الاستحقاق",
    notesLabel:         "ملاحظات",
    notesPlaceholder:   "ملاحظات أولية...",
    errRequiredFields:  "رقم الفحص واسم الموضوع مطلوبان",
    errFailed:          "فشلت العملية",
    cancelBtn:          "إلغاء",
    creatingBtn:        "جارٍ الإنشاء...",
    createBtn:          "إنشاء الحالة",

    // ── Case Detail Modal ───────────────────────────────────────
    overdueLabel: "متأخرة",
    requiresDecision: "يتطلب قرار",
    detailTabs: { details:"التفاصيل", matches:"المطابقات", decision:"القرار" },
    detailFieldLabels: {
      status:"الحالة", priority:"الأولوية", createdBy:"أُنشئت بواسطة",
      created:"تاريخ الإنشاء", date:"التاريخ", caseType:"نوع الحالة",
    },
    notesTitle: "ملاحظات",
    adminControlsTitle: "أدوات المسؤول",
    assignedToLabel: "معيّن إلى",
    updateStatusLabel: "تحديث الحالة",
    resolutionPlaceholder: "ملاحظات الحل...",
    savingBtn: "جارٍ الحفظ...",
    saveChangesBtn: "حفظ التغييرات",
    resolutionLabel: "الحل",

    // ── Matches tab ──────────────────────────────────────────────
    noMatchesData: "لا توجد بيانات مطابقات",
    matchSingular: "مطابقة",
    matchPlural:   "مطابقات",
    clickToView:   "— اضغط للعرض",
    viewBtn: "عرض",

    // ── Decision tab ───────────────────────────────────────────
    noDecisionTitle: "لا يوجد قرار مسجّل",
    noDecisionSub:   "هذه الحالة لم يُتخذ فيها قرار بعد — يرجى مراجعة المعلومات واتخاذ الإجراء المناسب",
    lastDecisionLabel: "آخر قرار",
    recordNewDecisionTitle: "تسجيل قرار جديد",
    decisionCommentPlaceholder: "تعليق / سبب (اختياري)",
    saveDecisionBtn: "حفظ القرار",
    adminOnlyDecision: "فقط المسؤولون يمكنهم تسجيل القرارات",

    // ── Match detail modal (shared keys) ──────────────────────
    pepDetailsTitle:    "تفاصيل PEP",
    entityDetailsTitle: "تفاصيل الكيان",
    pepFullTitle:       "شخصية سياسية بارزة (PEP)",
    matchScoreLabel:    "نسبة التطابق",
    partyLabel:         "الجهة",
    noDetailsAvailable: "لا توجد تفاصيل متاحة",
    closeBtn:           "إغلاق",
    detailsFields: {
      fullName:"الاسم الكامل", aliases:"الأسماء المستعارة", dob:"تاريخ الميلاد",
      nationality:"الجنسية", program:"البرنامج", remarks:"ملاحظات",
      description:"الوصف", wikidataId:"معرّف Wikidata",
    },
  },

  en: {
    pageTitle:    "Case Management",
    pageSubtitle: "Track and resolve compliance cases",
    newCaseBtn:   "New Case",

    // ── Stats ────────────────────────────────────────────────────
    statsLabels: [
      { key:"total",     label:"Total",     color:C_ICON.cyan   },
      { key:"open",      label:"Open",      color:C_ICON.cyan   },
      { key:"inReview",  label:"Review",    color:C_ICON.orange },
      { key:"escalated", label:"Escalated", color:C_ICON.red    },
      { key:"critical",  label:"Critical",  color:C_ICON.red    },
      { key:"overdue",   label:"Overdue",   color:C_ICON.red    },
      { key:"closed",    label:"Closed",    color:C_ICON.green  },
    ],

    // ── Status / Priority config ────────────────────────────────
    statusCFG: {
      OPEN:      { color:"#00d4ff", bg:"rgba(0,212,255,0.1)",  border:"rgba(0,212,255,0.3)",  icon:<Clock size={11}/>,         label:"Open"      },
      IN_REVIEW: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.3)", icon:<Search size={11}/>,        label:"In Review" },
      ESCALATED: { color:"#ef4444", bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.3)",  icon:<AlertTriangle size={11}/>, label:"Escalated" },
      CLOSED:    { color:"#10b981", bg:"rgba(16,185,129,0.1)", border:"rgba(16,185,129,0.3)", icon:<CheckCircle size={11}/>,   label:"Closed"    },
    },
    priorityLabels: { LOW:"Low", MEDIUM:"Medium", HIGH:"High", CRITICAL:"Critical" },

    // ── Filters ──────────────────────────────────────────────────
    filters: [
      { value:"ALL",       label:"All",       color:C_ICON.cyan   },
      { value:"OPEN",      label:"Open",      color:C_ICON.cyan   },
      { value:"IN_REVIEW", label:"In Review", color:C_ICON.orange },
      { value:"ESCALATED", label:"Escalated", color:C_ICON.red    },
      { value:"CLOSED",    label:"Closed",    color:C_ICON.green  },
    ],
    searchPlaceholder: "Search cases...",

    // ── Table ────────────────────────────────────────────────────
    tableHeaders: ["Reference","Subject","Type","Status","Decision","Priority","Assigned To","Date",""],
    unassigned:   "Unassigned",
    noCasesFound: "No cases found",
    prevBtn: "← Prev", nextBtn: "Next →",

    // ── Decisions ────────────────────────────────────────────────
    decisions: [
      { value:"TRUE_MATCH",     label:"True Match",     color:C_ICON.red,    icon:<XCircle size={13}/>      },
      { value:"FALSE_POSITIVE", label:"False Positive", color:C_ICON.green,  icon:<CheckCircle size={13}/>  },
      { value:"PENDING_REVIEW", label:"Pending Review", color:C_ICON.orange, icon:<Clock size={13}/>        },
      { value:"RISK_ACCEPTED",  label:"Risk Accepted",  color:C_ICON.cyan,   icon:<AlertTriangle size={13}/> },
    ],
    decisionCFG: {
      TRUE_MATCH:     { color:C_ICON.red,    bg:"rgba(239,68,68,0.12)",  icon:<XCircle size={11}/>,      label:"True Match"     },
      FALSE_POSITIVE: { color:C_ICON.green,  bg:"rgba(16,185,129,0.12)", icon:<CheckCircle size={11}/>,  label:"False Positive" },
      PENDING_REVIEW: { color:C_ICON.orange, bg:"rgba(245,158,11,0.12)", icon:<Clock size={11}/>,         label:"Pending Review" },
      RISK_ACCEPTED:  { color:C_ICON.cyan,   bg:"rgba(0,212,255,0.12)",  icon:<AlertTriangle size={11}/>, label:"Risk Accepted"  },
    },
    noDecisionBadge: "No Decision",

    // ── Create Case Modal ───────────────────────────────────────
    createTitle:        "Create New Case",
    caseTypeLabel:      "Case Type",
    caseTypePerson:     "Person Screening",
    caseTypeTransfer:   "Transfer",
    screeningIdLabel:   "Screening ID *",
    screeningIdPlaceholder: "e.g. 42",
    subjectNameLabel:   "Subject Name *",
    subjectNamePlaceholder: "Full name",
    priorityLabel:      "Priority",
    dueDateLabel:       "Due Date",
    notesLabel:         "Notes",
    notesPlaceholder:   "Initial observations...",
    errRequiredFields:  "Screening ID and Subject Name required",
    errFailed:          "Failed",
    cancelBtn:          "Cancel",
    creatingBtn:        "Creating...",
    createBtn:          "Create Case",

    // ── Case Detail Modal ───────────────────────────────────────
    overdueLabel: "OVERDUE",
    requiresDecision: "Decision required",
    detailTabs: { details:"Details", matches:"Matches", decision:"Decision" },
    detailFieldLabels: {
      status:"Status", priority:"Priority", createdBy:"Created By",
      created:"Created", date:"Date", caseType:"Case Type",
    },
    notesTitle: "Notes",
    adminControlsTitle: "Admin Controls",
    assignedToLabel: "Assigned To",
    updateStatusLabel: "Update Status",
    resolutionPlaceholder: "Resolution notes...",
    savingBtn: "Saving...",
    saveChangesBtn: "Save Changes",
    resolutionLabel: "Resolution",

    // ── Matches tab ──────────────────────────────────────────────
    noMatchesData: "No matches data available",
    matchSingular: "Match",
    matchPlural:   "Matches",
    clickToView:   "— Click to view details",
    viewBtn: "View",

    // ── Decision tab ───────────────────────────────────────────
    noDecisionTitle: "No decision recorded",
    noDecisionSub:   "This case has no decision yet — please review the information and take appropriate action",
    lastDecisionLabel: "Last Decision",
    recordNewDecisionTitle: "Record New Decision",
    decisionCommentPlaceholder: "Comment / Reason (optional)",
    saveDecisionBtn: "Save Decision",
    adminOnlyDecision: "Only Admins can record decisions",

    // ── Match detail modal (shared keys) ──────────────────────
    pepDetailsTitle:    "PEP Details",
    entityDetailsTitle: "Entity Details",
    pepFullTitle:       "Politically Exposed Person (PEP)",
    matchScoreLabel:    "Match Score",
    partyLabel:         "Party",
    noDetailsAvailable: "No details available",
    closeBtn:           "Close",
    detailsFields: {
      fullName:"Full Name", aliases:"Aliases", dob:"Date of Birth",
      nationality:"Nationality", program:"Program", remarks:"Remarks",
      description:"Description", wikidataId:"Wikidata ID",
    },
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