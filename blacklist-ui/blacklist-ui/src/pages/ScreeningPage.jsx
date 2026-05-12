import React, { useState } from "react";
import Layout from "../components/Layout";
import { createScreeningRequest } from "../services/screeningService";
import { getPersonDetails } from "../services/searchService";
import { API_V1 as API } from "../config/api";
import { Shield, Search, Clock, AlertTriangle, CheckCircle, XCircle, Scale, ChevronUp, ChevronDown, Eye, User } from "lucide-react";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

const isAdmin = () => ["SUPER_ADMIN","COMPANY_ADMIN"].includes(localStorage.getItem("role") || "");

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  orange:"#f59e0b", red:"#ef4444", text:"#e2e8f0", text2:"#7a8fa8",
  pepColor:"#a78bfa",
};

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

// ✅ أضفنا PEP
function getSourceColor(s) {
  switch (s) {
    case "OFAC":  return C.red;
    case "EU":    return C.purple;
    case "UN":    return C.orange;
    case "UK":    return C.cyan;
    case "LOCAL": return C.green;
    case "PEP":   return C.pepColor; // ✅
    default:      return C.text2;
  }
}

function normalizeAliases(aliases) {
  if (!aliases) return [];
  if (!Array.isArray(aliases)) aliases = [aliases];
  return aliases.flatMap(alias => {
    if (!alias) return [];
    if (typeof alias === "object") {
      if (alias.wholeName) return [alias.wholeName.trim()];
      if (alias.lastName)  return [alias.lastName.trim()];
      if (alias.name)      return [alias.name.trim()];
      const v = Object.values(alias).find(v => typeof v === "string" && v.trim());
      return v ? [v.trim()] : [];
    }
    if (typeof alias === "string")
      return alias.split(/[;,|]/).map(a => a.trim()).filter(Boolean);
    return [];
  }).filter(Boolean);
}

function normalizeDOB(dobs) {
  if (!dobs) return [];
  if (Array.isArray(dobs)) return dobs.map(d => d.dateOfBirth||d.year||JSON.stringify(d)).filter(Boolean);
  return [dobs];
}

function normalizeNationality(n) {
  if (!n) return [];
  if (Array.isArray(n)) return n.map(x => x.country||x.nationality||x.value||JSON.stringify(x)).filter(Boolean);
  return [n];
}

const DECISIONS = [
  { value:"TRUE_MATCH",     label:"True Match",     color:C.red,    icon:<XCircle size={13}/>     },
  { value:"FALSE_POSITIVE", label:"False Positive", color:C.green,  icon:<CheckCircle size={13}/> },
  { value:"PENDING_REVIEW", label:"Pending Review", color:C.orange, icon:<Clock size={13}/>        },
  { value:"RISK_ACCEPTED",  label:"Risk Accepted",  color:C.cyan,   icon:<AlertTriangle size={13}/>},
];

const DECISION_CFG = {
  TRUE_MATCH:     { color:C.red,    bg:"rgba(239,68,68,0.12)",  icon:<XCircle size={11}/>,      label:"True Match"     },
  FALSE_POSITIVE: { color:C.green,  bg:"rgba(16,185,129,0.12)", icon:<CheckCircle size={11}/>,  label:"False Positive" },
  PENDING_REVIEW: { color:C.orange, bg:"rgba(245,158,11,0.12)", icon:<Clock size={11}/>,         label:"Pending Review" },
  RISK_ACCEPTED:  { color:C.cyan,   bg:"rgba(0,212,255,0.12)",  icon:<AlertTriangle size={11}/>, label:"Risk Accepted"  },
};

