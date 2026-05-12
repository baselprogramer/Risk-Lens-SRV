import { useState, useEffect, useCallback } from "react";
import { Webhook, Plus, Trash2, Activity, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { API_V1 } from "../config/api";
import { getToken } from "../services/authService";
import Layout from "../components/Layout";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export default function WebhooksPage() {
  const [webhooks,   setWebhooks]   = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [activeTab,  setActiveTab]  = useState("webhooks");
  const [selectedId, setSelectedId] = useState(null);

  const [form, setForm] = useState({ url: "", events: [], secret: "" });

  const EVENTS = [
    { key: "SCREENING_HIGH",     label: "Screening HIGH" },
    { key: "SCREENING_CRITICAL", label: "Screening CRITICAL" },
    { key: "DECISION_CHANGED",   label: "Decision Changed" },
    { key: "TRANSFER_HIGH",      label: "Transfer HIGH/CRITICAL" },
  ];

  const S = {
    header:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
    title:      { display: "flex", alignItems: "center", gap: 12, fontSize: "1.4rem", fontWeight: 700 },
    card:       { background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
    btn:        { display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" },
    btnPrimary: { background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", color: "#060912" },
    btnDanger:  { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" },
    input:      { width: "100%", padding: "10px 14px", background: "#0a1628", border: "1px solid #1a2d4a", borderRadius: 9, color: "#e2e8f0", fontSize: "0.88rem", fontFamily: "'IBM Plex Sans', sans-serif", boxSizing: "border-box" },
    label:      { fontSize: "0.78rem", color: "#4a8aaa", fontWeight: 600, marginBottom: 6, display: "block" },
    badge:      (ok) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: ok ? "#10b981" : "#ef4444", border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }),
    tab:        (active) => ({ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif", background: active ? "rgba(0,212,255,0.1)" : "transparent", color: active ? "#00d4ff" : "#4a6a8a", borderBottom: active ? "2px solid #00d4ff" : "2px solid transparent", transition: "all 0.2s" }),
  };

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_V1}/webhooks`, { headers: authHeaders() });
      const data = await res.json();
      setWebhooks(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchDeliveries = useCallback(async (id) => {
    try {
      const res  = await fetch(`${API_V1}/webhooks/${id}/deliveries`, { headers: authHeaders() });
      const data = await res.json();
      setDeliveries(Array.isArray(data) ? data : []);
      setSelectedId(id);
      setActiveTab("deliveries");
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const handleCreate = async () => {
    if (!form.url || form.events.length === 0) return;
    try {
      await fetch(`${API_V1}/webhooks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      setForm({ url: "", events: [], secret: "" });
      setShowForm(false);
      fetchWebhooks();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف هذا الـ Webhook؟")) return;
    try {
      await fetch(`${API_V1}/webhooks/${id}`, { method: "DELETE", headers: authHeaders() });
      fetchWebhooks();
    } catch (e) { console.error(e); }
  };

  const toggleEvent = (key) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(key) ? f.events.filter(e => e !== key) : [...f.events, key],
    }));
  };

  const renderWebhooks = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: 60, color: "#4a6a8a" }}>
          <RefreshCw size={28} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      );
    }
    if (webhooks.length === 0) {
      return (
        <div style={{ ...S.card, textAlign: "center", padding: 60 }}>
          <Webhook size={40} color="#1a2d4a" style={{ marginBottom: 12 }} />
          <div style={{ color: "#4a6a8a", fontSize: "0.9rem" }}>لا يوجد Webhooks — أضف واحد الآن</div>
        </div>
      );
    }
    return webhooks.map(wh => (
      <div key={wh.id} style={S.card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={S.badge(wh.active)}>
                {wh.active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                {wh.active ? "Active" : "Inactive"}
              </span>
              {wh.failureCount > 0 && (
                <span style={{ ...S.badge(false), background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.2)" }}>
                  {wh.failureCount} failures
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#e2e8f0", marginBottom: 6, wordBreak: "break-all" }}>
              {wh.url}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {wh.events?.split(",").map(ev => (
                <span key={ev} style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#8b5cf6", fontSize: "0.72rem", fontWeight: 700 }}>
                  {ev.trim()}
                </span>
              ))}
            </div>
            {wh.lastTriggeredAt && (
              <div style={{ fontSize: "0.75rem", color: "#3a5a7a" }}>
                Last triggered: {new Date(wh.lastTriggeredAt).toLocaleString()}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button style={{ ...S.btn, background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)", padding: "7px 14px" }}
              onClick={() => fetchDeliveries(wh.id)}>
              <Activity size={14} /> Logs
            </button>
            <button style={{ ...S.btn, ...S.btnDanger, padding: "7px 14px" }}
              onClick={() => handleDelete(wh.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    ));
  };

  const renderDeliveries = () => {
    if (deliveries.length === 0) {
      return (
        <div style={{ ...S.card, textAlign: "center", padding: 60 }}>
          <Activity size={40} color="#1a2d4a" style={{ marginBottom: 12 }} />
          <div style={{ color: "#4a6a8a" }}>لا يوجد deliveries بعد</div>
        </div>
      );
    }
    return deliveries.map(d => (
      <div key={d.id} style={{ ...S.card, borderLeft: `3px solid ${d.success ? "#10b981" : "#ef4444"}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={S.badge(d.success)}>
              {d.success ? <CheckCircle size={11} /> : <XCircle size={11} />}
              {d.success ? "Success" : "Failed"}
            </span>
            <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#8b5cf6", fontSize: "0.72rem", fontWeight: 700 }}>
              {d.event}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#4a6a8a" }}>
              HTTP {d.statusCode} · Attempt {d.attempt}
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#3a5a7a" }}>
            {new Date(d.createdAt).toLocaleString()}
          </div>
        </div>
        {d.responseBody && (
          <div style={{ background: "#060912", border: "1px solid #1a2d4a", borderRadius: 8, padding: "10px 14px", fontSize: "0.78rem", color: "#4a8aaa", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 120, overflow: "auto" }}>
            {d.responseBody}
          </div>
        )}
      </div>
    ));
  };

  return (
    <Layout>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "#e2e8f0" }}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.title}>
            <Webhook size={26} color="#00d4ff" />
            <span style={{ background: "linear-gradient(135deg,#e2e8f0,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Webhooks
            </span>
          </div>
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Webhook
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1a2d4a" }}>
          <button style={S.tab(activeTab === "webhooks")} onClick={() => setActiveTab("webhooks")}>
            Webhooks ({webhooks.length})
          </button>
          {selectedId && (
            <button style={S.tab(activeTab === "deliveries")} onClick={() => setActiveTab("deliveries")}>
              Delivery Log
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ ...S.card, border: "1px solid rgba(0,212,255,0.2)", marginBottom: 24 }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 18, color: "#00d4ff" }}>New Webhook</div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Endpoint URL *</label>
              <input style={S.input} placeholder="https://your-server.com/webhook"
                value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Events *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {EVENTS.map(ev => (
                  <label key={ev.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "7px 14px", borderRadius: 8, border: `1px solid ${form.events.includes(ev.key) ? "rgba(0,212,255,0.4)" : "#1a2d4a"}`, background: form.events.includes(ev.key) ? "rgba(0,212,255,0.08)" : "transparent", fontSize: "0.82rem", color: form.events.includes(ev.key) ? "#00d4ff" : "#4a6a8a", transition: "all 0.2s" }}>
                    <input type="checkbox" checked={form.events.includes(ev.key)}
                      onChange={() => toggleEvent(ev.key)} style={{ accentColor: "#00d4ff" }} />
                    {ev.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Secret (اختياري — للتوقيع)</label>
              <input style={S.input} placeholder="my-secret-key"
                value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn, ...S.btnPrimary }} onClick={handleCreate}>
                <Plus size={15} /> Create
              </button>
              <button style={{ ...S.btn, background: "rgba(255,255,255,0.05)", color: "#4a6a8a" }}
                onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === "webhooks"   && renderWebhooks()}
        {activeTab === "deliveries" && renderDeliveries()}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
}