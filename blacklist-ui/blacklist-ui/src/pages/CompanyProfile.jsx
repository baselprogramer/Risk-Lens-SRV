import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";
import {
  Building2, SlidersHorizontal, ShieldBan, Plus, Trash2, Save, Pencil,
  Search, Globe, Flag, Check, X, AlertTriangle, Info, GitBranch, Power
} from "lucide-react";

import { useLang } from "../context/LangContext";
import { staticContent2 } from "../locales/content_2";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

// ══════════════════════════════════════════════════════════════════
//  Endpoints — كلها مؤكّدة مع الـ controllers تبعك
//  risk-config : GET /  ·  PUT /similarity-threshold
//  block-policy: GET /  ·  POST /  ·  PUT /{id} {message,active}  ·  DELETE /{id}
//  branches    : GET /  ·  POST / {name,code}  ·  PUT /{id} {name,code}  ·  PUT /{id}/deactivate
// ══════════════════════════════════════════════════════════════════
const RISK_CONFIG_URL  = `${API_V1}/risk-config`;
const BLOCK_POLICY_URL = `${API_V1}/block-policy`;
const BRANCHES_URL     = `${API_V1}/branches`;


export default function CompanyProfile() {
  const {lang} = useLang()
  const t = staticContent2.comapnyProfile?.[lang] || staticContent2.comapnyProfile?.en || {};
  const isRtl = lang === "ar";

  // ── Similarity threshold ──
  const [threshold, setThreshold] = useState(75);
  const [bounds, setBounds]       = useState({ min: 50, max: 100, def: 75 });
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [savingCfg, setSavingCfg]   = useState(false);
  const [cfgSaved, setCfgSaved]     = useState(false);
  const [cfgError, setCfgError]     = useState("");

  // ── Block policy ──
  const [rules, setRules]         = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [rulesError, setRulesError]     = useState("");
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState({ type: "COUNTRY", value: "", message: "" });
  const [adding, setAdding]       = useState(false);

  // ── Edit modal ──
  const [editRule, setEditRule]   = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [editActive, setEditActive]   = useState(true);
  const [savingEdit, setSavingEdit]   = useState(false);

  // ── Branches ──
  const [branches, setBranches]         = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchError, setBranchError]   = useState("");
  const [branchForm, setBranchForm]     = useState({ name: "", code: "" });
  const [addingBranch, setAddingBranch] = useState(false);

  // ══════════════ load ══════════════
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(RISK_CONFIG_URL, { headers: authHeaders() });
        if (!r.ok) throw new Error();
        const d = await r.json();
        setThreshold(Math.round(d.similarityThreshold ?? 75));
        setBounds({
          min: d.minThreshold ?? 50,
          max: d.maxThreshold ?? 100,
          def: d.defaultThreshold ?? 75,
        });
      } catch { setCfgError(t.genericError); }
      finally { setLoadingCfg(false); }
    })();
    loadRules();
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRules = async () => {
    setLoadingRules(true);
    try {
      const r = await fetch(BLOCK_POLICY_URL, { headers: authHeaders() });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setRules(Array.isArray(d) ? d : (d.content || []));
      setRulesError("");
    } catch { setRulesError(t.genericError); }
    finally { setLoadingRules(false); }
  };

  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const r = await fetch(BRANCHES_URL, { headers: authHeaders() });   // الكل (فعّال + معطّل)
      if (!r.ok) throw new Error();
      const d = await r.json();
      setBranches(Array.isArray(d) ? d : (d.content || []));
      setBranchError("");
    } catch { setBranchError(t.genericError); }
    finally { setLoadingBranches(false); }
  };

  // ══════════════ threshold save ══════════════
  const saveThreshold = async () => {
    setSavingCfg(true); setCfgSaved(false); setCfgError("");
    try {
      const r = await fetch(`${RISK_CONFIG_URL}/similarity-threshold`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ similarityThreshold: threshold }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setThreshold(Math.round(d.similarityThreshold ?? threshold));
      setCfgSaved(true);
      setTimeout(() => setCfgSaved(false), 2500);
    } catch { setCfgError(t.genericError); }
    finally { setSavingCfg(false); }
  };

  // ══════════════ block rule actions ══════════════
  const addRule = async () => {
    if (!form.value.trim() || !form.message.trim()) return;
    setAdding(true);
    try {
      const r = await fetch(BLOCK_POLICY_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          type: form.type,
          value: form.value.trim(),
          message: form.message.trim(),
        }),
      });
      if (!r.ok) throw new Error();
      setForm({ type: form.type, value: "", message: "" });
      await loadRules();
    } catch { setRulesError(t.genericError); }
    finally { setAdding(false); }
  };

  const toggleRule = async (rule) => {
    const isActive = rule.active ?? true;
    try {
      const r = await fetch(`${BLOCK_POLICY_URL}/${rule.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ message: rule.message, active: !isActive }),
      });
      if (!r.ok) throw new Error();
      await loadRules();
    } catch { setRulesError(t.genericError); }
  };

  const deleteRule = async (id) => {
    if (!window.confirm(t.blockDeleteConfirm)) return;
    try {
      const r = await fetch(`${BLOCK_POLICY_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!r.ok) throw new Error();
      setRules(prev => prev.filter(x => x.id !== id));
    } catch { setRulesError(t.genericError); }
  };

  const openEdit = (rule) => {
    setEditRule(rule);
    setEditMessage(rule.message || "");
    setEditActive(rule.active ?? true);
  };

  const saveEdit = async () => {
    if (!editRule || !editMessage.trim()) return;
    setSavingEdit(true);
    try {
      const r = await fetch(`${BLOCK_POLICY_URL}/${editRule.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ message: editMessage.trim(), active: editActive }),
      });
      if (!r.ok) throw new Error();
      setEditRule(null);
      await loadRules();
    } catch { setRulesError(t.genericError); }
    finally { setSavingEdit(false); }
  };

  // ══════════════ branch actions ══════════════
  const addBranch = async () => {
    if (!branchForm.name.trim()) return;
    setAddingBranch(true);
    try {
      const r = await fetch(BRANCHES_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: branchForm.name.trim(),
          code: branchForm.code.trim() || null,
        }),
      });
      if (!r.ok) { setBranchError(await r.text() || t.genericError); return; }
      setBranchForm({ name: "", code: "" });
      setBranchError("");
      await loadBranches();
    } catch { setBranchError(t.genericError); }
    finally { setAddingBranch(false); }
  };

  const deactivateBranch = async (branch) => {
    const isActive = branch.active ?? true;
    if (!isActive) return;   // معطّل أصلاً
    if (!window.confirm(t.branchDeactivateConfirm)) return;
    try {
      const r = await fetch(`${BRANCHES_URL}/${branch.id}/deactivate`, {
        method: "PUT",
        headers: authHeaders(),
      });
      if (!r.ok) throw new Error();
      await loadBranches();
    } catch { setBranchError(t.genericError); }
  };

  const filtered = rules.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${r.value || ""} ${r.message || ""} ${r.type || ""}`.toLowerCase().includes(q);
  });

  const pct = ((threshold - bounds.min) / (bounds.max - bounds.min)) * 100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .cp-card{animation:fadeUp .4s ease both;}
        .cp-row:hover{background:rgba(0,212,255,.04)!important;}
        .cp-btn{cursor:pointer;transition:all .2s;font-family:'IBM Plex Sans',sans-serif;border:none;}
        .cp-btn:hover{filter:brightness(1.12);}
        .cp-btn:disabled{opacity:.5;cursor:not-allowed;filter:none;}
        .cp-input{background:#111c2e;border:1px solid #1a2d4a;border-radius:8px;color:#e2e8f0;
          font-family:'IBM Plex Sans',sans-serif;font-size:.82rem;padding:9px 11px;outline:none;transition:border .2s;width:100%;}
        .cp-input:focus{border-color:rgba(0,212,255,.5);}
        .cp-input::placeholder{color:#3a5a7a;}
        .cp-icon-btn{background:transparent;border:none;cursor:pointer;padding:5px;border-radius:6px;display:inline-flex;transition:all .2s;color:#7a8fa8;}
        .cp-icon-btn:hover{background:rgba(0,212,255,.08);}
        .cp-slider{-webkit-appearance:none;appearance:none;height:6px;border-radius:6px;outline:none;cursor:pointer;width:100%;}
        .cp-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;
          background:#00d4ff;border:3px solid #0d1321;box-shadow:0 0 0 1px #00d4ff,0 0 10px rgba(0,212,255,.5);cursor:pointer;}
        .cp-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#00d4ff;border:3px solid #0d1321;
          box-shadow:0 0 10px rgba(0,212,255,.5);cursor:pointer;}
        .cp-form-grid{display:grid;grid-template-columns:150px 1fr 1fr auto;gap:10px;align-items:end;}
        .cp-branch-grid{display:grid;grid-template-columns:1fr 200px auto;gap:10px;align-items:end;}
        @media(max-width:768px){
          .cp-form-grid,.cp-branch-grid{grid-template-columns:1fr!important;}
          .page-title{font-size:1.3rem!important;}
          .cp-table{min-width:560px;}
        }
      `}</style>

      <Layout>
        <div dir={isRtl ? "rtl" : "ltr"}
          style={{ background: "#060912", minHeight: "100%", padding: "16px", borderRadius: "14px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "14px", pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(0,212,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.018) 1px,transparent 1px)",
            backgroundSize: "50px 50px" }} />

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, position: "relative", zIndex: 1 }}>
            <div style={{ width: 4, height: 34, background: "linear-gradient(180deg,#00d4ff,#8b5cf6)", borderRadius: 4 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 size={22} color="#00d4ff" />
              <div>
                <h2 className="page-title" style={{ margin: 0, fontSize: "1.55rem", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.3px" }}>{t.page}</h2>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#7a8fa8", marginTop: 2 }}>{t.badge}</p>
              </div>
            </div>
          </div>

          {/* ══════════════ Similarity threshold ══════════════ */}
          <div className="cp-card" style={{ background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, padding: "18px 20px", marginBottom: 18, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <SlidersHorizontal size={16} color="#00d4ff" />
              <span style={{ fontSize: "0.98rem", fontWeight: 700, color: "#e2e8f0" }}>{t.thresholdTitle}</span>
            </div>
            <p style={{ margin: "0 0 18px", fontSize: "0.78rem", color: "#7a8fa8", lineHeight: 1.6, maxWidth: 620 }}>{t.thresholdDesc}</p>

            {loadingCfg ? (
              <Spinner />
            ) : (
              <>
                <div dir="ltr" style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, justifyContent: isRtl ? "flex-end" : "flex-start" }}>
                  <span style={{ fontSize: "2.6rem", fontWeight: 700, color: "#00d4ff", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{threshold}</span>
                  <span style={{ fontSize: "0.72rem", color: "#7a8fa8", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>{t.thresholdCurrent}</span>
                </div>

                <div dir="ltr" style={{ position: "relative", marginBottom: 10 }}>
                  <input type="range" className="cp-slider"
                    min={bounds.min} max={bounds.max} step={1} value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    style={{ direction: "ltr", background: `linear-gradient(90deg,#00d4ff 0%,#8b5cf6 ${pct}%,#111c2e ${pct}%,#111c2e 100%)` }} />
                </div>

                <div dir="ltr" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#7a8fa8", marginBottom: 18 }}>
                  <span>{bounds.min} · {t.thresholdLooser}</span>
                  <span>{t.thresholdStricter} · {bounds.max}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 16, fontSize: "0.7rem", color: "#7a8fa8" }}>
                    <span><span style={{ color: "#3a5a7a" }}>{t.thresholdRange}:</span> <b dir="ltr" style={{ display: "inline-block", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{bounds.min}–{bounds.max}</b></span>
                    <span><span style={{ color: "#3a5a7a" }}>{t.thresholdDefault}:</span> <b dir="ltr" style={{ display: "inline-block", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{bounds.def}</b></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {cfgError && <span style={{ fontSize: "0.72rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} />{cfgError}</span>}
                    {cfgSaved && <span style={{ fontSize: "0.74rem", color: "#10b981", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}><Check size={13} />{t.saved}</span>}
                    <button className="cp-btn" onClick={saveThreshold} disabled={savingCfg}
                      style={{ background: "linear-gradient(90deg,#00d4ff,#8b5cf6)", color: "#060912", fontWeight: 700, fontSize: "0.82rem", padding: "9px 18px", borderRadius: 9, display: "flex", alignItems: "center", gap: 6 }}>
                      <Save size={14} />{savingCfg ? t.saving : t.save}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ══════════════ Block rules ══════════════ */}
          <div className="cp-card" style={{ background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, padding: "18px 20px", marginBottom: 18, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <ShieldBan size={16} color="#f97316" />
              <span style={{ fontSize: "0.98rem", fontWeight: 700, color: "#e2e8f0" }}>{t.blockTitle}</span>
            </div>
            <p style={{ margin: "0 0 18px", fontSize: "0.78rem", color: "#7a8fa8", lineHeight: 1.6, maxWidth: 640 }}>{t.blockDesc}</p>

            <div className="cp-form-grid" style={{ marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>{t.blockType}</label>
                <select className="cp-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="COUNTRY">{t.blockCountry}</option>
                  <option value="NATIONALITY">{t.blockNationality}</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t.blockValue}</label>
                <input className="cp-input" value={form.value} placeholder={t.blockValuePlaceholder}
                  onChange={e => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>{t.blockMessage}</label>
                <input className="cp-input" value={form.message} placeholder={t.blockMessagePlaceholder}
                  onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button className="cp-btn" onClick={addRule} disabled={adding || !form.value.trim() || !form.message.trim()}
                style={{ background: "rgba(0,212,255,.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,.35)", fontWeight: 700, fontSize: "0.82rem", padding: "9px 16px", borderRadius: 9, display: "flex", alignItems: "center", gap: 6, height: 38 }}>
                <Plus size={15} />{t.blockAdd}
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: 12, maxWidth: 320 }}>
              <Search size={14} color="#3a5a7a" style={{ position: "absolute", top: "50%", [isRtl ? "right" : "left"]: 11, transform: "translateY(-50%)" }} />
              <input className="cp-input" value={search} placeholder={t.blockSearch}
                onChange={e => setSearch(e.target.value)}
                style={{ [isRtl ? "paddingRight" : "paddingLeft"]: 32 }} />
            </div>

            {rulesError && (
              <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: "0.74rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={13} />{rulesError}
              </div>
            )}

            {loadingRules ? (
              <Spinner />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "34px 0", color: "#3a5a7a", fontSize: "0.84rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Info size={20} color="#1a2d4a" />{t.blockEmpty}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#111c2e" }}>
                      {[t.colType, t.colValue, t.colMessage, t.colStatus, t.colActions].map((h, i) => (
                        <th key={i} style={{ padding: "10px 14px", textAlign: isRtl ? "right" : "left", fontSize: "0.64rem", fontWeight: 700, color: "#3a5a7a", letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid #1a2d4a", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const isActive = r.active ?? true;
                      const isCountry = (r.type || "").toUpperCase() === "COUNTRY";
                      return (
                        <tr key={r.id} className="cp-row" style={{ borderBottom: "1px solid #111c2e", transition: "background .15s", opacity: isActive ? 1 : 0.55 }}>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.72rem", fontWeight: 600, color: isCountry ? "#00d4ff" : "#a78bfa", background: isCountry ? "rgba(0,212,255,.08)" : "rgba(139,92,246,.1)", border: `1px solid ${isCountry ? "rgba(0,212,255,.2)" : "rgba(139,92,246,.25)"}`, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>
                              {isCountry ? <Globe size={12} /> : <Flag size={12} />}
                              {isCountry ? t.blockCountry : t.blockNationality}
                            </span>
                          </td>
                          <td dir="ltr" style={{ padding: "11px 14px", fontSize: "0.84rem", fontWeight: 600, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap", textAlign: isRtl ? "right" : "left" }}>{r.value}</td>
                          <td style={{ padding: "11px 14px", fontSize: "0.78rem", color: "#94a3b8", maxWidth: 260 }}>{r.message}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <button className="cp-btn" onClick={() => toggleRule(r)}
                              title={isActive ? t.blockActive : t.blockInactive}
                              style={{ background: isActive ? "rgba(16,185,129,.1)" : "rgba(122,143,168,.1)", color: isActive ? "#10b981" : "#7a8fa8", border: `1px solid ${isActive ? "rgba(16,185,129,.3)" : "rgba(122,143,168,.25)"}`, fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#10b981" : "#7a8fa8" }} />
                              {isActive ? t.blockActive : t.blockInactive}
                            </button>
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", gap: 4, justifyContent: isRtl ? "flex-start" : "flex-end" }}>
                              <button className="cp-icon-btn" onClick={() => openEdit(r)} title={t.edit}
                                onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#7a8fa8")}>
                                <Pencil size={14} />
                              </button>
                              <button className="cp-icon-btn" onClick={() => deleteRule(r.id)} title={t.delete}
                                onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#7a8fa8")}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ══════════════ Branches ══════════════ */}
          <div className="cp-card" style={{ background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, padding: "18px 20px", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <GitBranch size={16} color="#8b5cf6" />
              <span style={{ fontSize: "0.98rem", fontWeight: 700, color: "#e2e8f0" }}>{t.branchTitle}</span>
            </div>
            <p style={{ margin: "0 0 18px", fontSize: "0.78rem", color: "#7a8fa8", lineHeight: 1.6, maxWidth: 640 }}>{t.branchDesc}</p>

            <div className="cp-branch-grid" style={{ marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>{t.branchName}</label>
                <input className="cp-input" value={branchForm.name} placeholder={t.branchNamePlaceholder}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>{t.branchCode}</label>
                <input className="cp-input" value={branchForm.code} placeholder={t.branchCodePlaceholder} dir="ltr"
                  onChange={e => setBranchForm({ ...branchForm, code: e.target.value })} />
              </div>
              <button className="cp-btn" onClick={addBranch} disabled={addingBranch || !branchForm.name.trim()}
                style={{ background: "rgba(139,92,246,.14)", color: "#a78bfa", border: "1px solid rgba(139,92,246,.35)", fontWeight: 700, fontSize: "0.82rem", padding: "9px 16px", borderRadius: 9, display: "flex", alignItems: "center", gap: 6, height: 38 }}>
                <Plus size={15} />{t.branchAdd}
              </button>
            </div>

            {branchError && (
              <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: "0.74rem", color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={13} />{branchError}
              </div>
            )}

            {loadingBranches ? (
              <Spinner />
            ) : branches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "34px 0", color: "#3a5a7a", fontSize: "0.84rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Info size={20} color="#1a2d4a" />{t.branchEmpty}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="cp-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#111c2e" }}>
                      {[t.branchColName, t.branchColCode, t.branchColStatus, ""].map((h, i) => (
                        <th key={i} style={{ padding: "10px 14px", textAlign: isRtl ? "right" : "left", fontSize: "0.64rem", fontWeight: 700, color: "#3a5a7a", letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid #1a2d4a", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(b => {
                      const isActive = b.active ?? true;
                      return (
                        <tr key={b.id} className="cp-row" style={{ borderBottom: "1px solid #111c2e", transition: "background .15s", opacity: isActive ? 1 : 0.5 }}>
                          <td style={{ padding: "11px 14px", fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              <GitBranch size={13} color="#8b5cf6" />{b.name}
                            </span>
                          </td>
                          <td dir="ltr" style={{ padding: "11px 14px", fontSize: "0.8rem", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", textAlign: isRtl ? "right" : "left" }}>{b.code || "—"}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.7rem", fontWeight: 700, color: isActive ? "#10b981" : "#7a8fa8", background: isActive ? "rgba(16,185,129,.1)" : "rgba(122,143,168,.1)", border: `1px solid ${isActive ? "rgba(16,185,129,.3)" : "rgba(122,143,168,.25)"}`, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#10b981" : "#7a8fa8" }} />
                              {isActive ? t.branchActive : t.branchInactive}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", textAlign: isRtl ? "left" : "right" }}>
                            {isActive && (
                              <button className="cp-icon-btn" onClick={() => deactivateBranch(b)} title={t.branchDeactivate}
                                onMouseEnter={e => (e.currentTarget.style.color = "#f59e0b")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#7a8fa8")}>
                                <Power size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>

      {/* ══════════════ Edit modal (block rule) ══════════════ */}
      {editRule && (
        <div onClick={() => !savingEdit && setEditRule(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(3,6,12,.72)", backdropFilter: "blur(3px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div dir={isRtl ? "rtl" : "ltr"} onClick={e => e.stopPropagation()}
            style={{ background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, width: "100%", maxWidth: 460, padding: "20px 22px", animation: "modalIn .22s ease both", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Pencil size={16} color="#00d4ff" />
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0" }}>{t.editTitle}</span>
              </div>
              <button className="cp-icon-btn" onClick={() => !savingEdit && setEditRule(null)}><X size={17} /></button>
            </div>

            <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.74rem", fontWeight: 600, color: (editRule.type || "").toUpperCase() === "COUNTRY" ? "#00d4ff" : "#a78bfa", background: (editRule.type || "").toUpperCase() === "COUNTRY" ? "rgba(0,212,255,.08)" : "rgba(139,92,246,.1)", border: `1px solid ${(editRule.type || "").toUpperCase() === "COUNTRY" ? "rgba(0,212,255,.2)" : "rgba(139,92,246,.25)"}`, padding: "4px 10px", borderRadius: 7 }}>
                {(editRule.type || "").toUpperCase() === "COUNTRY" ? <Globe size={12} /> : <Flag size={12} />}
                {(editRule.type || "").toUpperCase() === "COUNTRY" ? t.blockCountry : t.blockNationality}
              </span>
              <span dir="ltr" style={{ display: "inline-flex", alignItems: "center", fontSize: "0.84rem", fontWeight: 700, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", background: "#111c2e", border: "1px solid #1a2d4a", padding: "4px 12px", borderRadius: 7 }}>
                {editRule.value}
              </span>
            </div>

            <label style={labelStyle}>{t.blockMessage}</label>
            <input className="cp-input" value={editMessage} placeholder={t.blockMessagePlaceholder}
              onChange={e => setEditMessage(e.target.value)} style={{ marginBottom: 14 }} autoFocus />

            <button className="cp-btn" onClick={() => setEditActive(a => !a)}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", background: "#111c2e", border: "1px solid #1a2d4a", borderRadius: 9, padding: "10px 12px", marginBottom: 8 }}>
              <span style={{ width: 34, height: 19, borderRadius: 20, background: editActive ? "#10b981" : "#3a4a5e", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 2, [editActive ? "right" : "left"]: 2, width: 15, height: 15, borderRadius: "50%", background: "#fff", transition: "all .2s" }} />
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: editActive ? "#10b981" : "#7a8fa8" }}>
                {t.editActiveLabel}
              </span>
            </button>

            <p style={{ fontSize: "0.68rem", color: "#3a5a7a", lineHeight: 1.5, margin: "0 0 18px" }}>{t.editHint}</p>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="cp-btn" onClick={() => setEditRule(null)} disabled={savingEdit}
                style={{ background: "transparent", color: "#7a8fa8", border: "1px solid #1a2d4a", fontWeight: 600, fontSize: "0.82rem", padding: "8px 16px", borderRadius: 8 }}>
                {t.cancel}
              </button>
              <button className="cp-btn" onClick={saveEdit} disabled={savingEdit || !editMessage.trim()}
                style={{ background: "linear-gradient(90deg,#00d4ff,#8b5cf6)", color: "#060912", fontWeight: 700, fontSize: "0.82rem", padding: "8px 18px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Save size={14} />{savingEdit ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle = {
  display: "block", fontSize: "0.64rem", fontWeight: 700, color: "#7a8fa8",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6,
};

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "26px 0" }}>
      <div style={{ width: 22, height: 22, border: "3px solid #1a2d4a", borderTop: "3px solid #00d4ff", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} />
    </div>
  );
}