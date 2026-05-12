import { useState, useEffect, useCallback } from "react";
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Shield, Database, Zap, TrendingUp } from "lucide-react";
import { API_V1 } from "../config/api";
import { getToken } from "../services/authService";
import Layout from "../components/Layout";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const role = localStorage.getItem("role") || "";
const isSuperAdmin = role === "SUPER_ADMIN";

const TYPE_META = {
  ES_DOWN:        { label: "Elasticsearch", color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",  icon: Database    },
  RATE_LIMIT:     { label: "Rate Limit",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: Zap         },
  IMPORT_FAILED:  { label: "Import Failed", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", icon: AlertTriangle },
  CRITICAL_SPIKE: { label: "Critical Spike",color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",  icon: TrendingUp  },
};

const SEVERITY_META = {
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)"  },
  WARNING:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
};

export default function MonitoringPage() {
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [count,     setCount]     = useState(0);

  const S = {
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
    title:  { display: "flex", alignItems: "center", gap: 12, fontSize: "1.4rem", fontWeight: 700 },
    card:   { background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
    btn:    { display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" },
    tab:    (active) => ({ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif", background: active ? "rgba(0,212,255,0.1)" : "transparent", color: active ? "#00d4ff" : "#4a6a8a", borderBottom: active ? "2px solid #00d4ff" : "2px solid transparent", transition: "all 0.2s" }),
  };

const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ SUPER_ADMIN يشوف كل شي، غيره يشوف tenant بس
     const endpoint = isSuperAdmin
    ? (activeTab === "active" ? "/monitoring/alerts" : "/monitoring/alerts/all")
    : `/monitoring/alerts/my?all=${activeTab !== "active"}`;


      const [alertsRes, countRes] = await Promise.all([
        fetch(`${API_V1}${endpoint}`, { headers: authHeaders() }),
        fetch(`${API_V1}/monitoring/alerts/count`, { headers: authHeaders() }),
      ]);
      const alertsData = await alertsRes.json();
      const countData  = await countRes.json();
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setCount(countData.active || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
}, [activeTab]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = async (id) => {
    try {
      await fetch(`${API_V1}/monitoring/alerts/${id}/resolve`, {
        method: "PUT",
        headers: authHeaders(),
      });
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const renderAlerts = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: 60, color: "#4a6a8a" }}>
          <RefreshCw size={28} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      );
    }

    if (alerts.length === 0) {
      return (
        <div style={{ ...S.card, textAlign: "center", padding: 60 }}>
          <Shield size={40} color="#1a2d4a" style={{ marginBottom: 12 }} />
          <div style={{ color: "#10b981", fontSize: "0.9rem", fontWeight: 600 }}>
            {activeTab === "active" ? "كل شي شغّال — لا يوجد تنبيهات نشطة" : "لا يوجد تنبيهات"}
          </div>
        </div>
      );
    }

    return alerts.map(alert => {
      const typeMeta     = TYPE_META[alert.type]          || TYPE_META.IMPORT_FAILED;
      const severityMeta = SEVERITY_META[alert.severity]  || SEVERITY_META.WARNING;
      const Icon         = typeMeta.icon;
      return (
        <div key={alert.id} style={{ ...S.card, borderLeft: `3px solid ${severityMeta.color}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", gap: 14, flex: 1 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: typeMeta.bg, border: `1px solid ${typeMeta.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Icon size={17} color={typeMeta.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, background: severityMeta.bg, border: `1px solid ${severityMeta.border}`, color: severityMeta.color, fontSize: "0.72rem", fontWeight: 700 }}>
                    {alert.severity}
                  </span>
                  <span style={{ padding: "2px 10px", borderRadius: 20, background: typeMeta.bg, border: `1px solid ${typeMeta.border}`, color: typeMeta.color, fontSize: "0.72rem", fontWeight: 700 }}>
                    {typeMeta.label}
                  </span>
                  {alert.source && (
                    <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#8b5cf6", fontSize: "0.72rem", fontWeight: 700 }}>
                      {alert.source}
                    </span>
                  )}
                  {alert.resolved && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", fontSize: "0.72rem", fontWeight: 700 }}>
                      <CheckCircle size={10} /> Resolved
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#e2e8f0", marginBottom: 6 }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#3a5a7a" }}>
                  {new Date(alert.createdAt).toLocaleString()}
                  {alert.resolvedAt && (
                    <span style={{ marginLeft: 12, color: "#10b981" }}>
                      Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!alert.resolved && (
              <button style={{ ...S.btn, background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", padding: "7px 14px", flexShrink: 0 }}
                onClick={() => handleResolve(alert.id)}>
                <CheckCircle size={14} /> Resolve
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <Layout>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "#e2e8f0" }}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.title}>
            <Activity size={26} color="#00d4ff" />
            <span style={{ background: "linear-gradient(135deg,#e2e8f0,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Monitoring
            </span>
            {count > 0 && (
              <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "0.75rem", fontWeight: 700 }}>
                {count} active
              </span>
            )}
          </div>
          <button style={{ ...S.btn, background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
            onClick={fetchAlerts}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const Icon = meta.icon;
            const typeCount = alerts.filter(a => a.type === type && !a.resolved).length;
            return (
              <div key={type} style={{ ...S.card, marginBottom: 0, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={meta.color} />
                </div>
                <div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: typeCount > 0 ? meta.color : "#e2e8f0" }}>
                    {typeCount}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#4a6a8a", fontWeight: 600 }}>
                    {meta.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1a2d4a" }}>
          <button style={S.tab(activeTab === "active")} onClick={() => setActiveTab("active")}>
            Active ({count})
          </button>
          <button style={S.tab(activeTab === "all")} onClick={() => setActiveTab("all")}>
            All Alerts
          </button>
        </div>

        {/* Alerts List */}
        {renderAlerts()}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
}