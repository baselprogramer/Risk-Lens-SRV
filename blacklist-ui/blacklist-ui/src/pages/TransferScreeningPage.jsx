import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";
import { Shield, AlertTriangle, CheckCircle, XCircle, ArrowRight, Scale, FileText, Send, User, Eye } from "lucide-react";
import { getPersonDetails } from "../services/searchService";
import { COUNTRIES } from "../config/countries";


const API = `${API_V1}/transfer`;
const DECISIONS_API = `${API_V1}/decisions`;
const token = () => localStorage.getItem("jwtToken");
const authHeaders = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${token()}` });
const isAdmin = () => ["SUPER_ADMIN","COMPANY_ADMIN"].includes(localStorage.getItem("role") || "");

const ACTION_CFG = {
  APPROVE:{ color:"#10b981", bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.25)", label:"APPROVED" },
  REVIEW: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.25)", label:"REVIEW"   },
  BLOCK:  { color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.25)",  label:"BLOCKED"  },
};
const RISK_CFG = {
  VERY_LOW:{color:"#10b981"},LOW:{color:"#60a5fa"},
  MEDIUM:{color:"#f59e0b"},HIGH:{color:"#f97316"},CRITICAL:{color:"#ef4444"},
};
const DECISIONS = [
  {value:"TRUE_MATCH",     label:"True Match",     color:"#ef4444"},
  {value:"FALSE_POSITIVE", label:"False Positive", color:"#10b981"},
  {value:"PENDING_REVIEW", label:"Pending Review", color:"#f59e0b"},
  {value:"RISK_ACCEPTED",  label:"Risk Accepted",  color:"#00d4ff"},
];
const DEC_ICONS = {
  TRUE_MATCH:     <XCircle size={13}/>,
  FALSE_POSITIVE: <CheckCircle size={13}/>,
  PENDING_REVIEW: <AlertTriangle size={13}/>,
  RISK_ACCEPTED:  <Shield size={13}/>,
};

const SOURCE_COLORS = {
  OFAC:"#ef4444", EU:"#8b5cf6", UN:"#3b82f6", UK:"#00d4ff",
  LOCAL:"#10b981", PEP:"#a78bfa", INTERPOL:"#f97316", WORLD_BANK:"#10b981",
};

// ── Match Detail Modal ────────────────────────────────────────────
function MatchDetailModal({ match, onClose }) {
  const [details,  setDetails]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const srcColor = SOURCE_COLORS[match.source] || "#7a8fa8";
  const isPep = match.source === "PEP" || match.pep === true;

  useEffect(() => {
    (async () => {
      
      if (isPep) {
        try {
          const token = localStorage.getItem("jwtToken");
          const res = await fetch(
            `${API_V1}/search?q=${encodeURIComponent(match.matchedName)}&threshold=0.8&page=0&size=5`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const results = await res.json();
          const pepResult = results.find(r => r.source === "PEP");
          
          if (pepResult) {
            setDetails({
              name:       pepResult.name || match.matchedName,
              notes:      pepResult.notes || match.notes || "Politically Exposed Person",
              wikidataId: pepResult.wikidataId || pepResult.sanctionId || match.wikidataId,
            });
          } else {
            setDetails({
              name:       match.matchedName,
              notes:      match.notes || "Politically Exposed Person",
              wikidataId: match.wikidataId || null,
            });
          }
        } catch (e) {
          setDetails({
            name:       match.matchedName,
            notes:      match.notes || "Politically Exposed Person",
            wikidataId: match.wikidataId || null,
          });
        }
        setLoading(false);
        return;
      }
      try {
      // ← ابحث بالاسم لو ما في ID
      if (!match.sanctionId && !match.id) {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(
          `${API_V1}/search?q=${encodeURIComponent(match.matchedName)}&threshold=0.9&page=0&size=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const results = await res.json();
        // لاقي أقرب نتيجة من نفس الـ source
        const found = results.find(r =>
          (r.source || "").toUpperCase() === (match.source || "").toUpperCase()
        );
        if (found) {
          const d = await getPersonDetails(found.id, found.source);
          setDetails(d);
        } else {
          setDetails(null);
        }
        setLoading(false);
        return;
      }

      // لو في ID — استخدمه مباشرة
      const sources = (match.source || "").split("|").map(s => s.trim()).filter(s => s && s !== "PEP");
      if (sources.length > 1) {
        const all = await Promise.all(sources.map(s => getPersonDetails(match.sanctionId || match.id, s).catch(() => null)));
        setDetails({ multiSource: true, items: all.filter(Boolean), sources });
      } else {
        const d = await getPersonDetails(match.sanctionId || match.id, match.source);
        setDetails(d);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
    })();
  }, []);

  const renderRow = (label, value, color) => (
    <div key={label} style={{display:"grid",gridTemplateColumns:"130px 1fr",gap:10,
      padding:"9px 10px",borderRadius:7,borderBottom:"1px solid #1a2d4a"}}>
      <div style={{fontSize:11,color:"#7a8fa8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",paddingTop:2}}>{label}</div>
      <div style={{fontSize:13,color:color||"#e2e8f0",fontWeight:600,lineHeight:1.5}}>{value||"—"}</div>
    </div>
  );

  const renderDetails = (d, src) => (
    <div style={{marginBottom:12}}>
      {src && <div style={{fontSize:11,fontWeight:700,color:SOURCE_COLORS[src]||"#00d4ff",
        fontFamily:"'JetBrains Mono',monospace",marginBottom:8,padding:"3px 10px",
        background:`${SOURCE_COLORS[src]||"#00d4ff"}15`,borderRadius:6,display:"inline-block"}}>{src}</div>}
      {renderRow("Full Name",     d?.name || match.matchedName)}
      {renderRow("Aliases",       Array.isArray(d?.aliases) ? d.aliases.map(a => typeof a==="string"?a:[a.firstName,a.lastName].filter(Boolean).join(" ")||"").filter(Boolean).join(" · ") : "—")}
      {renderRow("Date of Birth", Array.isArray(d?.dateOfBirth) ? d.dateOfBirth.map(x=>x.dateOfBirth||x.year||"").filter(Boolean).join(", ") : "—")}
      {renderRow("Nationality",   Array.isArray(d?.nationality) ? d.nationality.map(x=>x.country||x.nationality||"").filter(Boolean).join(", ") : "—")}
      {renderRow("Program",       d?.program || "—")}
      {renderRow("Remarks",       d?.remarks || "—")}
    </div>
  );

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(6,9,18,0.88)",display:"flex",
        alignItems:"center",justifyContent:"center",zIndex:3000,
        backdropFilter:"blur(6px)",padding:"16px"}}>
      <div style={{background:"#0d1321",border:`1px solid #1a2d4a`,borderRadius:16,
        width:"100%",maxWidth:520,maxHeight:"88vh",overflowY:"auto",
        boxShadow:"0 24px 64px rgba(0,0,0,0.6)",animation:"fadeUp .25s ease"}}>
        <div style={{height:2,background:`linear-gradient(90deg,${srcColor},#8b5cf6)`,borderRadius:"16px 16px 0 0"}} />
        <div style={{padding:"18px 20px"}}>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:4,height:24,background:`linear-gradient(180deg,${srcColor},#8b5cf6)`,borderRadius:2}} />
              <span style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{isPep?"PEP Details":"Entity Details"}</span>
              <span style={{padding:"2px 9px",borderRadius:6,fontSize:11,fontWeight:700,
                fontFamily:"'JetBrains Mono',monospace",background:`${srcColor}20`,
                color:srcColor,border:`1px solid ${srcColor}40`}}>
                {match.source}
              </span>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#7a8fa8",cursor:"pointer",display:"flex"}}>
              <XCircle size={18}/>
            </button>
          </div>

          {/* Match Scores */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:"#111c2e",borderRadius:9,padding:"10px 12px",border:"1px solid #1a2d4a"}}>
              <div style={{fontSize:"0.62rem",color:"#3a5a7a",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>Match Score</div>
              <div style={{fontSize:"1.1rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
                color:match.score>=90?"#ef4444":match.score>=75?"#f59e0b":"#10b981"}}>
                {match.score?.toFixed(1)}%
              </div>
            </div>
            <div style={{background:"#111c2e",borderRadius:9,padding:"10px 12px",border:"1px solid #1a2d4a"}}>
              <div style={{fontSize:"0.62rem",color:"#3a5a7a",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>Party</div>
              <div style={{fontSize:"0.88rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
                color:match.party==="SENDER"?"#00d4ff":"#a78bfa"}}>
                {match.party}
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{width:26,height:26,border:"3px solid #1a2d4a",borderTop:`3px solid ${srcColor}`,
                borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block"}} />
            </div>
          )}

          {/* PEP Details */}
          {!loading && isPep && details && (
            <div style={{background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                <User size={14} color="#a78bfa"/>
                <span style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>Politically Exposed Person</span>
              </div>
              {renderRow("Full Name",    details.name || match.matchedName)}
              {renderRow("Description", details.notes || "—")}
              {details.wikidataId && renderRow("Wikidata ID",
                <a href={`https://www.wikidata.org/wiki/${details.wikidataId}`}
                  target="_blank" rel="noreferrer"
                  style={{color:"#00d4ff",textDecoration:"none"}}>
                  {details.wikidataId} ↗
                </a>
              )}
            </div>
          )}

          {/* Multi-source Details */}
          {!loading && !isPep && details?.multiSource && (
            <div>
              {details.items.map((item, idx) => renderDetails(item, details.sources.filter(s=>s!=="PEP")[idx]))}
            </div>
          )}

          {/* Single source Details */}
          {!loading && !isPep && details && !details.multiSource && renderDetails(details)}

          {/* No details */}
          {!loading && !details && (
            <div style={{textAlign:"center",padding:"20px 0",color:"#7a8fa8",fontSize:13}}>
              No details available
            </div>
          )}

          <button onClick={onClose} style={{marginTop:14,width:"100%",
            background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"white",
            padding:"10px",border:"none",borderRadius:9,fontSize:13,fontWeight:700,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <XCircle size={14}/> Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Decision Modal ────────────────────────────────────────────────
function DecisionModal({ screeningId, onClose, onSaved }) {
  const [decision,setDecision]=useState("");
  const [comment, setComment] =useState("");
  const [saving,  setSaving]  =useState(false);
  const [error,   setError]   =useState("");

  const handleSave = async () => {
    if (!decision){setError("Select a decision first");return;}
    setSaving(true);
    try {
      const res = await fetch(DECISIONS_API,{
        method:"POST",headers:authHeaders(),
        body:JSON.stringify({screeningType:"TRANSFER",screeningId,decision,comment}),
      });
      if (!res.ok) throw new Error("Failed");
      onSaved(DECISIONS.find(d=>d.value===decision));
      onClose();
    } catch {setError("Failed to save — try again");}
    finally {setSaving(false);}
  };

  const selected = DECISIONS.find(d=>d.value===decision);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:"16px"}}>
      <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:16,
        padding:"22px",width:"100%",maxWidth:420,position:"relative",overflow:"hidden",
        animation:"fadeUp .25s ease"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:"linear-gradient(90deg,#00d4ff,#8b5cf6)"}} />
        <div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",marginBottom:4,
          display:"flex",alignItems:"center",gap:8}}>
          <Scale size={15} color="#00d4ff"/> Record Decision
        </div>
        <div style={{fontSize:12,color:"#7a8fa8",marginBottom:14}}>Transfer #{screeningId}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {DECISIONS.map(d=>(
            <button key={d.value} onClick={()=>setDecision(d.value)} style={{
              padding:"9px 8px",borderRadius:9,cursor:"pointer",
              background:decision===d.value?`${d.color}20`:"#111c2e",
              border:`1px solid ${decision===d.value?d.color:"#1a2d4a"}`,
              color:decision===d.value?d.color:"#7a8fa8",
              fontSize:12,fontWeight:600,transition:"all .15s",
              display:"flex",alignItems:"center",gap:6}}>
              <span style={{color:decision===d.value?d.color:"#7a8fa8"}}>{DEC_ICONS[d.value]}</span>
              {d.label}
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={e=>setComment(e.target.value)}
          placeholder="Comment (optional)" rows={2}
          style={{width:"100%",padding:"9px 12px",background:"#111c2e",
            border:"1px solid #1a2d4a",borderRadius:9,color:"#e2e8f0",
            fontSize:13,outline:"none",resize:"none",
            fontFamily:"'IBM Plex Sans',sans-serif",boxSizing:"border-box",marginBottom:12}} />
        {error&&<div style={{color:"#ef4444",fontSize:12,marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
          <AlertTriangle size={12}/>{error}
        </div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:"#111c2e",
            border:"1px solid #1a2d4a",color:"#7a8fa8",borderRadius:9,cursor:"pointer",fontSize:13}}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving||!decision} style={{
            flex:1,padding:"9px",
            background:decision?`linear-gradient(135deg,${selected?.color||"#00d4ff"},#8b5cf6)`:"#111c2e",
            border:"none",color:decision?"white":"#7a8fa8",
            borderRadius:9,cursor:decision?"pointer":"not-allowed",
            fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Scale size={13}/>{saving?"Saving...":"Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function TransferScreeningPage() {
  const [tab,           setTab]           = useState("screen");
  const [form,          setForm]          = useState({senderName:"",senderNameAr:"",receiverName:"",receiverNameAr:"",country:"",amount:"",currency:"USD"});
  const [result,        setResult]        = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [history,       setHistory]       = useState([]);
  const [histLoading,   setHistLoading]   = useState(false);
  const [stats,         setStats]         = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [page,          setPage]          = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [showDecision,  setShowDecision]  = useState(false);
  const [savedDecision, setSavedDecision] = useState(null);
  const [modalDecision, setModalDecision] = useState(null);
  const [detailMatch,   setDetailMatch]   = useState(null); // ← جديد

  useEffect(()=>{fetchStats();},[]);
  useEffect(()=>{if(tab==="history")fetchHistory(page);},[tab,page]);

  const fetchStats = async () => {
    try { const r=await fetch(`${API}/stats`,{headers:authHeaders()}); if(r.ok)setStats(await r.json()); } catch{}
  };

  const fetchHistory = async (p) => {
    setHistLoading(true);
    try {
      const r=await fetch(`${API}/history?page=${p}&size=10`,{headers:authHeaders()});
      if(r.ok){const d=await r.json();setHistory(d.content||[]);setTotalPages(d.totalPages||1);}
    } catch(e){setError(e.message);}
    finally{setHistLoading(false);}
  };

  const handleScreen = async () => {
    if(!form.senderName.trim()||!form.receiverName.trim()){setError("Sender and Receiver names are required");return;}
    setLoading(true);setError(null);setResult(null);setSavedDecision(null);
    try {
      const res=await fetch(`${API}/screen`,{method:"POST",headers:authHeaders(),
        body:JSON.stringify({...form,amount:form.amount?parseFloat(form.amount):null})});
      if(res.status===403)throw new Error("Access denied (403)");
      if(res.status===401)throw new Error("Unauthorized — please login again");
      const text=await res.text();
      if(!text)throw new Error("Empty response from server");
      const data=JSON.parse(text);
      if(!res.ok)throw new Error(data.message||`Error ${res.status}`);
      setResult(data);fetchStats();
    } catch(e){setError(e.message);}
    finally{setLoading(false);}
  };

  const openDetail = async (id) => {
    try {
      const r=await fetch(`${API}/${id}`,{headers:authHeaders()});
      if(r.ok){
        setSelected(await r.json());
        setModalDecision(null);
        const d=await fetch(`${DECISIONS_API}/TRANSFER/${id}`,{headers:authHeaders()});
        if(d.ok){const dec=await d.json();if(dec)setModalDecision(DECISIONS.find(x=>x.value===dec.decision));}
      }
    } catch{}
  };

  const ActionIcon = ({ action, size=28 }) => {
    const color = ACTION_CFG[action]?.color || "#7a8fa8";
    if (action==="APPROVE") return <CheckCircle size={size} color={color}/>;
    if (action==="BLOCK")   return <XCircle size={size} color={color}/>;
    return <AlertTriangle size={size} color={color}/>;
  };

  const renderMatchRow = (m, i, total, isClickable=false) => {
    const srcColor = SOURCE_COLORS[m.source] || "#7a8fa8";
    return (
      <div key={i}
        onClick={isClickable ? () => setDetailMatch(m) : undefined}
        className={isClickable ? "ts-row" : ""}
        style={{padding:"10px 14px",borderBottom:i<total-1?"1px solid #111c2e":"none",
          display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",
          transition:"background .15s",
          cursor:isClickable?"pointer":"default"}}>
        <span style={{padding:"2px 7px",borderRadius:5,fontSize:"0.66rem",fontWeight:700,
          fontFamily:"'JetBrains Mono',monospace",
          background:m.party==="SENDER"?"rgba(0,212,255,.1)":"rgba(139,92,246,.1)",
          color:m.party==="SENDER"?"#00d4ff":"#a78bfa"}}>{m.party}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"0.82rem",fontWeight:600,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.matchedName}</div>
          <div style={{fontSize:"0.7rem",color:"#7a8fa8",display:"flex",alignItems:"center",gap:5}}>
            <span style={{padding:"1px 6px",borderRadius:4,fontSize:"0.62rem",fontWeight:700,
              background:`${srcColor}15`,color:srcColor,border:`1px solid ${srcColor}30`,
              fontFamily:"'JetBrains Mono',monospace"}}>{m.source}</span>
            {m.country && <span>{m.country}</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:"0.82rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
            color:m.score>=90?"#ef4444":m.score>=75?"#f59e0b":"#10b981"}}>{m.score?.toFixed(1)}%</div>
          {isClickable && (
            <div style={{padding:"3px 8px",borderRadius:6,background:"rgba(0,212,255,0.08)",
              border:"1px solid rgba(0,212,255,0.2)",color:"#00d4ff",fontSize:"0.68rem",
              fontWeight:600,display:"flex",alignItems:"center",gap:3}}>
              <Eye size={10}/> View
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .ts-inp{background:#111c2e;border:1px solid #1a2d4a;border-radius:9px;padding:10px 14px;color:#e2e8f0;font-size:.85rem;outline:none;width:100%;transition:all .2s;}
        .ts-inp:focus{border-color:rgba(0,212,255,.45)!important;box-shadow:0 0 0 3px rgba(0,212,255,.07);}
        .ts-inp::placeholder{color:#3a5a7a;}
        .ts-row:hover{background:rgba(0,212,255,.04)!important;}
        .ts-tab{background:transparent;border:none;cursor:pointer;transition:all .2s;}
        .skeleton{background:linear-gradient(90deg,#111c2e 25%,#1a2d4a 50%,#111c2e 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px;}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;}
        .modal{background:#0d1321;border:1px solid #1a2d4a;border-radius:16px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;}
        .dec-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
        .ts-screen-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .ts-stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;}
        .ts-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .ts-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .ts-history-wrap{overflow-x:auto;}
        .ts-history-table{width:100%;border-collapse:collapse;min-width:750px;}
        .ts-history-cards{display:none;}
        .ts-modal-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        @media(max-width:768px){
          .ts-screen-grid{grid-template-columns:1fr!important;}
          .ts-stats-grid{grid-template-columns:repeat(3,1fr)!important;gap:8px!important;}
          .ts-result-grid{grid-template-columns:1fr 1fr!important;}
          .ts-detail-grid{grid-template-columns:1fr 1fr!important;}
          .ts-history-wrap{display:none!important;}
          .ts-history-cards{display:block!important;}
          .page-title{font-size:1.2rem!important;}
        }
        @media(max-width:480px){
          .ts-stats-grid{grid-template-columns:repeat(3,1fr)!important;}
          .ts-result-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      <Layout>
        <div style={{maxWidth:1200,margin:"0 auto",animation:"fadeUp .4s ease"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:4,height:34,background:"linear-gradient(180deg,#00d4ff,#8b5cf6)",borderRadius:4}} />
              <div>
                <h2 className="page-title" style={{margin:0,fontSize:"1.5rem",fontWeight:700,color:"#e2e8f0"}}>Transfer Screening</h2>
                <p style={{margin:0,fontSize:"0.75rem",color:"#7a8fa8",marginTop:2}}>Real-time sanctions screening</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,background:"rgba(16,185,129,.08)",
              border:"1px solid rgba(16,185,129,.25)",padding:"5px 12px",borderRadius:20}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",animation:"pulse 1.5s infinite"}} />
              <span style={{fontSize:"0.7rem",fontWeight:700,color:"#10b981",fontFamily:"'JetBrains Mono',monospace"}}>LIVE</span>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="ts-stats-grid">
              {[
                {label:"Total",   value:stats.total,    color:"#00d4ff", Icon:FileText   },
                {label:"Approved",value:stats.approved, color:"#10b981", Icon:CheckCircle},
                {label:"Review",  value:stats.reviewed, color:"#f59e0b", Icon:AlertTriangle},
                {label:"Blocked", value:stats.blocked,  color:"#ef4444", Icon:XCircle   },
                {label:"Today",   value:stats.today,    color:"#8b5cf6", Icon:Shield     },
              ].map(s=>(
                <div key={s.label} style={{background:"#0d1321",border:`1px solid ${s.color}22`,
                  borderRadius:11,padding:"11px 14px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:.6}} />
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div style={{fontSize:"0.66rem",color:"#7a8fa8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px"}}>{s.label}</div>
                    <s.Icon size={13} color={s.color} style={{opacity:.6}}/>
                  </div>
                  <div style={{fontSize:"1.5rem",fontWeight:700,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>
                    {s.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{display:"flex",gap:4,marginBottom:18,background:"#0d1321",
            border:"1px solid #1a2d4a",borderRadius:12,padding:4,width:"fit-content"}}>
            {[
              {id:"screen",  label:"Screen",  Icon:Shield  },
              {id:"history", label:"History", Icon:FileText},
            ].map(t=>(
              <button key={t.id} className="ts-tab" onClick={()=>setTab(t.id)}
                style={{padding:"8px 18px",borderRadius:9,fontSize:"0.84rem",fontWeight:600,
                  display:"flex",alignItems:"center",gap:6,
                  color:tab===t.id?"#060912":"#7a8fa8",
                  background:tab===t.id?"linear-gradient(135deg,#00d4ff,#8b5cf6)":"transparent"}}>
                <t.Icon size={13}/>{t.label}
              </button>
            ))}
          </div>

          {/* ── SCREEN TAB ── */}
          {tab==="screen" && (
            <div className="ts-screen-grid">
              <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"12px 18px",borderBottom:"1px solid #1a2d4a",
                  background:"rgba(0,212,255,.03)",display:"flex",alignItems:"center",gap:8}}>
                  <Send size={13} color="#7a8fa8"/>
                  <span style={{fontSize:"0.75rem",fontWeight:700,color:"#7a8fa8",textTransform:"uppercase",letterSpacing:"0.6px"}}>Transfer Details</span>
                </div>
                <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
                  {[
                    {key:"senderName",   label:"Sender Name *",      placeholder:"Full name in English",dir:"ltr"},
                    {key:"senderNameAr", label:"اسم المرسل (عربي)",  placeholder:"الاسم بالعربية",      dir:"rtl"},
                  ].map(f=>(
                    <div key={f.key}>
                      <label style={{fontSize:"0.7rem",fontWeight:700,color:"#3a5a7a",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5}}>{f.label}</label>
                      <input className="ts-inp" value={form[f.key]} dir={f.dir}
                        onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}/>
                    </div>
                  ))}
                  <div style={{height:1,background:"#1a2d4a"}}/>
                  {[
                    {key:"receiverName",   label:"Receiver Name *",     placeholder:"Full name in English",dir:"ltr"},
                    {key:"receiverNameAr", label:"اسم المستفيد (عربي)", placeholder:"الاسم بالعربية",      dir:"rtl"},
                  ].map(f=>(
                    <div key={f.key}>
                      <label style={{fontSize:"0.7rem",fontWeight:700,color:"#3a5a7a",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5}}>{f.label}</label>
                      <input className="ts-inp" value={form[f.key]} dir={f.dir}
                        onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}/>
                    </div>
                  ))}
                  <div style={{height:1,background:"#1a2d4a"}}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
                    <div>
                      <label style={{fontSize:"0.7rem",fontWeight:700,color:"#3a5a7a",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5}}>Amount</label>
                      <input className="ts-inp" type="number" value={form.amount}
                        onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0.00"/>
                    </div>
                    <div>
                      <label style={{fontSize:"0.7rem",fontWeight:700,color:"#3a5a7a",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5}}>CCY</label>
                      <select className="ts-inp" value={form.currency} style={{width:80}}
                        onChange={e=>setForm(p=>({...p,currency:e.target.value}))}>
                        {["USD","EUR","GBP","SAR","AED","KWD","JOD","EGP"].map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                  <label style={{fontSize:"0.7rem",fontWeight:700,color:"#3a5a7a",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:5}}>Country (FATF Risk)</label>
               <select className="ts-inp" value={form.country}
                  onChange={e=>setForm(p=>({...p,country:e.target.value}))}>
                  <option value="">— Select Country —</option>
                  {COUNTRIES.map(c=>(
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
                </div>
                  {error&&(
                    <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",
                      borderRadius:9,padding:"9px 12px",color:"#ef4444",fontSize:"0.8rem",
                      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={13}/>{error}</div>
                      <button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",display:"flex"}}>
                        <XCircle size={14}/>
                      </button>
                    </div>
                  )}
                  <button onClick={handleScreen} disabled={loading}
                    style={{padding:"12px",borderRadius:10,border:"none",cursor:loading?"not-allowed":"pointer",
                      background:loading?"#1a2d4a":"linear-gradient(135deg,#00d4ff,#8b5cf6)",
                      color:loading?"#7a8fa8":"#060912",fontWeight:700,fontSize:"0.92rem",transition:"all .2s",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {loading
                      ? <><div style={{width:16,height:16,border:"2px solid rgba(0,212,255,.3)",borderTop:"2px solid #00d4ff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/> Screening...</>
                      : <><Shield size={16}/> Screen Transfer</>
                    }
                  </button>
                </div>
              </div>

              {/* Result */}
              <div>
                {!result&&!loading&&(
                  <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,
                    minHeight:300,display:"flex",alignItems:"center",justifyContent:"center",
                    flexDirection:"column",gap:10,padding:40,color:"#3a5a7a"}}>
                    <Shield size={40} style={{opacity:.3}}/>
                    <div style={{fontSize:"0.88rem",fontWeight:600}}>Awaiting Transfer</div>
                    <div style={{fontSize:"0.73rem",textAlign:"center",maxWidth:200}}>Fill in the details and click Screen</div>
                  </div>
                )}
                {loading&&(
                  <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,
                    minHeight:300,display:"flex",alignItems:"center",justifyContent:"center",
                    flexDirection:"column",gap:14,padding:40}}>
                    <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid #1a2d4a",borderTopColor:"#00d4ff",animation:"spin 0.8s linear infinite"}}/>
                    <div style={{fontSize:"0.82rem",color:"#7a8fa8"}}>Screening against sanctions lists...</div>
                  </div>
                )}
                {result&&!loading&&(()=>{
                  const cfg=ACTION_CFG[result.action]||ACTION_CFG.REVIEW;
                  const riskCfg=RISK_CFG[result.riskLevel]||{color:"#7a8fa8"};
                  return (
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      <div style={{background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:14,padding:"18px 20px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14,flexWrap:"wrap"}}>
                          <div style={{color:cfg.color}}><ActionIcon action={result.action} size={32}/></div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:"1.6rem",fontWeight:800,color:cfg.color,fontFamily:"'JetBrains Mono',monospace"}}>{cfg.label}</div>
                            <div style={{fontSize:"0.75rem",color:"#7a8fa8",marginTop:2}}>{result.reason}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:"0.62rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>REF</div>
                            <div style={{fontSize:"0.75rem",fontWeight:700,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace"}}>{result.reference}</div>
                            <div style={{fontSize:"0.62rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>{result.processingMs}ms</div>
                          </div>
                        </div>
                        <div style={{paddingTop:12,borderTop:`1px solid ${cfg.border}`,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          {savedDecision&&(
                            <div style={{padding:"5px 12px",borderRadius:8,background:`${savedDecision.color}15`,border:`1px solid ${savedDecision.color}44`,display:"flex",alignItems:"center",gap:5}}>
                              <span style={{color:savedDecision.color}}>{DEC_ICONS[savedDecision.value]}</span>
                              <span style={{fontSize:11,fontWeight:700,color:savedDecision.color,fontFamily:"'JetBrains Mono',monospace"}}>{savedDecision.label}</span>
                            </div>
                          )}
                          {isAdmin()&&(
                            <button className="dec-btn" onClick={()=>setShowDecision(true)} style={{
                              background:"linear-gradient(135deg,#f59e0b,#8b5cf6)",
                              border:"none",color:"white",padding:"8px 16px",
                              borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700,
                              transition:"all .2s",boxShadow:"0 4px 14px rgba(245,158,11,0.25)",
                              display:"flex",alignItems:"center",gap:6}}>
                              <Scale size={13}/> Record Decision
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="ts-result-grid">
                        <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:11,padding:"12px 16px"}}>
                          <div style={{fontSize:"0.63rem",color:"#3a5a7a",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>Risk Level</div>
                          <div style={{fontSize:"1rem",fontWeight:700,color:riskCfg.color,fontFamily:"'JetBrains Mono',monospace"}}>{result.riskLevel}</div>
                        </div>
                        <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:11,padding:"12px 16px"}}>
                          <div style={{fontSize:"0.63rem",color:"#3a5a7a",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>Risk Points</div>
                          <div style={{fontSize:"1rem",fontWeight:700,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace"}}>{result.riskPoints}</div>
                        </div>
                      </div>
                      {result.matches?.length>0&&(
                        <div style={{background:"#0d1321",border:"1px solid rgba(239,68,68,.2)",borderRadius:11,overflow:"hidden"}}>
                          <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(239,68,68,.15)",fontSize:"0.72rem",fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:"0.5px",display:"flex",alignItems:"center",gap:6}}>
                            <AlertTriangle size={13}/> {result.matches.length} Match{result.matches.length>1?"es":""} — <span style={{color:"#7a8fa8",fontWeight:400}}>Click to view details</span>
                          </div>
                          {result.matches.map((m,i) => renderMatchRow(m, i, result.matches.length, true))}
                        </div>
                      )}
                      <button onClick={()=>{setResult(null);setForm({senderName:"",senderNameAr:"",receiverName:"",receiverNameAr:"",country:"",amount:"",currency:"USD"});}}
                        style={{padding:"9px",borderRadius:9,border:"1px solid #1a2d4a",background:"transparent",color:"#7a8fa8",cursor:"pointer",fontSize:"0.8rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <ArrowRight size={13} style={{transform:"rotate(180deg)"}}/> New Screening
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab==="history"&&(
            <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,overflow:"hidden"}}>
              <div style={{padding:"12px 18px",borderBottom:"1px solid #1a2d4a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <FileText size={13} color="#7a8fa8"/>
                  <span style={{fontSize:"0.75rem",fontWeight:700,color:"#7a8fa8",textTransform:"uppercase",letterSpacing:"0.6px"}}>History</span>
                </div>
                <span style={{fontSize:"0.7rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>Page {page+1}/{totalPages}</span>
              </div>
              <div className="ts-history-wrap">
                <table className="ts-history-table">
                  <thead>
                    <tr style={{background:"#111c2e"}}>
                      {["Reference","Sender","Receiver","Amount","Action","Risk","By","Date",""].map(h=>(
                        <th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:"0.62rem",fontWeight:700,color:"#3a5a7a",letterSpacing:"0.7px",borderBottom:"1px solid #1a2d4a",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {histLoading&&Array.from({length:6}).map((_,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #111c2e"}}>
                        {Array.from({length:9}).map((_,j)=>(
                          <td key={j} style={{padding:"11px 14px"}}>
                            <div className="skeleton" style={{height:12,width:j===0?"100px":j===1||j===2?"130px":"60px"}}/>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {!histLoading&&history.map(r=>{
                      const cfg=ACTION_CFG[r.action]||ACTION_CFG.REVIEW;
                      const riskCfg=RISK_CFG[r.riskLevel]||{color:"#7a8fa8"};
                      return (
                        <tr key={r.id} className="ts-row" style={{borderBottom:"1px solid #111c2e",transition:"background .15s"}}>
                          <td style={{padding:"10px 14px",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.72rem",color:"#00d4ff"}}>{r.reference}</td>
                          <td style={{padding:"10px 14px",fontSize:"0.82rem",fontWeight:600,color:"#e2e8f0"}}>{r.senderName}</td>
                          <td style={{padding:"10px 14px",fontSize:"0.82rem",color:"#94a3b8"}}>{r.receiverName}</td>
                          <td style={{padding:"10px 14px",fontSize:"0.76rem",fontFamily:"'JetBrains Mono',monospace",color:"#7a8fa8"}}>
                            {r.amount?`${r.amount.toLocaleString()} ${r.currency}`:"—"}
                          </td>
                          <td style={{padding:"10px 14px"}}>
                            <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.68rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,display:"inline-flex",alignItems:"center",gap:4}}>
                              <ActionIcon action={r.action} size={10}/> {r.action}
                            </span>
                          </td>
                          <td style={{padding:"10px 14px",fontSize:"0.76rem",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:riskCfg.color}}>{r.riskLevel}</td>
                          <td style={{padding:"10px 14px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:5}}>
                              <div style={{width:20,height:20,borderRadius:5,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#00d4ff",fontWeight:700,flexShrink:0}}>
                                {(r.operatorName||r.createdBy||"?").charAt(0).toUpperCase()}
                              </div>
                              <span style={{fontSize:"0.72rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:90}}>
                                {r.operatorName || r.createdBy || "—"}
                              </span>
                            </div>
                          </td>
                          <td style={{padding:"10px 14px",fontSize:"0.71rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                            {r.createdAt?new Date(r.createdAt).toLocaleString():"—"}
                          </td>
                          <td style={{padding:"10px 14px"}}>
                            <button onClick={()=>openDetail(r.id)}
                              style={{padding:"4px 10px",borderRadius:7,border:"1px solid #1a2d4a",background:"transparent",color:"#7a8fa8",cursor:"pointer",fontSize:"0.7rem",display:"flex",alignItems:"center",gap:4}}>
                              <FileText size={11}/> Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!histLoading&&history.length===0&&(
                      <tr><td colSpan={9} style={{padding:"40px",textAlign:"center"}}>
                        <FileText size={32} color="#4a6a8a" style={{marginBottom:8,opacity:.4}}/>
                        <div style={{fontSize:"0.88rem",color:"#4a6a8a"}}>No screenings yet</div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="ts-history-cards">
                {histLoading&&Array.from({length:4}).map((_,i)=>(
                  <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid #111c2e"}}>
                    <div className="skeleton" style={{height:13,width:"60%",marginBottom:8}}/>
                    <div className="skeleton" style={{height:11,width:"40%"}}/>
                  </div>
                ))}
                {!histLoading&&history.map((r,i)=>{
                  const cfg=ACTION_CFG[r.action]||ACTION_CFG.REVIEW;
                  const riskCfg=RISK_CFG[r.riskLevel]||{color:"#7a8fa8"};
                  return (
                    <div key={r.id} style={{padding:"12px 14px",borderBottom:"1px solid #111c2e",animation:`fadeUp .3s ease ${i*.04}s both`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:"0.72rem",color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace"}}>{r.reference}</span>
                        <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.68rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,display:"inline-flex",alignItems:"center",gap:3}}>
                          <ActionIcon action={r.action} size={10}/> {r.action}
                        </span>
                      </div>
                      <div style={{fontSize:"0.84rem",fontWeight:600,color:"#e2e8f0",marginBottom:2}}>{r.senderName}</div>
                      <div style={{fontSize:"0.78rem",color:"#7a8fa8",marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                        <ArrowRight size={11}/> {r.receiverName}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                        {r.amount&&<span style={{fontSize:"0.72rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>{r.amount.toLocaleString()} {r.currency}</span>}
                        <span style={{fontSize:"0.72rem",fontWeight:700,color:riskCfg.color,fontFamily:"'JetBrains Mono',monospace"}}>{r.riskLevel}</span>
                        {(r.operatorName||r.createdBy)&&(
                          <span style={{fontSize:"0.7rem",color:"#7a8fa8",display:"flex",alignItems:"center",gap:3}}>
                            <User size={10}/>{r.operatorName||r.createdBy}
                          </span>
                        )}
                        <span style={{fontSize:"0.7rem",color:"#3a5a7a",marginLeft:"auto",fontFamily:"'JetBrains Mono',monospace"}}>
                          {r.createdAt?new Date(r.createdAt).toLocaleDateString():"—"}
                        </span>
                      </div>
                      <button onClick={()=>openDetail(r.id)}
                        style={{width:"100%",padding:"7px",borderRadius:8,border:"1px solid #1a2d4a",background:"transparent",color:"#7a8fa8",cursor:"pointer",fontSize:"0.78rem",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                        <FileText size={12}/> View Details
                      </button>
                    </div>
                  );
                })}
                {!histLoading&&history.length===0&&(
                  <div style={{padding:"40px 20px",textAlign:"center",color:"#4a6a8a"}}>No screenings yet</div>
                )}
              </div>

              {totalPages>1&&(
                <div style={{padding:"12px 18px",borderTop:"1px solid #1a2d4a",display:"flex",justifyContent:"center",gap:8}}>
                  <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                    style={{padding:"5px 12px",borderRadius:8,border:"1px solid #1a2d4a",background:"#111c2e",color:page===0?"#3a5a7a":"#94a3b8",cursor:page===0?"not-allowed":"pointer",fontSize:"0.78rem"}}>← Prev</button>
                  <span style={{padding:"5px 12px",fontSize:"0.76rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>{page+1}/{totalPages}</span>
                  <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1}
                    style={{padding:"5px 12px",borderRadius:8,border:"1px solid #1a2d4a",background:"#111c2e",color:page===totalPages-1?"#3a5a7a":"#94a3b8",cursor:page===totalPages-1?"not-allowed":"pointer",fontSize:"0.78rem"}}>Next →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>

      {/* Detail Modal — History */}
      {selected&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="modal">
            <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2d4a"}}>
              <div className="ts-modal-header">
                <div>
                  <div style={{fontSize:"0.84rem",fontWeight:700,color:"#e2e8f0"}}>Screening Details</div>
                  <div style={{fontSize:"0.7rem",color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{selected.reference}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  {modalDecision&&(
                    <div style={{padding:"5px 12px",borderRadius:8,background:`${modalDecision.color}15`,border:`1px solid ${modalDecision.color}44`,display:"flex",alignItems:"center",gap:5}}>
                      <span style={{color:modalDecision.color}}>{DEC_ICONS[modalDecision.value]}</span>
                      <span style={{fontSize:11,fontWeight:700,color:modalDecision.color,fontFamily:"'JetBrains Mono',monospace"}}>{modalDecision.label}</span>
                    </div>
                  )}
                  {isAdmin()&&(
                    <button className="dec-btn" onClick={()=>setShowDecision(true)} style={{
                      background:"linear-gradient(135deg,#f59e0b,#8b5cf6)",border:"none",
                      color:"white",padding:"6px 14px",borderRadius:8,cursor:"pointer",
                      fontSize:12,fontWeight:700,transition:"all .2s",display:"flex",alignItems:"center",gap:5}}>
                      <Scale size={12}/> Decision
                    </button>
                  )}
                  <button onClick={()=>setSelected(null)}
                    style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:"5px",color:"#ef4444",cursor:"pointer",display:"flex"}}>
                    <XCircle size={16}/>
                  </button>
                </div>
              </div>
            </div>
            <div style={{padding:18,display:"flex",flexDirection:"column",gap:14}}>
              {(()=>{
                const cfg=ACTION_CFG[selected.action]||ACTION_CFG.REVIEW;
                return (
                  <div style={{background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:11,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{color:cfg.color}}><ActionIcon action={selected.action} size={24}/></div>
                    <div>
                      <div style={{fontSize:"1.2rem",fontWeight:800,color:cfg.color,fontFamily:"'JetBrains Mono',monospace"}}>{cfg.label}</div>
                      <div style={{fontSize:"0.73rem",color:"#7a8fa8",marginTop:2}}>{selected.reason}</div>
                    </div>
                  </div>
                );
              })()}
              <div className="ts-detail-grid">
                {[
                  {label:"Sender",      value:selected.senderName},
                  {label:"Receiver",    value:selected.receiverName},
                  {label:"Amount",      value:selected.amount?`${selected.amount} ${selected.currency}`:"—"},
                  {label:"Country",     value:selected.country||"—"},
                  {label:"Risk Level",  value:selected.riskLevel, color:(RISK_CFG[selected.riskLevel]||{}).color},
                  {label:"Risk Points", value:selected.riskPoints, mono:true},
                  {label:"Speed",       value:`${selected.processingMs}ms`, mono:true},
                  {label:"Screened by", value:selected.createdBy||"—"},
                  ...(selected.operatorName ? [{label:"Operator",value:`${selected.operatorName}${selected.operatorId?` (${selected.operatorId})`:""}`  ,color:"#00d4ff"}] : []),
                ].map(f=>(
                  <div key={f.label} style={{background:"#111c2e",borderRadius:9,padding:"9px 12px",border:"1px solid #1a2d4a"}}>
                    <div style={{fontSize:"0.62rem",color:"#3a5a7a",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{f.label}</div>
                    <div style={{fontSize:"0.84rem",fontWeight:600,fontFamily:f.mono?"'JetBrains Mono',monospace":"inherit",color:f.color||"#e2e8f0"}}>{f.value}</div>
                  </div>
                ))}
              </div>
              {selected.matches?.length>0&&(
                <div style={{background:"#111c2e",borderRadius:11,overflow:"hidden",border:"1px solid rgba(239,68,68,.2)"}}>
                  <div style={{padding:"9px 14px",borderBottom:"1px solid rgba(239,68,68,.15)",fontSize:"0.7rem",fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:"0.5px",display:"flex",alignItems:"center",gap:6}}>
                    <AlertTriangle size={12}/> Matches ({selected.matches.length}) — <span style={{color:"#7a8fa8",fontWeight:400}}>Click to view details</span>
                  </div>
                  {selected.matches.map((m,i) => renderMatchRow(m, i, selected.matches.length, true))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match Detail Modal */}
      {detailMatch && (
        <MatchDetailModal match={detailMatch} onClose={() => setDetailMatch(null)} />
      )}

      {showDecision&&(result||selected)&&(
        <DecisionModal
          screeningId={(result||selected).id}
          onClose={()=>setShowDecision(false)}
          onSaved={(d)=>{if(result)setSavedDecision(d);if(selected)setModalDecision(d);}}
        />
      )}
    </>
  );
}