// ── Details Modal ─────────────────────────────────────────────────────────────
function DetailsModal({ match, onClose, allMatches }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const srcColor = getSourceColor(match.source);
  const isPep    = match.pep === true || match.source === "PEP"; // ✅

  // ✅ PEP info من الـ match نفسه
  const pepMatch = match.pep === true ? match : null;

  React.useEffect(() => {
    (async () => {
       
      if (isPep) {
        setDetails({
          name:       match.matchedName,
          notes:      match.notes || "Politically Exposed Person",
          wikidataId: match.wikidataId || match.sanctionId,
        });
        setLoading(false);
        return;
      }
      try {
           // ← لو في أكثر من source، اجلب من كل واحد
      const sources = (match.source || "").split("|").map(s => s.trim()).filter(Boolean);
      
      if (sources.length > 1) {
        const allDetails = await Promise.all(
          sources
            .filter(s => s !== "PEP")
            .map(s => getPersonDetails(match.sanctionId || match.id, s).catch(() => null))
        );
        const validDetails = allDetails.filter(Boolean);
        setDetails(validDetails.length > 0 ? { multiSource: true, items: validDetails, sources } : null);
      } else {
        const d = await getPersonDetails(match.sanctionId || match.id, match.source);
        setDetails(d);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  })();
}, []);

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0,
      background:"rgba(6,9,18,0.85)", display:"flex", alignItems:"center",
      justifyContent:"center", zIndex:1001, backdropFilter:"blur(6px)", padding:"16px" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:C.s1, border:`1px solid ${C.border}`, borderRadius:16,
        width:"100%", maxWidth:540, maxHeight:"85vh", overflowY:"auto",
        position:"relative", boxShadow:"0 24px 64px rgba(0,0,0,0.6)",
        animation:"fadeUp .25s ease" }}>
        <div style={{ height:2, background:`linear-gradient(90deg,${srcColor},${C.purple})`, borderRadius:"16px 16px 0 0" }} />
        <div style={{ padding:"20px 22px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:4, height:26, background:`linear-gradient(180deg,${srcColor},${C.purple})`, borderRadius:2 }} />
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>
                {isPep ? "PEP Details" : "Entity Details"}
              </h2>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ background:`${srcColor}22`, color:srcColor,
                border:`1px solid ${srcColor}44`, padding:"2px 10px", borderRadius:6,
                fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                {match.source}
              </span>
              <button onClick={onClose} style={{ background:"none", border:"none",
                color:C.text2, cursor:"pointer", display:"flex" }}>
                <XCircle size={18}/>
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign:"center", padding:"30px 0" }}>
              <div style={{ width:26, height:26, border:`3px solid ${C.border}`,
                borderTop:`3px solid ${C.cyan}`, borderRadius:"50%",
                animation:"spin 1s linear infinite", display:"inline-block" }} />
            </div>
          )}

          {/* ✅ PEP Details */}
          {!loading && isPep && details && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* PEP badge */}
              <div style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.3)",
                borderRadius:10, padding:"12px 14px", marginBottom:6,
                display:"flex", alignItems:"center", gap:10 }}>
                <User size={18} color={C.pepColor}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.pepColor }}>
                    Politically Exposed Person
                  </div>
                  <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>
                    Source: Wikidata — Public figure database
                  </div>
                </div>
              </div>
              {[
                { label:"Full Name",   value: details.name || match.matchedName },
                { label:"Description", value: details.notes || "—" },
                { label:"Wikidata ID", value: details.wikidataId
                    ? <a href={`https://www.wikidata.org/wiki/${details.wikidataId}`}
                        target="_blank" rel="noreferrer"
                        style={{ color:C.cyan, textDecoration:"none" }}>
                        {details.wikidataId} ↗
                      </a>
                    : "—"
                },
                { label:"Match Score", value: `${(match.matchScore??match.score??0).toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"grid", gridTemplateColumns:"110px 1fr",
                  gap:10, padding:"9px 10px", borderRadius:7, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, color:C.text2, fontWeight:600,
                    textTransform:"uppercase", letterSpacing:"0.4px", paddingTop:2 }}>{label}</div>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sanctions Details */}
         {!loading && !isPep && details && (
  <>
    {details.multiSource ? (
  <div>
    {details.items.map((item, idx) => (
      <div key={idx} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan,
          fontFamily: "'JetBrains Mono',monospace", marginBottom: 8,
          padding: "4px 10px", background: "rgba(0,212,255,0.08)",
          borderRadius: 6, display: "inline-block" }}>
          {details.sources.filter(s => s !== "PEP")[idx]}
        </div>
        {[
          { label:"Full Name",     value: item.name || match.matchedName },
          { label:"Aliases",       value: normalizeAliases(item.aliases).join(" · ") || "—" },
          { label:"Date of Birth", value: normalizeDOB(item.dateOfBirth).join(", ") || "—" },
          { label:"Nationality",   value: normalizeNationality(item.nationality).join(", ") || "—" },
          { label:"Program",       value: item.program || "—" },
          { label:"Remarks",       value: item.remarks || "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display:"grid", gridTemplateColumns:"110px 1fr",
            gap:10, padding:"9px 10px", borderRadius:7, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.text2, fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.4px", paddingTop:2 }}>{label}</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{value}</div>
          </div>
        ))}
      </div>
    ))}

    {/* ← أضف هون — عرض PEP لو موجود في الـ sources */}
    {details.sources.includes("PEP") && (
      <div style={{ marginTop: 12, background:"rgba(167,139,250,0.08)",
        border:"1px solid rgba(167,139,250,0.3)", borderRadius:10, padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
          <User size={14} color={C.pepColor}/>
          <span style={{ fontSize:12, fontWeight:700, color:C.pepColor }}>
            Politically Exposed Person (PEP)
          </span>
        </div>
        {[
          { label:"Description", value: match.notes || "—" },
          { label:"Wikidata ID", value: match.wikidataId
              ? <a href={`https://www.wikidata.org/wiki/${match.wikidataId}`}
                  target="_blank" rel="noreferrer"
                  style={{ color:C.cyan, textDecoration:"none" }}>
                  {match.wikidataId} ↗
                </a>
              : "—"
          },
        ].map(({ label, value }) => (
          <div key={label} style={{ display:"grid", gridTemplateColumns:"110px 1fr",
            gap:10, padding:"7px 0", borderBottom:`1px solid rgba(167,139,250,0.15)` }}>
            <div style={{ fontSize:11, color:C.pepColor, fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{value}</div>
          </div>
        ))}
      </div>
    )}
  </div>
) :  (
      // عرض عادي — source واحد
      <>
        {[
          { label:"Full Name",     value: details.name || match.matchedName },
          { label:"Aliases",       value: normalizeAliases(details.aliases).join(" · ") || "—" },
          { label:"Date of Birth", value: normalizeDOB(details.dateOfBirth).join(", ") || "—" },
          { label:"Nationality",   value: normalizeNationality(details.nationality).join(", ") || "—" },
          { label:"Program",       value: details.program || "—" },
          { label:"Remarks",       value: details.remarks || "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display:"grid", gridTemplateColumns:"110px 1fr",
            gap:10, padding:"9px 10px", borderRadius:7, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.text2, fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.4px", paddingTop:2 }}>{label}</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{value}</div>
          </div>
        ))}
      </>
    )}
  </>
)}
          {/* ✅ PEP Section — يظهر لو الشخص موجود في PEP بغض النظر عن المصدر */}
          {!loading && !isPep && pepMatch && (
            <div style={{ marginTop:12, background:"rgba(167,139,250,0.08)",
              border:"1px solid rgba(167,139,250,0.3)", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <User size={14} color={C.pepColor}/>
                <span style={{ fontSize:12, fontWeight:700, color:C.pepColor }}>
                  Politically Exposed Person (PEP)
                </span>
              </div>
              {[
                { label:"Description", value: pepMatch.notes || "—" },
                { label:"Wikidata ID", value: pepMatch.wikidataId
                    ? <a href={`https://www.wikidata.org/wiki/${pepMatch.wikidataId}`}
                        target="_blank" rel="noreferrer"
                        style={{ color:C.cyan, textDecoration:"none" }}>
                        {pepMatch.wikidataId} ↗
                      </a>
                    : "—"
                },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"grid", gridTemplateColumns:"110px 1fr",
                  gap:10, padding:"7px 0", borderBottom:`1px solid rgba(167,139,250,0.15)` }}>
                  <div style={{ fontSize:11, color:C.pepColor, fontWeight:600,
                    textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {!loading && !details && (
            <div style={{ textAlign:"center", padding:"20px 0", color:C.text2, fontSize:13 }}>
              No details available
            </div>
          )}

          <button onClick={onClose} style={{ marginTop:16, width:"100%",
            background:`linear-gradient(135deg,${C.red},#dc2626)`,
            color:"white", padding:"10px", border:"none", borderRadius:9,
            fontSize:13, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            boxShadow:"0 4px 14px rgba(239,68,68,0.25)" }}>
            <XCircle size={14}/> Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Decision Modal ────────────────────────────────────────────────────────────
function DecisionModal({ resultId, onClose, onSaved }) {
  const [decision, setDecision] = useState("");
  const [comment,  setComment]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const handleSave = async () => {
    if (!decision) { setError("Select a decision first"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/decisions`, {
        method:"POST", headers:authHeaders(),
        body:JSON.stringify({ screeningType:"PERSON", screeningId:resultId, decision, comment }),
      });
      if (!res.ok) throw new Error("Failed");
      onSaved(await res.json()); onClose();
    } catch { setError("Failed to save — try again"); }
    finally  { setSaving(false); }
  };

  const selected = DECISIONS.find(d => d.value === decision);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" }}>
      <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:16,
        padding:"24px", width:"100%", maxWidth:420, position:"relative", overflow:"hidden",
        animation:"fadeUp .25s ease" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4,
          display:"flex", alignItems:"center", gap:8 }}>
          <Scale size={15} color={C.cyan}/> Record Decision
        </div>
        <div style={{ fontSize:12, color:C.text2, marginBottom:16 }}>Screening Result #{resultId}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {DECISIONS.map(d => (
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
          placeholder="Comment (optional)" rows={2}
          style={{ width:"100%", padding:"9px 12px", background:C.s2,
            border:`1px solid ${C.border}`, borderRadius:9, color:C.text,
            fontSize:13, outline:"none", resize:"none",
            fontFamily:"'IBM Plex Sans',sans-serif", boxSizing:"border-box", marginBottom:12 }} />
        {error && <div style={{ color:C.red, fontSize:12, marginBottom:8,
          display:"flex", alignItems:"center", gap:5 }}>
          <AlertTriangle size={12}/>{error}
        </div>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", background:C.s2,
            border:`1px solid ${C.border}`, color:C.text2, borderRadius:9, cursor:"pointer", fontSize:13 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving||!decision} style={{
            flex:1, padding:"9px",
            background: decision ? `linear-gradient(135deg,${selected?.color||C.cyan},${C.purple})` : C.s2,
            border:"none", color: decision ? "white" : C.text2,
            borderRadius:9, cursor: decision ? "pointer" : "not-allowed",
            fontSize:13, fontWeight:700, display:"flex", alignItems:"center",
            justifyContent:"center", gap:6,
          }}>
            <CheckCircle size={13}/>{saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── My History Tab ────────────────────────────────────────────────────────────
function MyHistoryTab() {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [audits,   setAudits]   = useState({});

  React.useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/screening/my-history`, { headers: authHeaders() });
      if (res.ok) setHistory(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAudit = async (screeningId) => {
    if (audits[screeningId]) {
      setExpanded(expanded === screeningId ? null : screeningId);
      return;
    }
    try {
      const res = await fetch(`${API}/decisions/PERSON/${screeningId}/audit`, { headers: authHeaders() });
      if (res.ok) {
        setAudits(async prev => ({ ...prev, [screeningId]: await res.json() }));
        setExpanded(screeningId);
      }
    } catch (e) { console.error(e); }
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
      No screening history yet
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {history.map((item, i) => {
        const risk   = getRiskConfig(item.riskLevel);
        const dc     = item.latestDecision ? DECISION_CFG[item.latestDecision.decision] : null;
        const isOpen = expanded===item.id;
        const trail  = audits[item.id]||[];
        return (
          <div key={item.id} style={{ background:C.s1, border:`1px solid ${C.border}`,
            borderRadius:14, overflow:"hidden", animation:`fadeUp .3s ease ${i*.04}s both` }}>
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
                fontFamily:"'JetBrains Mono',monospace", background:risk.bg,
                color:risk.color, border:`1px solid ${risk.color}33`, whiteSpace:"nowrap",
                display:"flex", alignItems:"center", gap:4 }}>
                {risk.icon} {item.riskLevel}
              </span>
              {dc ? (
                <span style={{ padding:"3px 9px", borderRadius:7, fontSize:10, fontWeight:700,
                  fontFamily:"'JetBrains Mono',monospace", background:dc.bg,
                  color:dc.color, border:`1px solid ${dc.color}44`, whiteSpace:"nowrap",
                  display:"flex", alignItems:"center", gap:4 }}>
                  {dc.icon} {dc.label}
                </span>
              ) : (
                <span style={{ padding:"3px 9px", borderRadius:7, fontSize:10,
                  color:C.text2, background:C.s2, border:`1px solid ${C.border}`,
                  whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}>
                  <Clock size={10}/> No Decision
                </span>
              )}
              <button onClick={() => fetchAudit(item.id)} style={{
                background: isOpen ? "rgba(0,212,255,0.1)" : C.s2,
                border:`1px solid ${isOpen ? C.cyan : C.border}`,
                color: isOpen ? C.cyan : C.text2,
                padding:"5px 10px", borderRadius:8, cursor:"pointer",
                fontSize:11, fontWeight:600, transition:"all .15s", whiteSpace:"nowrap",
                display:"flex", alignItems:"center", gap:4 }}>
                {isOpen ? <><ChevronUp size={12}/> Hide</> : <><Clock size={12}/> History</>}
              </button>
            </div>
            {isOpen && (
              <div style={{ borderTop:`1px solid ${C.border}`, background:"rgba(0,0,0,0.2)",
                padding:"12px 16px", animation:"fadeUp .2s ease" }}>
                <div style={{ fontSize:10, color:C.text2, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
                  Decision History
                </div>
                {trail.length===0 ? (
                  <div style={{ color:C.text2, fontSize:12 }}>No decisions recorded</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {trail.map((d,j) => {
                      const ddc = DECISION_CFG[d.decision]||DECISION_CFG.PENDING_REVIEW;
                      return (
                        <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10,
                          padding:"9px 12px", background:C.s2, border:`1px solid ${C.border}`,
                          borderRadius:9, flexWrap:"wrap", animation:`fadeUp .2s ease ${j*.05}s both` }}>
                          <div style={{ width:7, height:7, borderRadius:"50%", background:ddc.color, flexShrink:0 }} />
                          <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                            color:ddc.color, background:ddc.bg, padding:"2px 7px", borderRadius:5,
                            border:`1px solid ${ddc.color}44`, display:"flex", alignItems:"center", gap:4 }}>
                            {ddc.icon} {ddc.label}
                          </span>
                          <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>{d.decidedBy}</span>
                          {d.comment&&<span style={{ fontSize:11, color:C.text2 }}>"{d.comment}"</span>}
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
  const [query,         setQuery]         = useState("");
  const [result,        setResult]        = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [showDecision,  setShowDecision]  = useState(false);
  const [savedDecision, setSavedDecision] = useState(null);
  const [detailMatch,   setDetailMatch]   = useState(null);

  const handleScreen = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult(null); setSavedDecision(null);
    try { setResult(await createScreeningRequest(query)); }
    catch { alert("Screening failed"); }
    finally { setLoading(false); }
  };

  const risk = result ? getRiskConfig(result.riskLevel) : null;
  const decisionConfig = savedDecision ? DECISIONS.find(d => d.value===savedDecision.decision) : null;

  const TABS = [
    { id:"screen",  label:"Run Screening", icon:<Shield size={13}/>  },
    { id:"history", label:"My History",    icon:<Clock size={13}/>   },
  ];

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin  {to{transform:rotate(360deg)}}
        .sp-card:hover{transform:translateY(-2px)!important;box-shadow:0 8px 32px rgba(0,212,255,0.10)!important;}
        .sp-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.08);}
        .sp-input:focus{border-color:rgba(0,212,255,0.5)!important;box-shadow:0 0 0 3px rgba(0,212,255,0.08)!important;}
        .dec-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
        .sp-tab:hover{color:#e2e8f0!important;}
        .risk-banner-inner{display:flex;justify-content:space-between;align-items:center;}
        .risk-actions{display:flex;align-items:center;gap:10px;}
        .screen-input-row{display:flex;gap:12px;}
        .match-scores{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:768px){
          .risk-banner-inner{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;}
          .risk-actions{flex-wrap:wrap!important;gap:8px!important;}
          .screen-input-row{flex-direction:column!important;gap:8px!important;}
          .screen-btn{width:100%!important;}
          .page-title{font-size:1.3rem!important;}
          .match-name{font-size:14px!important;}
        }
      `}</style>

      <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", animation:"fadeUp .5s ease" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:4, height:36, background:`linear-gradient(180deg,${C.cyan},${C.purple})`, borderRadius:2 }} />
          <div>
            <h2 className="page-title" style={{ margin:0, fontSize:22, fontWeight:700, color:C.text }}>
              Risk Screening
            </h2>
            <p style={{ margin:0, fontSize:12, color:C.text2, marginTop:2 }}>
              Screen against global sanctions lists + PEP database
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:20,
          background:C.s1, border:`1px solid ${C.border}`,
          borderRadius:12, padding:4, width:"fit-content" }}>
          {TABS.map(t => (
            <button key={t.id} className="sp-tab" onClick={() => setActiveTab(t.id)} style={{
              padding:"8px 18px", borderRadius:9, cursor:"pointer", fontSize:13,
              fontWeight:600, transition:"all .15s", border:"none",
              background: activeTab===t.id ? `linear-gradient(135deg,${C.cyan}22,${C.purple}22)` : "transparent",
              color: activeTab===t.id ? C.cyan : C.text2,
              boxShadow: activeTab===t.id ? `inset 0 0 0 1px ${C.cyan}44` : "none",
              display:"flex", alignItems:"center", gap:6,
            }}>{t.icon}{t.label}</button>
          ))}
        </div>

        {/* ── TAB: Run Screening ── */}
        {activeTab==="screen" && (
          <div>
            <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14,
              padding:"16px 18px", marginBottom:22, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />
              <label style={{ display:"block", marginBottom:8, fontSize:11, fontWeight:600,
                color:C.text2, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                Name to Screen
              </label>
              <div className="screen-input-row">
                <input className="sp-input" value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && handleScreen()}
                  disabled={loading} placeholder="Enter full name..."
                  style={{ flex:1, padding:"12px 14px", background:loading?C.bg:C.s2,
                    border:`1px solid ${C.border}`, borderRadius:9, fontSize:14,
                    color:C.text, outline:"none", transition:"all .2s",
                    fontFamily:"'IBM Plex Sans',sans-serif" }} />
                <button className="sp-btn screen-btn" onClick={handleScreen}
                  disabled={loading||!query.trim()} style={{
                    background: loading||!query.trim() ? C.s2 : `linear-gradient(135deg,${C.cyan},${C.purple})`,
                    color: loading||!query.trim() ? C.text2 : C.bg,
                    padding:"12px 24px", border:"none", borderRadius:9,
                    fontSize:13, fontWeight:700, cursor:loading||!query.trim()?"not-allowed":"pointer",
                    transition:"all .2s", whiteSpace:"nowrap",
                    display:"flex", alignItems:"center", gap:7,
                    boxShadow:loading||!query.trim()?"none":`0 4px 16px rgba(0,212,255,0.22)`,
                  }}>
                  <Search size={15}/>{loading ? "Processing..." : "Run Screening"}
                </button>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign:"center", padding:"50px 0" }}>
                <div style={{ width:34, height:34, border:`3px solid ${C.border}`,
                  borderTop:`3px solid ${C.cyan}`, borderRadius:"50%",
                  animation:"spin 1s linear infinite", display:"inline-block" }} />
                <p style={{ marginTop:14, color:C.text2, fontSize:14 }}>Screening in progress...</p>
              </div>
            )}

            {result && !loading && (
              <div style={{ animation:"fadeUp .4s ease" }}>
                {/* Risk Banner */}
                <div style={{ background:C.s1, border:`1px solid ${C.border}`,
                  borderRadius:14, padding:"20px 22px", marginBottom:18,
                  position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                    background:`linear-gradient(90deg,${risk.color},${C.purple})` }} />
                  <div className="risk-banner-inner">
                    <div>
                      <div style={{ fontSize:11, color:C.text2, fontWeight:600,
                        textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>
                        Overall Risk Assessment
                      </div>
                      <div style={{ fontSize:30, fontWeight:700, color:risk.color,
                        fontFamily:"'JetBrains Mono',monospace" }}>{result.riskLevel}</div>
                    </div>
                    <div className="risk-actions">
                      {savedDecision && decisionConfig && (
                        <div style={{ padding:"7px 14px", borderRadius:9,
                          background:`${decisionConfig.color}15`,
                          border:`1px solid ${decisionConfig.color}44`,
                          display:"flex", alignItems:"center", gap:6 }}>
                          {decisionConfig.icon}
                          <span style={{ fontSize:12, fontWeight:700, color:decisionConfig.color,
                            fontFamily:"'JetBrains Mono',monospace" }}>{decisionConfig.label}</span>
                        </div>
                      )}
                      {isAdmin() && (
                        <button className="dec-btn" onClick={() => setShowDecision(true)} style={{
                          background:`linear-gradient(135deg,${C.orange},${C.purple})`,
                          border:"none", color:"white", padding:"9px 18px",
                          borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:700,
                          transition:"all .2s", display:"flex", alignItems:"center", gap:7,
                          boxShadow:`0 4px 14px rgba(245,158,11,0.25)` }}>
                          <Scale size={14}/> Record Decision
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
                      <div style={{ width:4, height:26, background:`linear-gradient(180deg,${C.cyan},${C.purple})`, borderRadius:2 }} />
                      <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>Matches Found</h3>
                      <span style={{ background:"rgba(239,68,68,0.15)", color:C.red,
                        border:"1px solid rgba(239,68,68,0.3)", padding:"2px 9px",
                        borderRadius:5, fontSize:11, fontWeight:700,
                        fontFamily:"'JetBrains Mono',monospace" }}>{result.matches.length}</span>
                    </div>
                    {(() => {
                      // ✅ للأشخاص الموجودين فقط في PEP (بدون مصدر عقوبات) — احتفظ ببطاقة PEP
                      const sanctionNames = new Set(
                        result.matches
                          .filter(m => m.source !== "PEP")
                          .map(m => (m.matchedName||"").toLowerCase().replace(/[-_.]/g," ").trim())
                      );
                      const filtered = result.matches.filter(m => {
                        if (m.source !== "PEP") return true; // ابقِ كل مصادر العقوبات
                        // ابقِ PEP فقط لو الشخص مش موجود في قائمة عقوبات
                        const normName = (m.matchedName||"").toLowerCase().replace(/[-_.]/g," ").trim();
                        return !sanctionNames.has(normName);
                      });
                      return filtered;
                    })().map((match, i) => {
                      const srcColor    = getSourceColor(match.source);
                      const isPep       = match.pep === true || match.source === "PEP";
                      // ✅ هل هذا الشخص موجود في PEP — تحقق من الـ pep field مباشرة
                      const isPersonPep = match.pep === true;
                      return (
                        <div key={match.id??`m-${i}`} className="sp-card" style={{
                          background:C.s1, border:`1px solid ${C.border}`,
                          borderRadius:14, marginBottom:12, overflow:"hidden",
                          transition:"all .2s", animation:`fadeUp .4s ease ${i*.06}s both` }}>
                          <div style={{ height:2, background:`linear-gradient(90deg,${srcColor},${C.purple})` }} />
                          <div style={{ padding:"16px 18px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"flex-start", marginBottom:12, gap:8 }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div className="match-name" style={{ fontSize:16, fontWeight:700,
                                  color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  {match.matchedName || "Unknown"}
                                </div>
                                {/* ✅ notes للـ PEP */}
                                {isPep && match.notes && (
                                  <div style={{ fontSize:11, color:C.pepColor, marginTop:3,
                                    display:"flex", alignItems:"center", gap:4 }}>
                                    <User size={10}/> {match.notes}
                                  </div>
                                )}
                              </div>
                              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                  <span style={{ background:`${srcColor}22`, color:srcColor,
                                    border:`1px solid ${srcColor}44`, padding:"2px 9px",
                                    borderRadius:5, fontSize:11, fontWeight:700, flexShrink:0,
                                    fontFamily:"'JetBrains Mono',monospace" }}>
                                    {match.source||"—"}
                                  </span>
                                  {/* ✅ PEP badge جنب المصدر لو الشخص موجود في PEP */}
                                  {isPersonPep && (
                                    <span style={{ background:"rgba(167,139,250,0.15)",
                                      color:C.pepColor, border:"1px solid rgba(167,139,250,0.4)",
                                      padding:"2px 7px", borderRadius:5, fontSize:10,
                                      fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                                      display:"flex", alignItems:"center", gap:3 }}>
                                      <User size={9}/> PEP
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="match-scores" style={{ marginBottom:12 }}>
                              <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 12px" }}>
                                <div style={{ fontSize:10, color:C.text2, marginBottom:3,
                                  textTransform:"uppercase", letterSpacing:"0.4px" }}>Match Score</div>
                                <div style={{ fontSize:18, fontWeight:700, color:C.cyan,
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  {(match.matchScore??match.score??0).toFixed(1)}%
                                </div>
                              </div>
                              <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:9, padding:"9px 12px" }}>
                                <div style={{ fontSize:10, color:C.text2, marginBottom:3,
                                  textTransform:"uppercase", letterSpacing:"0.4px" }}>Risk Points</div>
                                <div style={{ fontSize:18, fontWeight:700, color:C.purple,
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  {(match.riskPoints??0).toFixed(1)}
                                </div>
                              </div>
                            </div>
                            <button className="sp-btn" onClick={() => setDetailMatch(match)}
                              style={{ background:`linear-gradient(135deg,${C.cyan},${C.purple})`,
                                color:C.bg, padding:"8px 18px", border:"none",
                                borderRadius:8, fontSize:13, fontWeight:700,
                                cursor:"pointer", transition:"all .2s",
                                display:"flex", alignItems:"center", gap:6,
                                boxShadow:`0 4px 14px rgba(0,212,255,0.2)` }}>
                              <Eye size={13}/> View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {result.matches?.length===0 && (
                  <div style={{ background:C.s1, border:`1px solid ${C.border}`,
                    borderRadius:14, padding:"50px 24px", textAlign:"center" }}>
                    <CheckCircle size={48} color={C.green} style={{ marginBottom:14, opacity:.7 }}/>
                    <h4 style={{ color:C.green, margin:"0 0 8px", fontSize:17, fontWeight:600 }}>No Matches Found</h4>
                    <p style={{ color:C.text2, margin:0, fontSize:13 }}>This name is clear</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab==="history" && <MyHistoryTab />}
      </div>

      {showDecision && result && (
        <DecisionModal resultId={result.id}
          onClose={() => setShowDecision(false)}
          onSaved={(d) => setSavedDecision(d)} />
      )}

      {detailMatch && (
        <DetailsModal match={detailMatch} onClose={() => setDetailMatch(null)} allMatches={result?.matches} />
      )}
    </Layout>
  );
};

export default ScreeningPage;