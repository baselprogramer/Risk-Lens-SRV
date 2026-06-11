import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { createScreeningRequest } from "../services/screeningService";
import { getPersonDetails } from "../services/searchService";
import { API_V1 as API } from "../config/api";
import {
  Shield, Search, Clock, AlertTriangle, CheckCircle,
  XCircle, Scale, ChevronUp, Eye, User, ChevronDown,
} from "lucide-react";
import { useLang } from "../context/LangContext";
import { staticContent } from "../locales/content";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

const fetchDetailsBatch = async (ids, sources) => {
  const res = await fetch(
    `${API}/search/details/batch?ids=${ids.join(",")}&sources=${sources.join(",")}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("batch failed");
  return res.json();
};

const isAdmin = () =>
  ["SUPER_ADMIN", "COMPANY_ADMIN"].includes(localStorage.getItem("role") || "");

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  orange:"#f59e0b", red:"#ef4444", text:"#e2e8f0", text2:"#7a8fa8",
  pepColor:"#a78bfa",
};

const NATIONALITIES = [
  { code:"SY", label:"سوري" },{ code:"IQ", label:"عراقي" },
  { code:"JO", label:"أردني" },{ code:"LB", label:"لبناني" },
  { code:"EG", label:"مصري" },{ code:"SA", label:"سعودي" },
  { code:"AE", label:"إماراتي" },{ code:"TR", label:"تركي" },
  { code:"IR", label:"إيراني" },{ code:"RU", label:"روسي" },
  { code:"UA", label:"أوكراني" },{ code:"BY", label:"بيلاروسي" },
  { code:"KZ", label:"كازاخستاني" },{ code:"OTHER", label:"أخرى" },
];

const ID_TYPES = [
  { value:"NATIONAL_ID", label:"هوية وطنية" },
  { value:"PASSPORT",    label:"جواز سفر"   },
  { value:"RESIDENCE",   label:"إقامة"       },
];

function getRiskConfig(r) {
  switch (r) {
    case "CRITICAL": return { color:C.red,    bg:"rgba(239,68,68,0.12)",  icon:<AlertTriangle size={16}/> };
    case "HIGH":     return { color:C.orange, bg:"rgba(245,158,11,0.12)", icon:<AlertTriangle size={16}/> };
    case "MEDIUM":   return { color:C.cyan,   bg:"rgba(0,212,255,0.10)",  icon:<Shield size={16}/>        };
    case "LOW":      return { color:C.green,  bg:"rgba(16,185,129,0.10)", icon:<CheckCircle size={16}/>   };
    case "VERY_LOW": return { color:C.green,  bg:"rgba(16,185,129,0.08)", icon:<CheckCircle size={16}/>   };
    default:         return { color:C.text2,  bg:"rgba(122,143,168,0.1)", icon:<Shield size={16}/>        };
  }
}

function getSourceColor(s) {
  switch ((s||"").split("|")[0].trim()) {
    case "OFAC":  return C.red;
    case "EU":    return C.purple;
    case "UN":    return C.orange;
    case "UK":    return C.cyan;
    case "LOCAL": return C.green;
    case "PEP":   return C.pepColor;
    default:      return C.text2;
  }
}

function normalizeAliases(aliases) {
  if (!aliases) return [];
  if (typeof aliases === "string") {
    try { aliases = JSON.parse(aliases); } catch { aliases = [aliases]; }
  }
  if (!Array.isArray(aliases)) aliases = [aliases];
  return aliases.flatMap(alias => {
    if (!alias) return [];
    if (typeof alias === "object") {
      const v = alias.wholeName || alias.lastName || alias.name
        || Object.values(alias).find(v => typeof v === "string" && v.trim());
      return v ? [v.trim()] : [];
    }
    return [alias.trim()];
  }).filter(Boolean);
}

function normalizeDOB(dobs) {
  if (!dobs) return [];
  if (typeof dobs === "string") {
    try { dobs = JSON.parse(dobs); } catch { return [dobs]; }
  }
  if (Array.isArray(dobs)) return dobs.map(d =>
    typeof d === "string" ? d : d.dateOfBirth || d.year || JSON.stringify(d)
  ).filter(Boolean);
  return [String(dobs)];
}

function normalizeNationality(n) {
  if (!n) return [];
  if (typeof n === "string") {
    try { n = JSON.parse(n); } catch { return [n]; }
  }
  if (Array.isArray(n)) return n.map(x =>
    typeof x === "string" ? x : x.country || x.nationality || x.value || JSON.stringify(x)
  ).filter(Boolean);
  return [String(n)];
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:"block", marginBottom:5, fontSize:11, fontWeight:600,
        color:C.text2, textTransform:"uppercase", letterSpacing:"0.5px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", padding:"10px 12px", background:C.s2,
  border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.text,
  outline:"none", boxSizing:"border-box",
  fontFamily:"'IBM Plex Sans',sans-serif", transition:"border-color .2s",
};
const selectStyle = { ...inputStyle, cursor:"pointer" };

// ── Details Modal ─────────────────────────────────────────────────────────────
function DetailsModal({ match, onClose, t }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const srcColor        = getSourceColor(match.source);
  const allSources      = (match.source || "").split("|").map(s => s.trim()).filter(Boolean);
  const sanctionSources = allSources.filter(s => s !== "PEP");
  const hasPep          = allSources.includes("PEP") || match.pep === true;
  const isPepOnly       = match.pep === true && match.source === "PEP";

  const buildSections = async () => {
    if (isPepOnly) return { sections: [], hasPep };

    let refs = null;
    if (match.sanctionRefs) {
      try {
        refs = typeof match.sanctionRefs === "string"
             ? JSON.parse(match.sanctionRefs) : match.sanctionRefs;
      } catch { refs = null; }
    }

    let pairs = [];
    if (refs && sanctionSources.length > 0) {
      pairs = sanctionSources
        .map(s => ({ src: s, id: refs[s.toUpperCase()] }))
        .filter(p => p.id);
      if (pairs.length === 0) {
        const firstId = Object.values(refs)[0];
        if (firstId) pairs = sanctionSources.map(s => ({ src: s, id: firstId }));
      }
    }
    if (pairs.length === 0) {
      const targetId = match.sanctionId || match.id;
      if (targetId) pairs = sanctionSources.map(s => ({ src: s, id: targetId }));
    }
    if (pairs.length === 0) return { sections: [], hasPep };

    let rawResults;
    try {
      rawResults = await fetchDetailsBatch(pairs.map(p => p.id), pairs.map(p => p.src));
    } catch {
      rawResults = await Promise.all(
        pairs.map(p => getPersonDetails(p.id, p.src).catch(() => null))
      );
    }

    const items = rawResults.map(d => {
      if (!d) return null;
      if (Array.isArray(d)) return d[0] || null;
      return d;
    });

    const fallbackItem = items.find(Boolean) || null;
    const sections = pairs.map((pair, idx) => ({
      label: pair.src,
      item:  items[idx] || fallbackItem,
    })).filter(s => s.item !== null);

    return { sections, hasPep };
  };

  useEffect(() => {
    buildSections()
      .then(setDetails)
      .catch(() => setDetails({ sections: [], hasPep }))
      .finally(() => setLoading(false));
  }, [match]);

  const renderRow = (label, value) => (
    <div key={label} style={{ display:"grid", gridTemplateColumns:"120px 1fr",
      gap:10, padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:11, color:C.text2, fontWeight:600,
        textTransform:"uppercase", letterSpacing:"0.4px", paddingTop:2 }}>{label}</div>
      <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{value || "—"}</div>
    </div>
  );

  const renderEntityFields = (item) => (
    <div style={{ padding:"2px 0" }}>
      {renderRow(t.detailsFields.fullName,    item?.name || match.matchedName)}
      {renderRow(t.detailsFields.aliases,     normalizeAliases(item?.aliases).join(" · ") || "—")}
      {renderRow(t.detailsFields.dob,         normalizeDOB(item?.dateOfBirth).join(", ") || "—")}
      {renderRow(t.detailsFields.nationality, normalizeNationality(item?.nationality).join(", ") || "—")}
      {renderRow(t.detailsFields.program,     item?.program || "—")}
      {renderRow(t.detailsFields.remarks,     item?.remarks || "—")}
    </div>
  );

  const renderPepSection = () => (
    <div style={{ marginTop:14, background:"rgba(167,139,250,0.08)",
      border:"1px solid rgba(167,139,250,0.3)", borderRadius:12, padding:"14px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <User size={15} color={C.pepColor}/>
        <span style={{ fontSize:13, fontWeight:700, color:C.pepColor }}>
          {t.detailsPepTitle}
        </span>
      </div>
      <div style={{ padding:"0 2px" }}>
        {renderRow(t.detailsFields.description, match.notes || "—")}
        {match.wikidataId && renderRow(t.detailsFields.wikidataId,
          <a href={`https://www.wikidata.org/wiki/${match.wikidataId}`}
            target="_blank" rel="noreferrer"
            style={{ color:C.cyan, textDecoration:"none" }}>
            {match.wikidataId} ↗
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(6,9,18,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1001,
      backdropFilter:"blur(8px)", padding:"16px" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:C.s1, border:`1px solid ${C.border}`, borderRadius:18,
        width:"100%", maxWidth:560, maxHeight:"88vh", overflowY:"auto",
        boxShadow:"0 32px 80px rgba(0,0,0,0.7)", animation:"fadeUp .25s ease" }}>

        <div style={{ height:3,
          background:`linear-gradient(90deg,${srcColor},${C.purple})`,
          borderRadius:"18px 18px 0 0" }} />

        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:4, height:28,
                background:`linear-gradient(180deg,${srcColor},${C.purple})`, borderRadius:2 }} />
              <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:C.text }}>
                {t.detailsTitle}
              </h2>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              {allSources.map(s => (
                <span key={s} style={{
                  background:`${getSourceColor(s)}20`, color:getSourceColor(s),
                  border:`1px solid ${getSourceColor(s)}44`,
                  padding:"2px 9px", borderRadius:6, fontSize:10, fontWeight:700,
                  fontFamily:"'JetBrains Mono',monospace" }}>{s}</span>
              ))}
              <button onClick={onClose} style={{ background:"none", border:"none",
                color:C.text2, cursor:"pointer", padding:4, marginLeft:4 }}>
                <XCircle size={18}/>
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ width:28, height:28, border:`3px solid ${C.border}`,
                borderTop:`3px solid ${C.cyan}`, borderRadius:"50%",
                animation:"spin 1s linear infinite", display:"inline-block" }} />
              <p style={{ marginTop:10, color:C.text2, fontSize:12 }}>{t.detailsFetching}</p>
            </div>
          )}

          {!loading && details && (
            <div>
              {isPepOnly && (
                <div style={{ background:"rgba(167,139,250,0.1)",
                  border:"1px solid rgba(167,139,250,0.3)", borderRadius:12,
                  padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
                  marginBottom:16 }}>
                  <User size={22} color={C.pepColor}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.pepColor }}>
                      {t.detailsPepTitle}
                    </div>
                    <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>
                      {t.detailsPepSource}
                    </div>
                  </div>
                </div>
              )}

              {details.sections.map((section, idx) => {
                const sColor = getSourceColor(section.label);
                return (
                  <div key={`${section.label}-${idx}`} style={{
                    border:`1px solid ${C.border}`, borderLeft:`3px solid ${sColor}`,
                    borderRadius:12, padding:"14px 16px", marginBottom:12,
                    background:"rgba(255,255,255,0.015)" }}>
                    <div style={{ display:"inline-flex", alignItems:"center",
                      gap:6, marginBottom:12, background:`${sColor}18`,
                      border:`1px solid ${sColor}44`, padding:"4px 12px", borderRadius:8,
                      fontSize:11, fontWeight:700,
                      fontFamily:"'JetBrains Mono',monospace", color:sColor }}>
                      {section.label}
                    </div>
                    {renderEntityFields(section.item)}
                  </div>
                );
              })}

              {details.sections.length === 0 && !isPepOnly && !hasPep && (
                <div style={{ textAlign:"center", padding:"20px 0", color:C.text2, fontSize:13 }}>
                  {t.detailsNoSanction}
                </div>
              )}

              {hasPep && renderPepSection()}
            </div>
          )}

          {!loading && !details && (
            <div style={{ textAlign:"center", padding:"20px 0", color:C.text2, fontSize:13 }}>
              {t.detailsNone}
            </div>
          )}

          <button onClick={onClose} style={{ marginTop:18, width:"100%",
            background:`linear-gradient(135deg,${C.red},#dc2626)`, color:"white",
            padding:"11px", border:"none", borderRadius:10, fontSize:13, fontWeight:700,
            cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", gap:6 }}>
            <XCircle size={14}/> {t.detailsClose}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Decision Modal ────────────────────────────────────────────────────────────
function DecisionModal({ resultId, onClose, onSaved, t }) {
  const [decision, setDecision] = useState("");
  const [comment,  setComment]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const handleSave = async () => {
    if (!decision) { setError(t.decisionSelectError); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/decisions`, {
        method:"POST", headers:authHeaders(),
        body:JSON.stringify({ screeningType:"PERSON", screeningId:resultId, decision, comment }),
      });
      if (!res.ok) throw new Error("Failed");
      onSaved(await res.json()); onClose();
    } catch { setError(t.decisionSaveError); }
    finally  { setSaving(false); }
  };

  const selected = t.decisions.find(d => d.value === decision);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:"16px" }}>
      <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:16,
        padding:"24px", width:"100%", maxWidth:420, position:"relative",
        overflow:"hidden", animation:"fadeUp .25s ease" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4,
          display:"flex", alignItems:"center", gap:8 }}>
          <Scale size={15} color={C.cyan}/> {t.decisionModalTitle}
        </div>
        <div style={{ fontSize:12, color:C.text2, marginBottom:16 }}>
          {t.decisionModalSubtitle}{resultId}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {t.decisions.map(d => (
            <button key={d.value} onClick={() => setDecision(d.value)} style={{
              padding:"9px 8px", borderRadius:9, cursor:"pointer",
              background: decision===d.value ? `${d.color}20` : C.s2,
              border:`1px solid ${decision===d.value ? d.color : C.border}`,
              color: decision===d.value ? d.color : C.text2,
              fontSize:12, fontWeight:600, transition:"all .15s",
              display:"flex", alignItems:"center", gap:6,
            }}>{d.icon}{d.label}</button>
          ))}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder={t.decisionCommentPlaceholder} rows={2}
          style={{ width:"100%", padding:"9px 12px", background:C.s2,
            border:`1px solid ${C.border}`, borderRadius:9, color:C.text,
            fontSize:13, outline:"none", resize:"none",
            fontFamily:"'IBM Plex Sans',sans-serif",
            boxSizing:"border-box", marginBottom:12 }} />
        {error && <div style={{ color:C.red, fontSize:12, marginBottom:8,
          display:"flex", alignItems:"center", gap:5 }}>
          <AlertTriangle size={12}/>{error}
        </div>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", background:C.s2,
            border:`1px solid ${C.border}`, color:C.text2, borderRadius:9,
            cursor:"pointer", fontSize:13 }}>{t.decisionCancel}</button>
          <button onClick={handleSave} disabled={saving||!decision} style={{
            flex:1, padding:"9px",
            background: decision
              ? `linear-gradient(135deg,${selected?.color||C.cyan},${C.purple})` : C.s2,
            border:"none", color: decision ? "white" : C.text2,
            borderRadius:9, cursor: decision ? "pointer" : "not-allowed",
            fontSize:13, fontWeight:700,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
            <CheckCircle size={13}/>{saving ? t.decisionSaving : t.decisionSave}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── My History Tab ────────────────────────────────────────────────────────────
function MyHistoryTab({ t }) {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [audits,   setAudits]   = useState({});

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/screening/my-history`, { headers: authHeaders() });
      if (res.ok) setHistory(await res.json());
    } catch { }
    finally { setLoading(false); }
  };

  const fetchAudit = async (screeningId) => {
    if (audits[screeningId]) {
      setExpanded(expanded === screeningId ? null : screeningId); return;
    }
    try {
      const res = await fetch(`${API}/decisions/PERSON/${screeningId}/audit`,
        { headers: authHeaders() });
      if (res.ok) {
        setAudits(prev => ({ ...prev, [screeningId]: [] }));
        res.json().then(data => setAudits(prev => ({ ...prev, [screeningId]: data })));
        setExpanded(screeningId);
      }
    } catch { }
  };

  if (loading) return (
    <div style={{ textAlign:"center", padding:"50px 0" }}>
      <div style={{ width:28, height:28, border:`3px solid ${C.border}`,
        borderTop:`3px solid ${C.cyan}`, borderRadius:"50%",
        animation:"spin 1s linear infinite", display:"inline-block" }} />
    </div>
  );
  if (history.length===0) return (
    <div style={{ textAlign:"center", padding:"50px 0", color:C.text2, fontSize:14 }}>
      {t.noHistory}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {history.map((item, i) => {
        const risk   = getRiskConfig(item.riskLevel);
        const dc     = item.latestDecision ? t.decisionCFG[item.latestDecision.decision] : null;
        const isOpen = expanded===item.id;
        const trail  = audits[item.id]||[];
        return (
          <div key={item.id} style={{ background:C.s1, border:`1px solid ${C.border}`,
            borderRadius:14, overflow:"hidden",
            animation:`fadeUp .3s ease ${i*.04}s both` }}>
            <div style={{ height:2, background:`linear-gradient(90deg,${risk.color},${C.purple})` }} />
            <div style={{ padding:"14px 16px", display:"flex", alignItems:"center",
              justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {item.fullName||"—"}
                </div>
                <div style={{ fontSize:10, color:C.text2, marginTop:2,
                  fontFamily:"'JetBrains Mono',monospace" }}>
                  #{item.id} {item.createdBy && <>· {item.createdBy}</>}
                </div>
              </div>
              <span style={{ padding:"3px 9px", borderRadius:7, fontSize:10, fontWeight:700,
                fontFamily:"'JetBrains Mono',monospace", background:risk.bg, color:risk.color,
                border:`1px solid ${risk.color}33`, whiteSpace:"nowrap",
                display:"flex", alignItems:"center", gap:4 }}>
                {risk.icon} {item.riskLevel}
              </span>
              {dc ? (
                <span style={{ padding:"3px 9px", borderRadius:7, fontSize:10,
                  fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                  background:dc.bg, color:dc.color, border:`1px solid ${dc.color}44`,
                  whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}>
                  {dc.icon} {dc.label}
                </span>
              ) : (
                <span style={{ padding:"3px 9px", borderRadius:7, fontSize:10,
                  color:C.text2, background:C.s2, border:`1px solid ${C.border}`,
                  whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}>
                  <Clock size={10}/> {t.noDecision}
                </span>
              )}
              <button onClick={() => fetchAudit(item.id)} style={{
                background: isOpen ? "rgba(0,212,255,0.1)" : C.s2,
                border:`1px solid ${isOpen ? C.cyan : C.border}`,
                color: isOpen ? C.cyan : C.text2,
                padding:"5px 10px", borderRadius:8, cursor:"pointer",
                fontSize:11, fontWeight:600, transition:"all .15s", whiteSpace:"nowrap",
                display:"flex", alignItems:"center", gap:4 }}>
                {isOpen
                  ? <><ChevronUp size={12}/> {t.hideBtn}</>
                  : <><Clock size={12}/> {t.historyBtn}</>}
              </button>
            </div>
            {isOpen && (
              <div style={{ borderTop:`1px solid ${C.border}`, background:"rgba(0,0,0,0.2)",
                padding:"12px 16px", animation:"fadeUp .2s ease" }}>
                <div style={{ fontSize:10, color:C.text2, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
                  {t.decisionHistory}
                </div>
                {trail.length===0 ? (
                  <div style={{ color:C.text2, fontSize:12 }}>{t.noDecisionsRecord}</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {trail.map((d,j) => {
                      const ddc = t.decisionCFG[d.decision] || t.decisionCFG.PENDING_REVIEW;
                      return (
                        <div key={d.id} style={{ display:"flex", alignItems:"center",
                          gap:10, padding:"9px 12px", background:C.s2,
                          border:`1px solid ${C.border}`, borderRadius:9,
                          flexWrap:"wrap", animation:`fadeUp .2s ease ${j*.05}s both` }}>
                          <div style={{ width:7, height:7, borderRadius:"50%",
                            background:ddc.color, flexShrink:0 }} />
                          <span style={{ fontSize:10, fontWeight:700,
                            fontFamily:"'JetBrains Mono',monospace",
                            color:ddc.color, background:ddc.bg, padding:"2px 7px",
                            borderRadius:5, border:`1px solid ${ddc.color}44`,
                            display:"flex", alignItems:"center", gap:4 }}>
                            {ddc.icon} {ddc.label}
                          </span>
                          <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>
                            {d.decidedBy}
                          </span>
                          {d.comment && (
                            <span style={{ fontSize:11, color:C.text2 }}>"{d.comment}"</span>
                          )}
                          <span style={{ fontSize:10, color:C.text2, marginLeft:"auto",
                            fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap" }}>
                            {d.decidedAt ? new Date(d.decidedAt).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const ScreeningPage = () => {
  const [activeTab,     setActiveTab]     = useState("screen");
  const [result,        setResult]        = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [showDecision,  setShowDecision]  = useState(false);
  const [savedDecision, setSavedDecision] = useState(null);
  const [detailMatch,   setDetailMatch]   = useState(null);
  const [showKyc,       setShowKyc]       = useState(false);

  const { lang } = useLang();
  const t = staticContent.screening[lang];

  const [form, setForm] = useState({
    fullName:"", fullNameAr:"", nationality:"",
    dob:"", idType:"", idNumber:"", country:"", motherName:"",
  });
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleScreen = async () => {
    const name = form.fullName.replace(/\s+/g, " ").trim();
    if (!name) return;
    setLoading(true); setResult(null); setSavedDecision(null);
    try {
      setResult(await createScreeningRequest({
        fullName:    name,
        fullNameAr:  form.fullNameAr   || undefined,
        nationality: form.nationality  || undefined,
        dob:         form.dob          || undefined,
        idType:      form.idType       || undefined,
        idNumber:    form.idNumber     || undefined,
        country:     form.country      || undefined,
        motherName:  form.motherName   || undefined,
      }));
    } catch { alert(t.decisionSaveError); }
    finally   { setLoading(false); }
  };

  const risk           = result ? getRiskConfig(result.riskLevel) : null;
  const decisionConfig = savedDecision
  ? t.decisions.find(d => d.value===savedDecision.decision) : null;
  const hasKycData = form.nationality || form.dob || form.idNumber || form.motherName;

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sp-card:hover{transform:translateY(-2px)!important;box-shadow:0 8px 32px rgba(0,212,255,0.10)!important;}
        .sp-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.08);}
        .sp-input:focus,.sp-select:focus{border-color:rgba(0,212,255,0.5)!important;box-shadow:0 0 0 3px rgba(0,212,255,0.08)!important;}
        .dec-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
        .sp-tab:hover{color:#e2e8f0!important;}
        .kyc-toggle:hover{background:rgba(0,212,255,0.08)!important;}
      `}</style>

      <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", animation:"fadeUp .5s ease" }}
        dir={lang === "ar" ? "rtl" : "ltr"}>

        {/* ── Page Header ── */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:4, height:36,
            background:`linear-gradient(180deg,${C.cyan},${C.purple})`, borderRadius:2 }} />
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:C.text }}>
              {t.pageTitle}
            </h2>
            <p style={{ margin:0, fontSize:12, color:C.text2, marginTop:2 }}>
              {t.pageSubtitle}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:C.s1,
          border:`1px solid ${C.border}`, borderRadius:12, padding:4,
          width:"fit-content" }}>
          {t.tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} className="sp-tab" onClick={() => setActiveTab(tab.id)} style={{
                padding:"8px 18px", borderRadius:9, cursor:"pointer",
                fontSize:13, fontWeight:600, transition:"all .15s", border:"none",
                background: activeTab===tab.id
                  ? `linear-gradient(135deg,${C.cyan}22,${C.purple}22)` : "transparent",
                color: activeTab===tab.id ? C.cyan : C.text2,
                boxShadow: activeTab===tab.id ? `inset 0 0 0 1px ${C.cyan}44` : "none",
                display:"flex", alignItems:"center", gap:6,
              }}><Icon size={13}/>{tab.label}</button>
            );
          })}
        </div>

        {/* ══════════════════ SCREEN TAB ══════════════════ */}
        {activeTab==="screen" && (
          <div>
            <div style={{ background:C.s1, border:`1px solid ${C.border}`,
              borderRadius:14, padding:"16px 18px", marginBottom:22,
              position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />

              {/* Full Name row */}
              <div style={{ marginBottom:12 }}>
                <Field label={t.fullNameLabel}>
                  <div style={{ display:"flex", gap:10 }}>
                    <input className="sp-input" value={form.fullName}
                      onChange={set("fullName")}
                      onKeyDown={e => e.key==="Enter" && !showKyc && handleScreen()}
                      disabled={loading} placeholder={t.fullNamePlaceholder}
                      style={{ ...inputStyle, flex:1 }} />
                    <button className="sp-btn" onClick={handleScreen}
                      disabled={loading||!form.fullName.trim()} style={{
                        background: loading||!form.fullName.trim()
                          ? C.s2 : `linear-gradient(135deg,${C.cyan},${C.purple})`,
                        color: loading||!form.fullName.trim() ? C.text2 : C.bg,
                        padding:"10px 22px", border:"none", borderRadius:8,
                        fontSize:13, fontWeight:700, whiteSpace:"nowrap",
                        cursor: loading||!form.fullName.trim() ? "not-allowed" : "pointer",
                        transition:"all .2s", display:"flex", alignItems:"center", gap:7,
                        boxShadow: loading||!form.fullName.trim()
                          ? "none" : `0 4px 16px rgba(0,212,255,0.22)`,
                      }}>
                      <Search size={15}/>{loading ? t.processingBtn : t.runScreeningBtn}
                    </button>
                  </div>
                </Field>
              </div>

              {/* KYC toggle button */}
              <button className="kyc-toggle" onClick={() => setShowKyc(v => !v)} style={{
                display:"flex", alignItems:"center", gap:7, background:"transparent",
                border:`1px dashed ${showKyc ? C.cyan : C.border}`, borderRadius:8,
                color: showKyc ? C.cyan : C.text2, padding:"7px 14px",
                cursor:"pointer", fontSize:12, fontWeight:600, transition:"all .2s",
                marginBottom: showKyc ? 14 : 0,
              }}>
                {showKyc ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                {showKyc ? "Hide KYC Data" : "Add KYC Data"}
                {hasKycData && !showKyc && (
                  <span style={{ background:"rgba(0,212,255,0.15)", color:C.cyan,
                    border:"1px solid rgba(0,212,255,0.3)", padding:"1px 7px",
                    borderRadius:5, fontSize:10, fontWeight:700 }}>{t.kycActive}</span>
                )}
                <span style={{ fontSize:11, color:C.text2, fontWeight:400 }}>
                  {t.kycImproves}
                </span>
              </button>

              {/* KYC expanded fields */}
              {showKyc && (
                <div style={{ animation:"fadeUp .2s ease" }}>
                  <div style={{ marginBottom:12 }}>
                    <Field label={t.fullNameArLabel}>
                      <input className="sp-input" value={form.fullNameAr}
                        onChange={set("fullNameAr")} placeholder={t.fullNameArPlaceholder}
                        style={{ ...inputStyle, direction:"rtl" }} />
                    </Field>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                    gap:12, marginBottom:12 }}>
                    <Field label={t.nationalityLabel}>
                      <select className="sp-select" value={form.nationality}
                        onChange={set("nationality")} style={selectStyle}>
                        <option value="">{t.selectPlaceholder}</option>
                        {NATIONALITIES.map(n => (
                          <option key={n.code} value={n.code}>{n.code} — {n.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t.dobLabel}>
                      <input className="sp-input" type="date" value={form.dob}
                        onChange={set("dob")} style={inputStyle} />
                    </Field>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                    gap:12, marginBottom:12 }}>
                    <Field label="ID Type">
                      <select className="sp-select" value={form.idType}
                        onChange={set("idType")} style={selectStyle}>
                        <option value="">{t.selectPlaceholder}</option>
                        {ID_TYPES.map(tp => (
                          <option key={tp.value} value={tp.value}>{tp.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t.idNumberLabel}>
                      <input className="sp-input" value={form.idNumber}
                        onChange={set("idNumber")} placeholder={t.idNumberPlaceholder}
                        style={inputStyle} />
                    </Field>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <Field label="Mother Name">
                      <input className="sp-input" value={form.motherName}
                        onChange={set("motherName")} placeholder="اسم الأم..."
                        style={{ ...inputStyle, direction:"rtl" }} />
                    </Field>
                  </div>
                  <div style={{ marginTop:4, padding:"8px 12px",
                    background:"rgba(0,212,255,0.06)",
                    border:"1px solid rgba(0,212,255,0.15)",
                    borderRadius:8, fontSize:11, color:C.text2, lineHeight:1.6 }}>
                    💡 KYC data improves accuracy:
                    <span style={{ color:C.cyan }}> ID match +25pts</span> ·
                    <span style={{ color:C.cyan }}> DOB match +15pts</span> ·
                    <span style={{ color:C.cyan }}> Nationality +10pts</span> ·
                    <span style={{ color:C.green }}> Mother Name +20pts (Local)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Loading spinner */}
            {loading && (
              <div style={{ textAlign:"center", padding:"50px 0" }}>
                <div style={{ width:34, height:34, border:`3px solid ${C.border}`,
                  borderTop:`3px solid ${C.cyan}`, borderRadius:"50%",
                  animation:"spin 1s linear infinite", display:"inline-block" }} />
                <p style={{ marginTop:14, color:C.text2, fontSize:14 }}>
                  {t.screeningProgress}
                </p>
              </div>
            )}

            {/* ── Result ── */}
            {result && !loading && (
              <div style={{ animation:"fadeUp .4s ease" }}>
                {/* Risk Assessment Header */}
                <div style={{ background:C.s1, border:`1px solid ${C.border}`,
                  borderRadius:14, padding:"20px 22px", marginBottom:18,
                  position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                    background:`linear-gradient(90deg,${risk.color},${C.purple})` }} />
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:C.text2, fontWeight:600,
                        textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>
                        {t.overallRiskLabel}
                      </div>
                      <div style={{ fontSize:30, fontWeight:700, color:risk.color,
                        fontFamily:"'JetBrains Mono',monospace" }}>{result.riskLevel}</div>
                      {result.notes && (
                        <div style={{ fontSize:12, color:C.text2, marginTop:4 }}>
                          {result.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      {savedDecision && decisionConfig && (
                        <div style={{ padding:"7px 14px", borderRadius:9,
                          background:`${decisionConfig.color}15`,
                          border:`1px solid ${decisionConfig.color}44`,
                          display:"flex", alignItems:"center", gap:6 }}>
                          {decisionConfig.icon}
                          <span style={{ fontSize:12, fontWeight:700,
                            color:decisionConfig.color,
                            fontFamily:"'JetBrains Mono',monospace" }}>
                            {decisionConfig.label}
                          </span>
                        </div>
                      )}
                      {isAdmin() && (
                        <button className="dec-btn" onClick={() => setShowDecision(true)}
                          style={{
                            background:`linear-gradient(135deg,${C.orange},${C.purple})`,
                            border:"none", color:"white", padding:"9px 18px",
                            borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:700,
                            transition:"all .2s", display:"flex", alignItems:"center", gap:7,
                            boxShadow:`0 4px 14px rgba(245,158,11,0.25)` }}>
                          <Scale size={14}/> {t.recordDecisionBtn}
                        </button>
                      )}
                      <div style={{ width:56, height:56, borderRadius:"50%",
                        background:risk.bg, border:`2px solid ${risk.color}44`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        color:risk.color }}>
                        {risk.icon}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matches */}
                {result.matches?.length > 0 && (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <div style={{ width:4, height:26,
                        background:`linear-gradient(180deg,${C.cyan},${C.purple})`,
                        borderRadius:2 }} />
                      <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>
                        {t.matchesFoundTitle}
                      </h3>
                      <span style={{ background:"rgba(239,68,68,0.15)", color:C.red,
                        border:"1px solid rgba(239,68,68,0.3)", padding:"2px 9px",
                        borderRadius:5, fontSize:11, fontWeight:700,
                        fontFamily:"'JetBrains Mono',monospace" }}>
                        {result.matches.length}
                      </span>
                    </div>
                    {result.matches.map((match, i) => {
                      const sc = getSourceColor(match.source);
                      const cf = match.confidenceLevel;
                      return (
                        <div key={match.id??`m-${i}`} className="sp-card" style={{
                          background:C.s1, border:`1px solid ${C.border}`,
                          borderRadius:14, marginBottom:12, overflow:"hidden",
                          transition:"all .2s", animation:`fadeUp .4s ease ${i*.06}s both` }}>
                          <div style={{ height:2,
                            background:`linear-gradient(90deg,${sc},${C.purple})` }} />
                          <div style={{ padding:"16px 18px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"flex-start", marginBottom:12, gap:8, flexWrap:"wrap" }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:16, fontWeight:700, color:C.text,
                                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  {match.matchedName || "Unknown"}
                                </div>
                                {match.pep && match.notes && (
                                  <div style={{ fontSize:11, color:C.pepColor, marginTop:3,
                                    display:"flex", alignItems:"center", gap:4 }}>
                                    <User size={10}/> {match.notes}
                                  </div>
                                )}
                              </div>
                              <div style={{ display:"flex", alignItems:"center",
                                gap:5, flexWrap:"wrap" }}>
                                {(match.source||"").split("|").map(s=>s.trim()).filter(Boolean).map(s => (
                                  <span key={s} style={{
                                    background:`${getSourceColor(s)}22`, color:getSourceColor(s),
                                    border:`1px solid ${getSourceColor(s)}44`,
                                    padding:"2px 8px", borderRadius:5, fontSize:10, fontWeight:700,
                                    fontFamily:"'JetBrains Mono',monospace" }}>{s}</span>
                                ))}
                                {cf && cf !== "UNCONFIRMED" && (
                                  <span style={{
                                    background: cf==="CONFIRMED" ? "rgba(16,185,129,0.15)"
                                              : cf==="PROBABLE"  ? "rgba(245,158,11,0.15)"
                                              : cf==="MISMATCH"  ? "rgba(239,68,68,0.12)"
                                              : "rgba(0,212,255,0.12)",
                                    color: cf==="CONFIRMED" ? C.green
                                         : cf==="PROBABLE"  ? C.orange
                                         : cf==="MISMATCH"  ? C.red
                                         : C.cyan,
                                    border:`1px solid ${
                                      cf==="CONFIRMED" ? "rgba(16,185,129,0.4)"
                                    : cf==="PROBABLE"  ? "rgba(245,158,11,0.4)"
                                    : cf==="MISMATCH"  ? "rgba(239,68,68,0.3)"
                                    : "rgba(0,212,255,0.3)"}`,
                                    padding:"2px 7px", borderRadius:5, fontSize:10, fontWeight:700,
                                    fontFamily:"'JetBrains Mono',monospace" }}>{cf}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                              gap:10, marginBottom:12 }}>
                              <div style={{ background:C.s2, border:`1px solid ${C.border}`,
                                borderRadius:9, padding:"9px 12px" }}>
                                <div style={{ fontSize:10, color:C.text2, marginBottom:3,
                                  textTransform:"uppercase", letterSpacing:"0.4px" }}>
                                  {t.matchScoreLabel}
                                </div>
                                <div style={{ fontSize:18, fontWeight:700, color:C.cyan,
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  {(match.matchScore??match.score??0).toFixed(1)}%
                                </div>
                              </div>
                              <div style={{ background:C.s2, border:`1px solid ${C.border}`,
                                borderRadius:9, padding:"9px 12px" }}>
                                <div style={{ fontSize:10, color:C.text2, marginBottom:3,
                                  textTransform:"uppercase", letterSpacing:"0.4px" }}>
                                  {t.riskPointsLabel}
                                </div>
                                <div style={{ fontSize:18, fontWeight:700, color:C.purple,
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  {(match.riskPoints??0).toFixed(1)}
                                </div>
                              </div>
                            </div>
                            <button className="sp-btn" onClick={() => setDetailMatch(match)}
                              style={{
                                background:`linear-gradient(135deg,${C.cyan},${C.purple})`,
                                color:C.bg, padding:"8px 18px", border:"none",
                                borderRadius:8, fontSize:13, fontWeight:700,
                                cursor:"pointer", transition:"all .2s",
                                display:"flex", alignItems:"center", gap:6,
                                boxShadow:`0 4px 14px rgba(0,212,255,0.2)` }}>
                              <Eye size={13}/> {t.viewDetailsBtn}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* No matches */}
                {result.matches?.length===0 && (
                  <div style={{ background:C.s1, border:`1px solid ${C.border}`,
                    borderRadius:14, padding:"50px 24px", textAlign:"center" }}>
                    <CheckCircle size={48} color={C.green}
                      style={{ marginBottom:14, opacity:.7 }}/>
                    <h4 style={{ color:C.green, margin:"0 0 8px",
                      fontSize:17, fontWeight:600 }}>{t.noMatchTitle}</h4>
                    <p style={{ color:C.text2, margin:0, fontSize:13 }}>{t.noMatchSub}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ HISTORY TAB ══════════════════ */}
        {activeTab==="history" && <MyHistoryTab t={t} />}
      </div>

      {showDecision && result && (
        <DecisionModal
          resultId={result.id}
          onClose={() => setShowDecision(false)}
          onSaved={(d) => setSavedDecision(d)}
          t={t}
        />
      )}
      {detailMatch && (
        <DetailsModal match={detailMatch} onClose={() => setDetailMatch(null)} t={t} />
      )}
    </Layout>
  );
};

export default ScreeningPage;