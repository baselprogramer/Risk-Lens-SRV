import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";
import {
  Briefcase, Plus, Search, RefreshCw, Clock, AlertTriangle,
  CheckCircle, XCircle, ArrowRight, UserCheck, Scale, Eye, User, FileText
} from "lucide-react";
import { getPersonDetails } from "../services/searchService";
import { useLang } from "../context/LangContext";
import { staticContent } from "../locales/content";

const API     = `${API_V1}/cases`;
const DEC_API = `${API_V1}/decisions`;

const isAdmin = () => ["SUPER_ADMIN","COMPANY_ADMIN"].includes(localStorage.getItem("role") || "");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  orange:"#f59e0b", red:"#ef4444", text:"#e2e8f0", text2:"#7a8fa8",
};

const SOURCE_COLORS = {
  OFAC:"#ef4444", EU:"#8b5cf6", UN:"#3b82f6", UK:"#00d4ff",
  LOCAL:"#10b981", PEP:"#a78bfa", INTERPOL:"#f97316", WORLD_BANK:"#10b981",
};

const PRIORITY_CFG = {
  LOW:      { color:"#7a8fa8", dot:"#7a8fa8" },
  MEDIUM:   { color:"#f59e0b", dot:"#f59e0b" },
  HIGH:     { color:"#f97316", dot:"#f97316" },
  CRITICAL: { color:"#ef4444", dot:"#ef4444" },
};

const STATUS_FLOW = ["OPEN","IN_REVIEW","ESCALATED","CLOSED"];

const inp = {
  width:"100%", padding:"9px 12px", background:C.s2,
  border:`1px solid ${C.border}`, borderRadius:8, color:C.text,
  fontSize:13, outline:"none", boxSizing:"border-box",
  fontFamily:"'IBM Plex Sans',sans-serif",
};

// ── DecisionBadge ─────────────────────────────────────────────────────────────
function DecisionBadge({ caseType, screeningId, status, t }) {
  const [dec, setDec] = useState(undefined);

  useEffect(() => {
    if (status === "CLOSED") { setDec(null); return; }
    fetch(`${DEC_API}/${caseType}/${screeningId}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d  => setDec(d || null))
      .catch(() => setDec(null));
  }, [caseType, screeningId, status]);

  if (dec === undefined)
    return <div style={{width:64,height:16,borderRadius:4,background:C.s2,opacity:.4}}/>;

  if (status === "CLOSED") return null;

  if (dec) {
    const cfg = t.decisionCFG[dec.decision];
    if (!cfg) return null;
    return (
      <span style={{
        fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:4,
        background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.color}44`,
        display:"inline-flex",alignItems:"center",gap:3,whiteSpace:"nowrap",
        fontFamily:"'JetBrains Mono',monospace",
      }}>
        {cfg.icon}{cfg.label}
      </span>
    );
  }

  return (
    <span style={{
      fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:4,
      background:"rgba(239,68,68,0.12)",color:C.red,
      border:"1px solid rgba(239,68,68,0.35)",
      display:"inline-flex",alignItems:"center",gap:3,whiteSpace:"nowrap",
      fontFamily:"'JetBrains Mono',monospace",
      animation:"decPulse 2s ease infinite",
    }}>
      <AlertTriangle size={8}/> {t.noDecisionBadge}
    </span>
  );
}

