import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";
import { RefreshCw, XCircle, CheckCircle, Clock, AlertTriangle,
  Scale, Edit2, User, ArrowLeftRight, Download } from "lucide-react";
import { isSuperAdmin, isCompanyAdmin } from "../services/authService";
import { useLang } from "../context/LangContext";
import { staticContent2 } from "../locales/content_2";

const API = `${API_V1}/decisions`;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

const canEdit = () => isSuperAdmin() || isCompanyAdmin();

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  orange:"#f59e0b", red:"#ef4444", text:"#e2e8f0", text2:"#7a8fa8",
};

function EditModal({ decision, onClose, onSaved ,  t}) {
  const [newDecision, setNewDecision] = useState(decision.decision);
  const [comment,     setComment]     = useState(decision.comment || "");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${decision.id}`, {
        method:"PUT", headers:authHeaders(),
        body:JSON.stringify({ decision:newDecision, comment }),
      });
      if (!res.ok) throw new Error("Failed");
      onSaved(await res.json());
      onClose();
    } catch { setError(t.errSaveFailed); }
    finally  { setSaving(false); }
  };

  const selected = t.decisions.find(d => d.value === newDecision);
  const dc = t.decisionCFG[decision.decision];
  const tc = t.typeCfg[decision.screeningType] || t.typeCfg.PERSON;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" }}>
      <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:16,
        padding:"24px", width:"100%", maxWidth:440, position:"relative", overflow:"hidden",
        animation:"fadeUp .25s ease" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg,${C.orange},${C.purple})` }} />
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4,
          display:"flex", alignItems:"center", gap:7 }}>
          <Scale size={14} color={C.orange}/> {t.editTitle}
        </div>
        <div style={{ marginBottom:14, padding:"10px 12px", background:C.s2,
          border:`1px solid ${C.border}`, borderRadius:9 }}>
          <div style={{ fontSize:11, color:C.text2, marginBottom:4 }}>{t.subjectLabel}</div>
          <div style={{ fontSize:13, fontWeight:600, color:C.text,
            display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:tc.color }}>{tc.icon}</span>
            {decision.subjectName || `#${decision.screeningId}`}
          </div>
          <div style={{ marginTop:5, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, color:C.text2 }}>{t.currentLabel}</span>
            <span style={{ fontSize:11, fontWeight:700, color:dc?.color,
              fontFamily:"'JetBrains Mono',monospace", display:"flex", alignItems:"center", gap:3 }}>
              {dc?.icon} {dc?.label}
            </span>
          </div>
        </div>
        <div style={{ fontSize:12, color:C.text2, marginBottom:8 }}>{t.changeToLabel}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {t.decisions.map(d => (
            <button key={d.value} onClick={() => setNewDecision(d.value)} style={{
              padding:"10px 8px", borderRadius:9, cursor:"pointer",
              background: newDecision===d.value ? `${d.color}20` : C.s2,
              border:`1px solid ${newDecision===d.value ? d.color : C.border}`,
              color: newDecision===d.value ? d.color : C.text2,
              fontSize:12, fontWeight:600, transition:"all .15s",
              display:"flex", alignItems:"center", gap:6,
            }}>{d.icon}{d.label}</button>
          ))}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder={t.commentPlaceholder} rows={3}
          style={{ width:"100%", padding:"10px 12px", background:C.s2,
            border:`1px solid ${C.border}`, borderRadius:9, color:C.text,
            fontSize:13, outline:"none", resize:"vertical",
            fontFamily:"'IBM Plex Sans',sans-serif", boxSizing:"border-box", marginBottom:12 }} />
        {error && <div style={{ color:C.red, fontSize:12, marginBottom:10,
          display:"flex", alignItems:"center", gap:5 }}>
          <AlertTriangle size={11}/>{error}
        </div>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", background:C.s2,
            border:`1px solid ${C.border}`, color:C.text2, borderRadius:9, cursor:"pointer", fontSize:13 }}>
            {t.cancelBtn}
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex:1, padding:"10px",
            background:`linear-gradient(135deg,${selected?.color||C.orange},${C.purple})`,
            border:"none", color:"white", borderRadius:9, cursor:"pointer",
            fontSize:13, fontWeight:700, display:"flex", alignItems:"center",
            justifyContent:"center", gap:6,
          }}>
            <CheckCircle size={13}/>{saving ? t.savingBtn : t.updateBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditTrailPage() {
  const [decisions,    setDecisions]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("ALL");

  const [search,       setSearch]       = useState("");
  const [editing,      setEditing]      = useState(null);
  const [companyName,  setCompanyName]  = useState("RiskLens");

  const { lang } = useLang();
  const t = staticContent2.audit[lang];
  const filterLabel =
  filter === "ALL"
    ? t.filters.find(f => f.value === "ALL")?.label
    : t.decisionCFG[filter]?.label || filter;

  const userCanEdit = canEdit();

  useEffect(() => {
    fetchAll();
    // جيب اسم الشركة لو مش سوبر ادمن
    if (!isSuperAdmin()) {
      fetch(`${API_V1}/dashboard`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.companyName) setCompanyName(data.companyName); })
        .catch(() => {});
    }
    window.addEventListener("focus", fetchAll);
    return () => window.removeEventListener("focus", fetchAll);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [decRes, statsRes] = await Promise.all([
        fetch(`${API}/all`,   { headers: authHeaders() }),
        fetch(`${API}/stats`, { headers: authHeaders() }),
      ]);
      if (decRes.ok)   setDecisions(await decRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaved = (updated) =>
    setDecisions(prev => prev.map(d => d.id === updated.id ? updated : d));

  const filtered = decisions.filter(d => {
    const matchFilter = filter === "ALL" || d.decision === filter;
    const matchSearch = !search.trim() ||
      d.decidedBy?.toLowerCase().includes(search.toLowerCase()) ||
      d.subjectName?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  
  const exportReport = () => {
    const userName = localStorage.getItem("username") || "—";
    const now = new Date().toLocaleDateString("en-GB", {
      year:"numeric", month:"long", day:"numeric",
      hour:"2-digit", minute:"2-digit"
    });

    const DC = {
      TRUE_MATCH: {
        color:"#ef4444",
        label:t.decisionCFG.TRUE_MATCH.label
      },
      FALSE_POSITIVE: {
        color:"#10b981",
        label:t.decisionCFG.FALSE_POSITIVE.label
      },
      PENDING_REVIEW: {
        color:"#f59e0b",
        label:t.decisionCFG.PENDING_REVIEW.label
      },
      RISK_ACCEPTED: {
        color:"#8b5cf6",
        label:t.decisionCFG.RISK_ACCEPTED.label
      },
    };

    const rows = filtered.map((d, i) => {
      const dc = DC[d.decision] || { color:"#7a8fa8", label: d.decision };
      return `
        <tr style="border-bottom:1px solid #e5e7eb;${i%2===0?'background:#f9fafb':'background:#ffffff'}">
          <td style="padding:10px 14px;color:#9ca3af;font-size:12px;text-align:center;">${i+1}</td>
          <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#1e3a5f;">${d.screeningType === 'PERSON' ? t.typeCfg.PERSON.label : d.screeningType === 'TRANSFER' ? t.typeCfg.TRANSFER.label : (d.screeningType || "—")}</td>          
          <td style="padding:10px 14px;font-size:12px;color:#2563eb;font-family:monospace;font-weight:600;">#${d.screeningId}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#111827;">${d.subjectName||"—"}</td>
          <td style="padding:10px 14px;">
            <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;
              font-weight:700;white-space:nowrap;background:${dc.color}18;color:${dc.color};
              border:1px solid ${dc.color}44;">
              ${dc.label}
            </span>
          </td>
          <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#374151;">${d.decidedBy||"—"}</td>
          <td style="padding:10px 14px;font-size:12px;color:#6b7280;font-style:${d.comment?'normal':'italic'};">
            ${d.comment||"—"}
          </td>
          <td style="padding:10px 14px;font-size:11px;color:#6b7280;white-space:nowrap;font-family:monospace;">
            ${d.decidedAt ? new Date(d.decidedAt).toLocaleString("en-GB") : "—"}
          </td>
        </tr>`;
    }).join("");

    const statCards = stats ? [
      {
        label: lang === "ar" ? "إجمالي القرارات" : "Total Decisions",
        value: stats.total,
        color:"#1e3a5f"
      },
      {
        label:t.decisionCFG.TRUE_MATCH.label,
        value:stats.trueMatches,
        color:"#ef4444"
      },
      {
        label:t.decisionCFG.FALSE_POSITIVE.label,
        value:stats.falsePositives,
        color:"#10b981"
      },
      {
        label:t.decisionCFG.PENDING_REVIEW.label,
        value:stats.pendingReview,
        color:"#f59e0b"
      },
      {
        label:t.decisionCFG.RISK_ACCEPTED.label,
        value:stats.riskAccepted,
        color:"#8b5cf6"
      },
].map(s => `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;
        padding:18px 20px;text-align:center;border-top:4px solid ${s.color};
        box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <div style="font-size:30px;font-weight:800;color:${s.color};line-height:1;">${s.value}</div>
        <div style="font-size:10px;color:#6b7280;font-weight:700;margin-top:6px;
          text-transform:uppercase;letter-spacing:0.8px;">${s.label}</div>
      </div>`).join("") : "";

    const html = `
    <!DOCTYPE html>
      <html dir="${lang === "ar" ? "rtl" : "ltr"}">
        <head>
          <meta charset="UTF-8"/>
          <title>${t.export.reportTitle} — ${companyName}</title>
          <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#f1f5f9;}
            table{border-collapse:collapse;width:100%;}
            @media print{
              .no-print{display:none!important;}
              body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
              .page{box-shadow:none!important;margin:0!important;border-radius:0!important;}
            }
          </style>
        </head>
        <body>

          <!-- Top Bar -->
          <div class="no-print" style="background:#0D2137;padding:14px 40px;
            display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:8px;height:8px;border-radius:50%;background:#00d4ff;"></div>
              <span style="color:white;font-weight:700;font-size:14px;">RiskLens · ${t.export.reportTitle}</span>
            </div>
            <button onclick="window.print()"
              style="padding:10px 28px;background:linear-gradient(135deg,#00d4ff,#8b5cf6);
                color:#060912;border:none;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer;">
              🖨️ ${t.export.printBtn}
            </button>
          </div>

          <div class="page" style="max-width:1100px;margin:32px auto;background:#fff;
            border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

            <!-- Header Banner -->
            <div style="background:linear-gradient(135deg,#0D2137 0%,#1B4F8A 55%,#1a5298 100%);
              padding:44px 48px;color:white;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;
                flex-wrap:wrap;gap:24px;">
                <div>
                  <div style="font-size:10px;letter-spacing:3px;opacity:0.55;margin-bottom:10px;
                    text-transform:uppercase;font-weight:600;">
                    ${t.export.confidential}
                  </div>
                  <div style="font-size:36px;font-weight:900;margin-bottom:8px;letter-spacing:-1px;
                    line-height:1;">${t.export.reportTitle}</div>
                  <div style="font-size:18px;opacity:0.9;font-weight:600;margin-bottom:12px;">
                    ${companyName}
                  </div>
                  <div style="display:inline-block;padding:5px 16px;
                    background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
                    border-radius:20px;font-size:11px;opacity:0.85;letter-spacing:0.5px;">
                    ${t.export.screeningDecisions}
                  </div>
                </div>
                <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
                  border-radius:12px;padding:16px 20px;font-size:12px;line-height:2.2;min-width:220px;">
                  <div style="display:flex;justify-content:space-between;gap:16px;">
                    <span style="opacity:0.65;font-weight:600;">${t.export.generatedBy}</span>
                    <strong>${userName}</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:16px;">
                    <span style="opacity:0.65;font-weight:600;">${t.export.generatedAt}</span>
                    <strong>${now}</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:16px;">
                    <span style="opacity:0.65;font-weight:600;">${t.export.filterApplied}</span>
                    <strong>${filterLabel}</strong>
                    
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:16px;">
                    <span style="opacity:0.65;font-weight:600;">${t.export.totalRecords}</span>
                    <strong style="color:#00d4ff;">${filtered.length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style="padding:36px 48px;">

              <!-- Decision Summary -->
              ${stats ? `
              <div style="margin-bottom:32px;">
                <div style="font-size:11px;font-weight:800;color:#6b7280;margin-bottom:14px;
                  text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;">
                  <div style="width:20px;height:2px;background:#1B4F8A;border-radius:2px;"></div>
                  ${t.export.decisionSummary}
                </div>
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;">
                  ${statCards}
                </div>
              </div>` : ""}

              <!-- Table -->
              <div style="margin-bottom:32px;">
                <div style="font-size:11px;font-weight:800;color:#6b7280;margin-bottom:14px;
                  text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;">
                  <div style="width:20px;height:2px;background:#1B4F8A;border-radius:2px;"></div>
                  ${t.export.screeningDecisions}
                </div>
                <div style="border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;
                  box-shadow:0 1px 4px rgba(0,0,0,0.05);">
                  <table>
                    <thead>
                      <tr style="background:linear-gradient(135deg,#0D2137,#1B4F8A);">
                        ${t.export.tableHeaders.map(h =>
                          `<th style="padding:13px 14px;text-align:left;font-size:10px;font-weight:700;
                            color:rgba(255,255,255,0.8);letter-spacing:0.8px;text-transform:uppercase;
                            white-space:nowrap;">${h}</th>`
                        ).join("")}
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>
                </div>
              </div>

              <!-- Footer -->
              <div style="border-top:1px solid #e5e7eb;padding-top:20px;
                display:flex;justify-content:space-between;align-items:center;
                flex-wrap:wrap;gap:10px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:6px;height:6px;border-radius:50%;background:#00d4ff;"></div>
                  <span style="font-size:11px;color:#9ca3af;font-weight:600;">
                    ${t.export.footerText}
                  </span>
                </div>
                <span style="font-size:11px;color:#9ca3af;font-style:italic;">
                  ${t.export.footerNote}
                </span>
              </div>

            </div>
          </div>

        </body>
      </html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .at-filter:hover{border-color:rgba(0,212,255,0.3)!important;color:#e2e8f0!important;}
        .at-edit:hover{background:rgba(245,158,11,0.15)!important;border-color:rgba(245,158,11,0.4)!important;color:#f59e0b!important;}
        .at-row:hover{background:rgba(0,212,255,0.03)!important;}
        .at-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:18px;}
        .at-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
        @media(max-width:768px){
          .at-desktop{display:none!important;}
          .at-mobile{display:block!important;}
          .at-stats{grid-template-columns:repeat(3,1fr)!important;}
        }
        @media(min-width:769px){
          .at-mobile{display:none!important;}
          .at-desktop{display:grid!important;}
        }
      `}</style>

      <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", animation:"fadeUp .4s ease" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:20, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:4, height:36, background:`linear-gradient(180deg,${C.cyan},${C.purple})`, borderRadius:2 }} />
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.text }}>
                {t.pageTitle}
              </h2>
              <p style={{ margin:0, fontSize:11, color:C.text2, marginTop:2 }}>
                {isSuperAdmin() ? t.subtitleSuper : t.subtitleAdmin}
              </p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={exportReport} disabled={filtered.length === 0}
              style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)",
                color:"#10b981", padding:"8px 14px", borderRadius:9, cursor:"pointer", fontSize:13,
                display:"flex", alignItems:"center", gap:6, opacity: filtered.length===0 ? 0.4 : 1 }}>
              <Download size={13}/> {t.exportBtn}
            </button>
            <button onClick={fetchAll}
              style={{ background:C.s2, border:`1px solid ${C.border}`,
                color:C.text2, padding:"8px 14px", borderRadius:9, cursor:"pointer", fontSize:13,
                display:"flex", alignItems:"center", gap:6 }}>
              <RefreshCw size={13}/> {t.refreshBtn}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="at-stats">
            {t.statsLabels.map(s => (
              <div key={s.key} style={{ background:C.s1, border:`1px solid ${s.color}22`,
                borderRadius:10, padding:"12px 14px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.color, opacity:.6 }} />
                <div style={{ fontSize:10, color:C.text2, fontWeight:700, textTransform:"uppercase",
                  letterSpacing:"0.4px", marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{color:s.color,opacity:.7}}>{s.icon}</span>{s.label}
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:s.color,
                  fontFamily:"'JetBrains Mono',monospace" }}>{stats[s.key] ?? 0}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="at-filters">
          {t.filters.map(f => (
            <button key={f.value} className="at-filter" onClick={() => setFilter(f.value)} style={{
              padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600,
              background: filter===f.value ? `${f.color}15` : C.s2,
              border:`1px solid ${filter===f.value ? f.color : C.border}`,
              color: filter===f.value ? f.color : C.text2, transition:"all .15s",
              display:"flex", alignItems:"center", gap:5,
            }}>{f.icon}{f.label}</button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={{ marginLeft:"auto", padding:"7px 12px", background:C.s2,
              border:`1px solid ${C.border}`, borderRadius:9, color:C.text,
              fontSize:13, outline:"none", fontFamily:"'IBM Plex Sans',sans-serif", minWidth:160 }} />
        </div>

        {/* Table */}
        <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ height:2, background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />

          <div className="at-desktop" style={{
            gridTemplateColumns: userCanEdit
              ? "50px 100px 90px 200px 150px 1fr 150px 160px 60px"
              : "50px 100px 90px 200px 150px 1fr 150px 160px",
            padding:"10px 16px", borderBottom:`1px solid ${C.border}`,
            fontSize:10, color:C.text2, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>
            {t.tableHeaders.map((h) => (
              <span key={h}>{h}</span>
            ))}
            {userCanEdit && <span></span>}
          </div>

          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ width:28, height:28, border:`3px solid ${C.border}`,
                borderTop:`3px solid ${C.cyan}`, borderRadius:"50%",
                animation:"spin 1s linear infinite", display:"inline-block" }} />
            </div>
          )}

          {!loading && filtered.map((d, i) => {
            const dc = t.decisionCFG[d.decision]  || t.decisionCFG.PENDING_REVIEW;
            const tc = t.typeCfg[d.screeningType] || t.typeCfg.PERSON;
            const isPending = d.decision === "PENDING_REVIEW";
            return (
              <div key={d.id}>
                {/* Desktop */}
                <div className="at-desktop at-row" style={{
                  gridTemplateColumns: userCanEdit
                    ? "50px 100px 90px 200px 150px 1fr 150px 160px 60px"
                    : "50px 100px 90px 200px 150px 1fr 150px 160px",
                  padding:"12px 16px", borderBottom:`1px solid ${C.border}`,
                  transition:"background .15s", alignItems:"center",
                  background: isPending ? "rgba(245,158,11,0.02)" : "transparent",
                  animation:`fadeUp .3s ease ${i*.03}s both`,
                }}>
                  <span style={{ fontSize:11, color:C.text2, fontFamily:"'JetBrains Mono',monospace" }}>#{d.id}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ color:tc.color }}>{tc.icon}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:tc.color,
                      fontFamily:"'JetBrains Mono',monospace" }}>{d.screeningType == 'PERSON' ? t.typeCfg.PERSON.label : t.typeCfg.TRANSFER.label}</span>
                  </div>
                  <span style={{ fontSize:11, color:C.cyan, fontFamily:"'JetBrains Mono',monospace" }}>#{d.screeningId}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:C.text,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                    title={d.subjectName}>{d.subjectName || "—"}</span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                    padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                    fontFamily:"'JetBrains Mono',monospace", width:"fit-content",
                    background:dc.bg, color:dc.color, border:`1px solid ${dc.color}44` }}>
                    {dc.icon} {dc.label}
                  </span>
                  <span style={{ fontSize:12, color:C.text2, overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.comment || "—"}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:22, height:22, borderRadius:6, flexShrink:0,
                      background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.2)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, color:C.cyan, fontWeight:700 }}>
                      {d.decidedBy?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:C.text,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.decidedBy}</span>
                  </div>
                  <span style={{ fontSize:10, color:C.text2, fontFamily:"'JetBrains Mono',monospace" }}>
                    {d.decidedAt ? new Date(d.decidedAt).toLocaleString() : "—"}
                  </span>
                  {userCanEdit && (
                    <button className="at-edit" onClick={() => setEditing(d)} style={{
                      padding:"5px 7px", borderRadius:7, cursor:"pointer",
                      background: isPending ? "rgba(245,158,11,0.1)" : "transparent",
                      border:`1px solid ${isPending ? "rgba(245,158,11,0.3)" : C.border}`,
                      color: isPending ? C.orange : C.text2, transition:"all .15s",
                      display:"flex", alignItems:"center",
                    }}>
                      {isPending ? <Clock size={12}/> : <Edit2 size={12}/>}
                    </button>
                  )}
                </div>

                {/* Mobile */}
                <div className="at-mobile" style={{
                  padding:"14px 16px", borderBottom:`1px solid ${C.border}`,
                  background: isPending ? "rgba(245,158,11,0.02)" : "transparent",
                  animation:`fadeUp .3s ease ${i*.03}s both`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{color:tc.color}}>{tc.icon}</span>
                        {d.subjectName || `#${d.screeningId}`}
                      </div>
                      <div style={{ fontSize:10, color:C.text2, marginTop:2,
                        fontFamily:"'JetBrains Mono',monospace" }}>
                        #{d.id} · {tc.label}
                      </div>
                    </div>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                      padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                      fontFamily:"'JetBrains Mono',monospace", flexShrink:0, marginLeft:8,
                      background:dc.bg, color:dc.color, border:`1px solid ${dc.color}44` }}>
                      {dc.icon} {dc.label}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:22, height:22, borderRadius:6,
                        background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.2)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, color:C.cyan, fontWeight:700 }}>
                        {d.decidedBy?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize:12, color:C.text }}>{d.decidedBy}</span>
                    </div>
                    <span style={{ fontSize:10, color:C.text2, fontFamily:"'JetBrains Mono',monospace" }}>
                      {d.decidedAt ? new Date(d.decidedAt).toLocaleDateString() : "—"}
                    </span>
                    {userCanEdit && (
                      <button className="at-edit" onClick={() => setEditing(d)} style={{
                        padding:"5px 10px", borderRadius:7, cursor:"pointer", fontSize:11,
                        background: isPending ? "rgba(245,158,11,0.1)" : C.s2,
                        border:`1px solid ${isPending ? "rgba(245,158,11,0.3)" : C.border}`,
                        color: isPending ? C.orange : C.text2, transition:"all .15s",
                        display:"flex", alignItems:"center", gap:4,
                      }}>
                        {isPending
                          ? <><Clock size={11}/> {t.editBtn}</>
                          : <><Edit2 size={11}/> {t.editBtn}</>
                        }
                      </button>
                    )}
                  </div>
                  {d.comment && (
                    <div style={{ marginTop:7, fontSize:12, color:C.text2,
                      background:C.s2, padding:"6px 10px", borderRadius:7, border:`1px solid ${C.border}` }}>
                      "{d.comment}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:C.text2, fontSize:14 }}>
              {search
                ? `${t.noResultsFor} "${search}"`
                : t.noDecisions
              }
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`,
              fontSize:12, color:C.text2, display:"flex", justifyContent:"space-between",
              flexWrap:"wrap", gap:6 }}>
              <span>{t.showingOf} {filtered.length} {t.ofLabel} {decisions.length}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color:C.cyan }}>
                {filterLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {editing && userCanEdit && (
        <EditModal decision={editing} onClose={() => setEditing(null)} onSaved={handleSaved} t={t}/>
      )}
    </Layout>
  );
}