// ── Match Detail Modal ────────────────────────────────────────────────────────
function MatchDetailModal({ match, onClose, t }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const srcColor = SOURCE_COLORS[match.source] || "#7a8fa8";
  const isPep  = match.source === "PEP";
  const hasPep = (match.pep === true || (match.source||"").includes("PEP")) && !isPep;

  useEffect(() => {
    (async () => {
      if (isPep) {
        setDetails({
          name: match.matchedName,
          notes: match.notes || t.pepFullTitle,
          wikidataId: match.wikidataId || null,
        });
        setLoading(false);
        return;
      }
      try {
        const sources = (match.source || "").split("|").map(s => s.trim()).filter(s => s && s !== "PEP");
        let refs = {};
        if (match.sanctionRefs) {
          try { refs = JSON.parse(match.sanctionRefs); } catch {}
        }
        const hasAnyId = match.sanctionId || match.id || Object.keys(refs).length > 0;

        if (!hasAnyId) {
          const token = localStorage.getItem("jwtToken");
          const res = await fetch(
            `${API_V1}/search?q=${encodeURIComponent(match.matchedName)}&threshold=0.75&page=0&size=10`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const results = await res.json();
          if (sources.length > 1) {
            const all = await Promise.all(sources.map(async s => {
              const found = results
                .filter(r => (r.source||"").toUpperCase() === s.toUpperCase())
                .sort((a, b) => b.score - a.score)[0];
              return found ? getPersonDetails(found.id, s).catch(() => null) : null;
            }));
            const valid = all.filter(Boolean);
            setDetails(valid.length > 0 ? { multiSource: true, items: valid, sources } : null);
          } else {
            const found = results
              .filter(r => (r.source||"").toUpperCase() === (sources[0]||"").toUpperCase())
              .sort((a, b) => b.score - a.score)[0];
            setDetails(found ? await getPersonDetails(found.id, sources[0]).catch(() => null) : null);
          }
          setLoading(false);
          return;
        }

        if (sources.length > 1) {
          const all = await Promise.all(sources.map(s => {
            const uuid = refs[s.toUpperCase()] || match.sanctionId || match.id;
            return uuid ? getPersonDetails(uuid, s).catch(() => null) : null;
          }));
          setDetails({ multiSource: true, items: all.filter(Boolean), sources });
        } else {
          const uuid = refs[sources[0]?.toUpperCase()] || match.sanctionId || match.id;
          setDetails(uuid ? await getPersonDetails(uuid, sources[0]).catch(() => null) : null);
        }
      } catch { setDetails(null); }
      finally { setLoading(false); }
    })();
  }, []);

  const renderRow = (label, value) => (
    <div key={label} style={{display:"grid",gridTemplateColumns:"130px 1fr",gap:10,
      padding:"9px 10px",borderRadius:7,borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:11,color:C.text2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",paddingTop:2}}>{label}</div>
      <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{value||"—"}</div>
    </div>
  );

  const renderDetails = (d, src) => {
    if (Array.isArray(d)) d = d[0];
    if (!d) return null;
    const parseDOB = (dob) => { if (!dob) return "—"; try { const arr = typeof dob==="string"?JSON.parse(dob):dob; if (!Array.isArray(arr)) return String(dob); return arr.map(x=>typeof x==="string"?x:x.dateOfBirth||x.year||"").filter(Boolean).join(", ")||"—"; } catch { return String(dob).replace(/[\[\]"\\]/g,"").trim()||"—"; } };
    const parseNat = (nat) => { if (!nat) return "—"; try { const arr = typeof nat==="string"?JSON.parse(nat):nat; if (!Array.isArray(arr)||arr.length===0) return "—"; return arr.map(x=>typeof x==="string"?x:x.country||x.nationality||x.value||"").filter(Boolean).join(", ")||"—"; } catch { return String(nat).replace(/[\[\]"\\]/g,"").trim()||"—"; } };
    const parseAliases = (aliases) => { if (!aliases) return "—"; try { const arr = typeof aliases==="string"?JSON.parse(aliases):aliases; if (!Array.isArray(arr)||arr.length===0) return "—"; return arr.map(a=>typeof a==="string"?a:[a.firstName,a.lastName].filter(Boolean).join(" ")||a.wholeName||a.name||"").filter(Boolean).join(" · ")||"—"; } catch { return String(aliases).replace(/[\[\]"\\]/g,"").trim()||"—"; } };
    const parseProgram = (p) => { if (!p) return "—"; try { let arr=typeof p==="string"?JSON.parse(p):p; if (typeof arr==="string") arr=JSON.parse(arr); return Array.isArray(arr)?arr.join(", "):String(p).replace(/[\[\]"\\]/g,"").trim(); } catch { return String(p).replace(/[\[\]"\\]/g,"").trim()||"—"; } };
    return (
      <div style={{marginBottom:12}}>
        {src && <div style={{fontSize:11,fontWeight:700,color:SOURCE_COLORS[src]||C.cyan,fontFamily:"'JetBrains Mono',monospace",marginBottom:8,padding:"3px 10px",background:`${SOURCE_COLORS[src]||C.cyan}15`,borderRadius:6,display:"inline-block"}}>{src}</div>}
        {renderRow(t.detailsFields.fullName,     d?.name||match.matchedName)}
        {renderRow(t.detailsFields.aliases,       parseAliases(d?.aliases))}
        {renderRow(t.detailsFields.dob, parseDOB(d?.dateOfBirth))}
        {renderRow(t.detailsFields.nationality,   parseNat(d?.nationality))}
        {renderRow(t.detailsFields.program,       parseProgram(d?.program))}
      </div>
    );
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(6,9,18,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(6px)",padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:520,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.6)",animation:"fadeUp .25s ease"}}>
        <div style={{height:2,background:`linear-gradient(90deg,${srcColor},${C.purple})`,borderRadius:"16px 16px 0 0"}} />
        <div style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:4,height:24,background:`linear-gradient(180deg,${srcColor},${C.purple})`,borderRadius:2}} />
              <span style={{fontSize:15,fontWeight:700,color:C.text}}>{isPep?t.pepDetailsTitle:t.entityDetailsTitle}</span>
              <span style={{padding:"2px 9px",borderRadius:6,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:`${srcColor}20`,color:srcColor,border:`1px solid ${srcColor}40`}}>{match.source}</span>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.text2,cursor:"pointer",display:"flex"}}><XCircle size={18}/></button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:C.s2,borderRadius:9,padding:"10px 12px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:"0.62rem",color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{t.matchScoreLabel}</div>
              <div style={{fontSize:"1.1rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:(match.matchScore||match.score||0)>=90?C.red:(match.matchScore||match.score||0)>=75?C.orange:C.green}}>{(match.matchScore||match.score||0).toFixed(1)}%</div>
            </div>
            {match.party && (
              <div style={{background:C.s2,borderRadius:9,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:"0.62rem",color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{t.partyLabel}</div>
                <div style={{fontSize:"0.88rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:match.party==="SENDER"?C.cyan:"#a78bfa"}}>{match.party}</div>
              </div>
            )}
          </div>
          {loading&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{width:26,height:26,border:`3px solid ${C.border}`,borderTop:`3px solid ${srcColor}`,borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block"}}/></div>}
          {!loading&&isPep&&details&&(
            <div style={{background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><User size={14} color="#a78bfa"/><span style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>{t.pepFullTitle}</span></div>
              {renderRow(t.detailsFields.fullName,    details.name||match.matchedName)}
              {renderRow(t.detailsFields.description, details.notes||"—")}
              {details.wikidataId&&renderRow(t.detailsFields.wikidataId,<a href={`https://www.wikidata.org/wiki/${details.wikidataId}`} target="_blank" rel="noreferrer" style={{color:C.cyan,textDecoration:"none"}}>{details.wikidataId} ↗</a>)}
            </div>
          )}
          {!loading&&!isPep&&details?.multiSource&&<div>{details.items.map((item,idx)=>renderDetails(item,details.sources.filter(s=>s!=="PEP")[idx]))}</div>}
          {!loading&&!isPep&&details&&!details.multiSource&&renderDetails(details)}
          {!loading&&!isPep&&hasPep&&(
            <div style={{marginTop:12,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><User size={14} color="#a78bfa"/><span style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>{t.pepFullTitle}</span></div>
              {renderRow(t.detailsFields.description,match.notes||"—")}
              {match.wikidataId&&renderRow(t.detailsFields.wikidataId,<a href={`https://www.wikidata.org/wiki/${match.wikidataId}`} target="_blank" rel="noreferrer" style={{color:C.cyan,textDecoration:"none"}}>{match.wikidataId} ↗</a>)}
            </div>
          )}
          {!loading&&!details&&<div style={{textAlign:"center",padding:"20px 0",color:C.text2,fontSize:13}}>{t.noDetailsAvailable}</div>}
          <button onClick={onClose} style={{marginTop:14,width:"100%",background:`linear-gradient(135deg,${C.red},#dc2626)`,color:"white",padding:"10px",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <XCircle size={14}/> {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Case Modal ─────────────────────────────────────────────────────────
function CreateCaseModal({ onClose, onCreated, t }) {
  const [form,   setForm]   = useState({ caseType:"PERSON", screeningId:"", subjectName:"", priority:"MEDIUM", notes:"", dueDate:"" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const handle = e => setForm(p => ({...p, [e.target.name]: e.target.value}));
  const {lang} = useLang()

  const handleSave = async () => {
    if (!form.screeningId||!form.subjectName) { setError(t.errRequiredFields); return; }
    setSaving(true);
    try {
      const res = await fetch(API, { method:"POST", headers:authHeaders(), body:JSON.stringify({...form, screeningId:parseInt(form.screeningId), dueDate:form.dueDate?form.dueDate+"T00:00:00":null}) });
      if (!res.ok) { const tx=await res.text(); throw new Error(tx); }
      onCreated(await res.json()); onClose();
    } catch(e) { setError(e.message||t.errFailed); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px",width:"100%",maxWidth:480,position:"relative",overflow:"hidden",animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:18,display:"flex",alignItems:"center",gap:8}}><Plus size={16} color={C.cyan}/> {t.createTitle}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>{t.caseTypeLabel}</label><select name="caseType" value={form.caseType} onChange={handle} style={inp}><option value="PERSON">{t.caseTypePerson}</option><option value="TRANSFER">{t.caseTypeTransfer}</option></select></div>
            <div><label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>{t.screeningIdLabel}</label><input name="screeningId" value={form.screeningId} onChange={handle} placeholder={t.screeningIdPlaceholder} style={inp} type="number"/></div>
          </div>
          <div><label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>{t.subjectNameLabel}</label><input name="subjectName" value={form.subjectName} onChange={handle} placeholder={t.subjectNamePlaceholder} style={inp}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>{t.priorityLabel}</label><select name="priority" value={form.priority} onChange={handle} style={inp}>
              {Object.entries(t.priorityLabels).map(([val,lbl])=><option key={val} value={val}>{lbl}</option>)}
            </select></div>
          </div>
          <div><label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>{t.dueDateLabel}</label><input name="dueDate" type="date" value={form.dueDate} onChange={handle} style={{...inp,colorScheme:"dark"}}/></div>
          <div><label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>{t.notesLabel}</label><textarea name="notes" value={form.notes} onChange={handle} placeholder={t.notesPlaceholder} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5}}/></div>
        </div>
        {error&&<div style={{color:C.red,fontSize:12,marginTop:10,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={12}/>{error}</div>}
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:C.s2,border:`1px solid ${C.border}`,color:C.text2,borderRadius:9,cursor:"pointer",fontSize:13}}>{t.cancelBtn}</button>
          <button onClick={handleSave} disabled={saving} style={{flex:1,padding:"9px",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,border:"none",color:C.bg,borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Plus size={13}/>{saving?t.creatingBtn:t.createBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Case Detail Modal ─────────────────────────────────────────────────────────
function CaseDetailModal({ caseData, onClose, onUpdated, t, lang }) {
  const [newStatus,     setNewStatus]     = useState(caseData.status);
  const [resolution,    setResolution]    = useState(caseData.resolution||"");
  const [assignedTo,    setAssignedTo]    = useState(caseData.assignedTo||"");
  const [decision,      setDecision]      = useState("");
  const [comment,       setComment]       = useState("");
  const [savedDec,      setSavedDec]      = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [savingDec,     setSavingDec]     = useState(false);
  const [activeTab,     setActiveTab]     = useState("details");
  const [screeningData, setScreeningData] = useState(null);
  const [detailMatch,   setDetailMatch]   = useState(null);

  const admin = isAdmin();
  const sc = t.statusCFG[caseData.status]     || t.statusCFG.OPEN;
  const pc = PRIORITY_CFG[caseData.priority] || PRIORITY_CFG.MEDIUM;
  const isOverdue = caseData.dueDate && new Date(caseData.dueDate) < new Date() && caseData.status !== "CLOSED";

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${DEC_API}/${caseData.caseType}/${caseData.screeningId}`, {headers:authHeaders()});
        if (r.status === 404) return;
        if (r.ok) { const d = await r.json(); if (d) setSavedDec(d); }
      } catch {}
      try {
        const apiUrl = caseData.caseType === "TRANSFER"
          ? `${API_V1}/transfer/${caseData.screeningId}`
          : `${API_V1}/screening/${caseData.screeningId}`;
        const r = await fetch(apiUrl, {headers:authHeaders()});
        if (r.ok) setScreeningData(await r.json());
      } catch {}
    })();
  }, []);

  const handleStatusUpdate = async () => {
    if (newStatus === caseData.status && assignedTo === (caseData.assignedTo||"")) return;
    setSaving(true);
    try {
      if (assignedTo !== (caseData.assignedTo||"")) {
        await fetch(`${API}/${caseData.id}`, { method:"PUT", headers:authHeaders(), body:JSON.stringify({ assignedTo: assignedTo||null }) });
      }
      if (newStatus !== caseData.status) {
        const res = await fetch(`${API}/${caseData.id}/status`, { method:"PUT", headers:authHeaders(), body:JSON.stringify({ status:newStatus, resolution }) });
        if (!res.ok) throw new Error("Failed");
        onUpdated(await res.json());
      } else {
        const res = await fetch(`${API}/${caseData.id}`, {headers:authHeaders()});
        if (res.ok) onUpdated(await res.json());
      }
      onClose();
    } catch {}
    finally { setSaving(false); }
  };

  const handleDecision = async () => {
    if (!decision) return;
    setSavingDec(true);
    try {
      const res = await fetch(DEC_API, { method:"POST", headers:authHeaders(), body:JSON.stringify({ screeningType:caseData.caseType, screeningId:caseData.screeningId, decision, comment }) });
      if (!res.ok) throw new Error("Failed");
      setSavedDec(await res.json());
      setDecision(""); setComment("");
    } catch {}
    finally { setSavingDec(false); }
  };

  const parseSubject = () => {
    if (caseData.caseType === "TRANSFER" && screeningData)
      return { sender: screeningData.senderName || "", receiver: screeningData.receiverName || "" };
    return { name: caseData.subjectName || "" };
  };

  const subject = parseSubject();
  const matches = screeningData?.matches || [];

  const TABS = [
    { id:"details",  label:t.detailTabs.details,  icon:<Briefcase size={12}/> },
    { id:"matches",  label:`${t.detailTabs.matches}${matches.length>0?` (${matches.length})`:""}`, icon:<AlertTriangle size={12}/> },
    { id:"decision", label:t.detailTabs.decision, icon:<Scale size={12}/>, pending: !savedDec && caseData.status !== "CLOSED" },
  ];

  const dateLocale = lang === "ar" ? "ar-EG" : "en-GB";

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",position:"relative",animation:"fadeUp .25s ease"}}>
        <div style={{height:2,background:`linear-gradient(90deg,${sc.color},${C.purple})`,borderRadius:"16px 16px 0 0"}} />
        <div style={{padding:"18px 20px"}}>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{caseData.reference}</span>
                {isOverdue&&<span style={{fontSize:10,fontWeight:700,color:C.red,background:"rgba(239,68,68,0.1)",padding:"1px 7px",borderRadius:5,border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",gap:3}}><AlertTriangle size={9}/>{t.overdueLabel}</span>}
                {savedDec&&<span style={{fontSize:10,fontWeight:700,padding:"1px 8px",borderRadius:5,background:t.decisionCFG[savedDec.decision]?.bg,color:t.decisionCFG[savedDec.decision]?.color,border:`1px solid ${t.decisionCFG[savedDec.decision]?.color}44`,display:"flex",alignItems:"center",gap:4}}>{t.decisionCFG[savedDec.decision]?.icon}{t.decisionCFG[savedDec.decision]?.label}</span>}
                {!savedDec && caseData.status !== "CLOSED" && (
                  <span style={{fontSize:10,fontWeight:700,color:C.red,background:"rgba(239,68,68,0.1)",padding:"1px 7px",borderRadius:5,border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",gap:3,animation:"decPulse 2s ease infinite"}}>
                    <AlertTriangle size={9}/> {t.requiresDecision}
                  </span>
                )}
              </div>
              {caseData.caseType === "TRANSFER" && subject.sender ? (
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:14,fontWeight:700,color:C.cyan}}>{subject.sender}</span>
                  <ArrowRight size={14} color={C.text2}/>
                  <span style={{fontSize:14,fontWeight:700,color:"#a78bfa"}}>{subject.receiver}</span>
                </div>
              ) : (
                <div style={{fontSize:15,fontWeight:700,color:C.text}}>{caseData.subjectName}</div>
              )}
              <div style={{fontSize:11,color:C.text2,marginTop:2}}>{caseData.caseType} · #{caseData.screeningId}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.text2,cursor:"pointer"}}><XCircle size={18}/></button>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:4,marginBottom:16,background:C.s2,borderRadius:10,padding:3}}>
            {TABS.map(tb=>(
              <button key={tb.id} onClick={()=>setActiveTab(tb.id)} style={{flex:1,padding:"7px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,background:activeTab===tb.id?`linear-gradient(135deg,${C.cyan}22,${C.purple}22)`:"transparent",border:`1px solid ${activeTab===tb.id?C.cyan+"44":"transparent"}`,color:activeTab===tb.id?C.cyan:C.text2,display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s",position:"relative"}}>
                {tb.icon}{tb.label}
                {tb.pending && (
                  <span style={{width:6,height:6,borderRadius:"50%",background:C.red,display:"inline-block",animation:"decPulse 2s ease infinite",flexShrink:0}}/>
                )}
              </button>
            ))}
          </div>

          {/* ── Details Tab ── */}
          {activeTab==="details"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[
                  {label:t.detailFieldLabels.status,    value:<span style={{color:sc.color,fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:4}}>{sc.icon}{sc.label}</span>},
                  {label:t.detailFieldLabels.priority,  value:<span style={{color:pc.color,fontWeight:700,fontSize:12}}>{t.priorityLabels[caseData.priority]}</span>},
                  {label:t.detailFieldLabels.createdBy, value:caseData.createdBy||"—"},
                  {label:t.detailFieldLabels.created,   value:caseData.createdAt?new Date(caseData.createdAt).toLocaleDateString():"—",mono:true},
                  {label:t.detailFieldLabels.date, value:caseData.createdAt ? new Date(caseData.createdAt).toLocaleString(dateLocale,{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—", mono:true},
                  {label:t.detailFieldLabels.caseType, value:caseData.caseType,mono:true},
                ].map(f=>(
                  <div key={f.label} style={{background:C.s2,borderRadius:9,padding:"9px 12px",border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>{f.label}</div>
                    {typeof f.value==="string"?<div style={{fontSize:13,fontWeight:600,color:f.color||C.text,fontFamily:f.mono?"'JetBrains Mono',monospace":"inherit"}}>{f.value}</div>:f.value}
                  </div>
                ))}
              </div>
              {caseData.notes&&(<div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 12px",marginBottom:14}}><div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:5}}>{t.notesTitle}</div><div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{caseData.notes}</div></div>)}
              {admin&&caseData.status!=="CLOSED"&&(
                <div style={{background:"rgba(0,212,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:12}}>{t.adminControlsTitle}</div>
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}><UserCheck size={11} style={{display:"inline",marginLeft:4}}/> {t.assignedToLabel}</label>
                    <div style={{width:"100%",padding:"9px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.cyan,fontSize:13,boxSizing:"border-box",display:"flex",alignItems:"center",gap:8}}>
                      <UserCheck size={13} color={C.cyan}/>{caseData.assignedTo||caseData.createdBy||"—"}
                    </div>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>{t.updateStatusLabel}</label>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                      {STATUS_FLOW.map((s,i)=>{
                        const scf=t.statusCFG[s]; const isActive=newStatus===s;
                        return (
                          <div key={s} style={{display:"flex",alignItems:"center",gap:5}}>
                            <button onClick={()=>setNewStatus(s)} style={{padding:"6px 11px",borderRadius:8,cursor:"pointer",background:isActive?`${scf.color}20`:C.s2,border:`1px solid ${isActive?scf.color:C.border}`,color:isActive?scf.color:C.text2,fontSize:11,fontWeight:600,transition:"all .15s",display:"flex",alignItems:"center",gap:4}}>{scf.icon}{scf.label}</button>
                            {i<STATUS_FLOW.length-1&&<ArrowRight size={11} color={C.border} style={{transform: lang==="ar" ? "rotate(180deg)" : "none"}}/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {newStatus==="CLOSED"&&(<textarea value={resolution} onChange={e=>setResolution(e.target.value)} placeholder={t.resolutionPlaceholder} rows={2} style={{width:"100%",padding:"9px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,outline:"none",resize:"none",fontFamily:"'IBM Plex Sans',sans-serif",boxSizing:"border-box",marginBottom:10}}/>)}
                  <button onClick={handleStatusUpdate} disabled={saving||(newStatus===caseData.status&&assignedTo===(caseData.assignedTo||""))} style={{width:"100%",padding:"9px",background:(newStatus===caseData.status&&assignedTo===(caseData.assignedTo||""))?C.s2:`linear-gradient(135deg,${t.statusCFG[newStatus]?.color||C.cyan},${C.purple})`,border:"none",color:(newStatus===caseData.status&&assignedTo===(caseData.assignedTo||""))?C.text2:"white",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <CheckCircle size={13}/>{saving?t.savingBtn:t.saveChangesBtn}
                  </button>
                </div>
              )}
              {caseData.status==="CLOSED"&&caseData.resolution&&(
                <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:9,padding:"10px 12px",marginTop:12}}>
                  <div style={{fontSize:10,color:C.green,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:5,display:"flex",alignItems:"center",gap:5}}><CheckCircle size={11}/> {t.resolutionLabel}</div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{caseData.resolution}</div>
                </div>
              )}
            </>
          )}

          {/* ── Matches Tab ── */}
          {activeTab==="matches"&&(
            <>
              {matches.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:C.text2}}><FileText size={32} style={{opacity:.3,marginBottom:10}}/><div style={{fontSize:13}}>{t.noMatchesData}</div></div>
              ) : (
                <div style={{background:C.s2,border:`1px solid rgba(239,68,68,.2)`,borderRadius:11,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(239,68,68,.15)",fontSize:11,fontWeight:700,color:C.red,textTransform:"uppercase",letterSpacing:"0.5px",display:"flex",alignItems:"center",gap:6}}>
                    <AlertTriangle size={12}/> {matches.length} {matches.length>1?t.matchPlural:t.matchSingular} {t.clickToView}
                  </div>
                  {matches.map((m,i)=>{
                    const srcColor=SOURCE_COLORS[m.source]||C.text2;
                    return (
                      <div key={i} onClick={()=>setDetailMatch(m)} style={{padding:"10px 14px",borderBottom:i<matches.length-1?`1px solid ${C.s2}`:"none",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",cursor:"pointer",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,212,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {m.party&&<span style={{padding:"2px 7px",borderRadius:5,fontSize:"0.66rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:m.party==="SENDER"?"rgba(0,212,255,.1)":"rgba(139,92,246,.1)",color:m.party==="SENDER"?C.cyan:"#a78bfa"}}>{m.party}</span>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.matchedName}</div>
                          <div style={{fontSize:11,color:C.text2,marginTop:2}}><span style={{padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:`${srcColor}15`,color:srcColor,border:`1px solid ${srcColor}30`,fontFamily:"'JetBrains Mono',monospace"}}>{m.source}</span></div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:(m.matchScore||m.score||0)>=90?C.red:(m.matchScore||m.score||0)>=75?C.orange:C.green}}>{(m.matchScore||m.score||0).toFixed(1)}%</div>
                          <div style={{padding:"3px 8px",borderRadius:6,background:"rgba(0,212,255,0.08)",border:"1px solid rgba(0,212,255,0.2)",color:C.cyan,fontSize:10,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Eye size={10}/> {t.viewBtn}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Decision Tab ── */}
          {activeTab==="decision"&&(
            <>
              {!savedDec && caseData.status !== "CLOSED" && (
                <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"flex-start",gap:10}}>
                  <AlertTriangle size={16} color={C.red} style={{flexShrink:0,marginTop:1}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:3}}>{t.noDecisionTitle}</div>
                    <div style={{fontSize:11,color:C.text2,lineHeight:1.5}}>{t.noDecisionSub}</div>
                  </div>
                </div>
              )}
              {savedDec&&(
                <div style={{background:t.decisionCFG[savedDec.decision]?.bg,border:`1px solid ${t.decisionCFG[savedDec.decision]?.color}44`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                  <div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:6}}>{t.lastDecisionLabel}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <span style={{fontSize:13,fontWeight:700,color:t.decisionCFG[savedDec.decision]?.color,display:"flex",alignItems:"center",gap:5}}>{t.decisionCFG[savedDec.decision]?.icon}{t.decisionCFG[savedDec.decision]?.label}</span>
                    <span style={{fontSize:11,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>{savedDec.decidedBy} · {savedDec.decidedAt?new Date(savedDec.decidedAt).toLocaleDateString():"—"}</span>
                  </div>
                  {savedDec.comment&&<div style={{fontSize:12,color:C.text2,marginTop:6}}>"{savedDec.comment}"</div>}
                </div>
              )}
              {admin ? (
                <>
                  <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>{t.recordNewDecisionTitle}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {t.decisions.map(d=>(
                      <button key={d.value} onClick={()=>setDecision(d.value)} style={{padding:"9px 8px",borderRadius:9,cursor:"pointer",background:decision===d.value?`${d.color}20`:C.s2,border:`1px solid ${decision===d.value?d.color:C.border}`,color:decision===d.value?d.color:C.text2,fontSize:12,fontWeight:600,transition:"all .15s",display:"flex",alignItems:"center",gap:5}}>
                        {d.icon}{d.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder={t.decisionCommentPlaceholder} rows={2} style={{width:"100%",padding:"9px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,outline:"none",resize:"none",fontFamily:"'IBM Plex Sans',sans-serif",boxSizing:"border-box",marginBottom:12}}/>
                  <button onClick={handleDecision} disabled={savingDec||!decision} style={{width:"100%",padding:"9px",background:decision?`linear-gradient(135deg,${t.decisions.find(d=>d.value===decision)?.color||C.cyan},${C.purple})`:C.s2,border:"none",color:decision?"white":C.text2,borderRadius:9,cursor:decision?"pointer":"not-allowed",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <Scale size={13}/>{savingDec?t.savingBtn:t.saveDecisionBtn}
                  </button>
                </>
              ) : (
                <div style={{textAlign:"center",padding:"30px 20px",color:C.text2}}><Scale size={32} style={{opacity:.3,marginBottom:12}}/><div style={{fontSize:13}}>{t.adminOnlyDecision}</div></div>
              )}
            </>
          )}
        </div>
      </div>
      {detailMatch&&<MatchDetailModal match={detailMatch} onClose={()=>setDetailMatch(null)} t={t}/>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CaseManagementPage() {
  const [cases,      setCases]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("ALL");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selected,   setSelected]   = useState(null);

  const { lang } = useLang();
  const t = staticContent.cases[lang];

  useEffect(()=>{fetchStats();},[]);
  useEffect(()=>{fetchCases();},[filter,page]);

  const fetchStats = async () => {
    try { const r=await fetch(`${API}/stats`,{headers:authHeaders()}); if(r.ok)setStats(await r.json()); } catch {}
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const url = filter==="ALL" ? `${API}?page=${page}&size=10` : `${API}/status/${filter}?page=${page}&size=10`;
      const r = await fetch(url,{headers:authHeaders()});
      if(r.ok){ const d=await r.json(); setCases(d.content||[]); setTotalPages(d.totalPages||1); }
    } catch {} finally{setLoading(false);}
  };

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q.trim()){fetchCases();return;}
    try {
      const r=await fetch(`${API}/search?q=${encodeURIComponent(q)}&page=0&size=10`,{headers:authHeaders()});
      if(r.ok){const d=await r.json();setCases(d.content||[]);setTotalPages(d.totalPages||1);}
    } catch {}
  };

  const handleCreated = (c) => { setCases(p=>[c,...p]); fetchStats(); };
  const handleUpdated = (u) => { setCases(p=>p.map(c=>c.id===u.id?u:c)); fetchStats(); };

  const renderSubject = (c) => {
    if (c.caseType === "TRANSFER" && c.subjectName && c.subjectName.includes("→")) {
      const parts = c.subjectName.split("→").map(s => s.trim());
      return (
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:13,fontWeight:600,color:C.cyan,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:70}}>{parts[0]}</span>
          <ArrowRight size={11} color={C.text2} style={{flexShrink:0, transform: lang==="ar" ? "rotate(180deg)" : "none"}}/>
          <span style={{fontSize:13,fontWeight:600,color:"#a78bfa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:70}}>{parts[1]}</span>
        </div>
      );
    }
    return <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{c.subjectName}</div>;
  };

  const dateLocale = lang === "ar" ? "ar-EG" : "en-GB";

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes decPulse{0%,100%{opacity:1}50%{opacity:0.45}}
        .cm-row:hover{background:rgba(0,212,255,0.03)!important;cursor:pointer;}
        .cm-filter:hover{border-color:rgba(0,212,255,0.3)!important;color:#e2e8f0!important;}
        .cm-card-mob:hover{background:rgba(0,212,255,0.03)!important;}
        .cm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:20px;}
        .cm-table{width:100%;border-collapse:collapse;min-width:700px;}
        .cm-table-wrap{overflow-x:auto;}
        .cm-cards{display:none;}
        @media(max-width:768px){
          .cm-table-wrap{display:none!important;}
          .cm-cards{display:block!important;}
          .cm-stats{grid-template-columns:repeat(3,1fr)!important;}
        }
      `}</style>

      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",animation:"fadeUp .4s ease"}} dir={lang === "ar" ? "rtl" : "ltr"}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:36,background:`linear-gradient(180deg,${C.cyan},${C.purple})`,borderRadius:2}} />
            <div>
              <h2 style={{margin:0,fontSize:20,fontWeight:700,color:C.text}}>{t.pageTitle}</h2>
              <p style={{margin:0,fontSize:12,color:C.text2,marginTop:2}}>{t.pageSubtitle}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{fetchCases();fetchStats();}} style={{padding:"8px 12px",background:C.s2,border:`1px solid ${C.border}`,color:C.text2,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={13}/></button>
            {isAdmin()&&(<button onClick={()=>setShowCreate(true)} style={{padding:"8px 16px",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,border:"none",color:C.bg,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,boxShadow:`0 4px 14px rgba(0,212,255,0.22)`}}><Plus size={14}/> {t.newCaseBtn}</button>)}
          </div>
        </div>

        {stats&&(
          <div className="cm-stats">
            {t.statsLabels.map(s=>(
              <div key={s.key} style={{background:C.s1,border:`1px solid ${s.color}22`,borderRadius:11,padding:"11px 12px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:.6}} />
                <div style={{fontSize:10,color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:19,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{stats[s.key]}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",flex:1}}>
            {t.filters.map(f=>(
              <button key={f.value} className="cm-filter" onClick={()=>{setFilter(f.value);setPage(0);}} style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,background:filter===f.value?`${f.color}15`:C.s2,border:`1px solid ${filter===f.value?f.color:C.border}`,color:filter===f.value?f.color:C.text2,transition:"all .15s"}}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{position:"relative"}}>
            <Search size={13} color="#3a5a7a" style={{position:"absolute",left: lang==="ar" ? "auto" : 10, right: lang==="ar" ? 10 : "auto",top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            <input value={search} onChange={e=>handleSearch(e.target.value)} placeholder={t.searchPlaceholder} style={{padding: lang==="ar" ? "7px 30px 7px 12px" : "7px 12px 7px 30px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:12,outline:"none",width:200}}/>
          </div>
        </div>

        <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr style={{background:C.s2}}>
                  {t.tableHeaders.map((h,idx)=>(
                    <th key={idx} style={{padding:"10px 14px",textAlign: lang==="ar" ? "right" : "left",fontSize:10,color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading&&Array.from({length:5}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:9}).map((_,j)=>(
                    <td key={j} style={{padding:"12px 14px"}}><div style={{height:12,borderRadius:4,background:C.s2,width:j===0?"80px":j===1?"150px":"70px"}}/></td>
                  ))}</tr>
                ))}
                {!loading&&cases.map((c,i)=>{
                  const sc=t.statusCFG[c.status]||t.statusCFG.OPEN;
                  const pc=PRIORITY_CFG[c.priority]||PRIORITY_CFG.MEDIUM;
                  return (
                    <tr key={c.id} className="cm-row" onClick={()=>setSelected(c)} style={{borderBottom:`1px solid ${C.s2}`,transition:"background .15s",animation:`fadeUp .3s ease ${i*.03}s both`}}>
                      <td style={{padding:"11px 14px",fontSize:11,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{c.reference}</td>
                      <td style={{padding:"11px 14px"}}>{renderSubject(c)}</td>
                      <td style={{padding:"11px 14px"}}><span style={{fontSize:10,fontWeight:700,color:c.caseType==="PERSON"?C.cyan:C.purple,fontFamily:"'JetBrains Mono',monospace"}}>{c.caseType}</span></td>
                      <td style={{padding:"11px 14px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.icon}{sc.label}</span></td>
                      <td style={{padding:"11px 14px"}}>
                        <DecisionBadge caseType={c.caseType} screeningId={c.screeningId} status={c.status} t={t}/>
                      </td>
                      <td style={{padding:"11px 14px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:"50%",background:pc.dot}}/><span style={{fontSize:11,color:pc.color,fontWeight:600}}>{t.priorityLabels[c.priority]}</span></div></td>
                      <td style={{padding:"11px 14px",fontSize:12,color:C.text2}}>{c.assignedTo?<div style={{display:"flex",alignItems:"center",gap:5}}><UserCheck size={11} color={C.cyan}/><span style={{color:C.cyan,fontWeight:600}}>{c.assignedTo}</span></div>:<span style={{color:"#3a5a7a",fontStyle:"italic"}}>{t.unassigned}</span>}</td>
                      <td style={{padding:"11px 14px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:C.text2}}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString(dateLocale, {
                          day:"2-digit", month:"2-digit", year:"numeric",
                          hour:"2-digit", minute:"2-digit"
                        }) : "—"}
                      </td>
                      <td style={{padding:"11px 14px"}}><ArrowRight size={14} color={C.text2} style={{transform: lang==="ar" ? "rotate(180deg)" : "none"}}/></td>
                    </tr>
                  );
                })}
                {!loading&&cases.length===0&&(
                  <tr><td colSpan={9} style={{padding:"50px 20px",textAlign:"center"}}>
                    <Briefcase size={36} color="#3a5a7a" style={{marginBottom:10,opacity:.4}}/>
                    <div style={{fontSize:13,color:C.text2}}>{t.noCasesFound}</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="cm-cards">
            {!loading&&cases.map((c,i)=>{
              const sc=t.statusCFG[c.status]||t.statusCFG.OPEN;
              const pc=PRIORITY_CFG[c.priority]||PRIORITY_CFG.MEDIUM;
              return (
                <div key={c.id} className="cm-card-mob" onClick={()=>setSelected(c)} style={{padding:"13px 15px",borderBottom:`1px solid ${C.s2}`,transition:"background .15s",cursor:"pointer",animation:`fadeUp .3s ease ${i*.04}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{flex:1,minWidth:0}}>
                      {renderSubject(c)}
                      <div style={{fontSize:10,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{c.reference}</div>
                    </div>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,flexShrink:0,marginLeft:8,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.icon}{sc.label}</span>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:pc.dot}}/><span style={{fontSize:11,color:pc.color}}>{t.priorityLabels[c.priority]}</span></div>
                    <span style={{fontSize:11,color:C.text2}}>{c.caseType}</span>
                    {c.assignedTo&&<span style={{fontSize:11,color:C.text2,display:"flex",alignItems:"center",gap:3}}><UserCheck size={10}/>{c.assignedTo}</span>}
                    <DecisionBadge caseType={c.caseType} screeningId={c.screeningId} status={c.status} t={t}/>
                    <ArrowRight size={12} color={C.text2} style={{marginLeft:"auto", transform: lang==="ar" ? "rotate(180deg)" : "none"}}/>
                  </div>
                </div>
              );
            })}
            {!loading&&cases.length===0&&<div style={{padding:"40px 20px",textAlign:"center",color:C.text2,fontSize:13}}>{t.noCasesFound}</div>}
          </div>

          {totalPages>1&&(
            <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"center",alignItems:"center",gap:8}}>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:"5px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:page===0?C.text2:C.text,cursor:page===0?"not-allowed":"pointer",fontSize:12}}>{t.prevBtn}</button>
              <span style={{fontSize:12,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>{page+1}/{totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{padding:"5px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:page===totalPages-1?C.text2:C.text,cursor:page===totalPages-1?"not-allowed":"pointer",fontSize:12}}>{t.nextBtn}</button>
            </div>
          )}
        </div>
      </div>

      {showCreate&&<CreateCaseModal onClose={()=>setShowCreate(false)} onCreated={handleCreated} t={t}/>}
      {selected&&<CaseDetailModal caseData={selected} onClose={()=>setSelected(null)} onUpdated={handleUpdated} t={t} lang={lang}/>}
    </Layout>
  );
}