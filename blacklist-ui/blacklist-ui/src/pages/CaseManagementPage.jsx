import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";
import {
  Briefcase, Plus, Search, RefreshCw, Clock, AlertTriangle,
  CheckCircle, XCircle, ArrowRight, UserCheck, Scale
} from "lucide-react";

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

const STATUS_CFG = {
  OPEN:      { color:"#00d4ff", bg:"rgba(0,212,255,0.1)",  border:"rgba(0,212,255,0.3)",  icon:<Clock size={11}/>,         label:"Open"      },
  IN_REVIEW: { color:"#f59e0b", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.3)", icon:<Search size={11}/>,        label:"In Review" },
  ESCALATED: { color:"#ef4444", bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.3)",  icon:<AlertTriangle size={11}/>, label:"Escalated" },
  CLOSED:    { color:"#10b981", bg:"rgba(16,185,129,0.1)", border:"rgba(16,185,129,0.3)", icon:<CheckCircle size={11}/>,   label:"Closed"    },
};

const PRIORITY_CFG = {
  LOW:      { color:"#7a8fa8", dot:"#7a8fa8" },
  MEDIUM:   { color:"#f59e0b", dot:"#f59e0b" },
  HIGH:     { color:"#f97316", dot:"#f97316" },
  CRITICAL: { color:"#ef4444", dot:"#ef4444" },
};

const STATUS_FLOW = ["OPEN","IN_REVIEW","ESCALATED","CLOSED"];

const DECISIONS = [
  { value:"TRUE_MATCH",     label:"True Match",     color:C.red,    icon:<XCircle size={13}/>      },
  { value:"FALSE_POSITIVE", label:"False Positive", color:C.green,  icon:<CheckCircle size={13}/>  },
  { value:"PENDING_REVIEW", label:"Pending Review", color:C.orange, icon:<Clock size={13}/>         },
  { value:"RISK_ACCEPTED",  label:"Risk Accepted",  color:C.cyan,   icon:<AlertTriangle size={13}/> },
];

const DECISION_CFG = {
  TRUE_MATCH:     { color:C.red,    bg:"rgba(239,68,68,0.12)",  icon:<XCircle size={11}/>,      label:"True Match"    },
  FALSE_POSITIVE: { color:C.green,  bg:"rgba(16,185,129,0.12)", icon:<CheckCircle size={11}/>,  label:"False Positive"},
  PENDING_REVIEW: { color:C.orange, bg:"rgba(245,158,11,0.12)", icon:<Clock size={11}/>,         label:"Pending Review"},
  RISK_ACCEPTED:  { color:C.cyan,   bg:"rgba(0,212,255,0.12)",  icon:<AlertTriangle size={11}/>, label:"Risk Accepted" },
};

const inp = {
  width:"100%", padding:"9px 12px", background:C.s2,
  border:`1px solid ${C.border}`, borderRadius:8, color:C.text,
  fontSize:13, outline:"none", boxSizing:"border-box",
  fontFamily:"'IBM Plex Sans',sans-serif",
};

// ── Create Case Modal ─────────────────────────────────────────────────────────
function CreateCaseModal({ onClose, onCreated }) {
  const [form,   setForm]   = useState({ caseType:"PERSON", screeningId:"", subjectName:"", priority:"MEDIUM", assignedTo:"", notes:"", dueDate:"" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const handle = e => setForm(p => ({...p, [e.target.name]: e.target.value}));

  const handleSave = async () => {
    if (!form.screeningId||!form.subjectName) { setError("Screening ID and Subject Name required"); return; }
    setSaving(true);
    try {
      const res = await fetch(API, {
        method:"POST", headers:authHeaders(),
        body:JSON.stringify({...form, screeningId:parseInt(form.screeningId),
          dueDate:form.dueDate?form.dueDate+"T00:00:00":null}),
      });
      if (!res.ok) { const t=await res.text(); throw new Error(t); }
      onCreated(await res.json()); onClose();
    } catch(e) { setError(e.message||"Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,
        padding:"24px",width:"100%",maxWidth:480,position:"relative",overflow:"hidden",
        animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
          <Plus size={16} color={C.cyan}/> Create New Case
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Case Type</label>
              <select name="caseType" value={form.caseType} onChange={handle} style={inp}>
                <option value="PERSON">Person Screening</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Screening ID *</label>
              <input name="screeningId" value={form.screeningId} onChange={handle} placeholder="e.g. 42" style={inp} type="number"/>
            </div>
          </div>
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Subject Name *</label>
            <input name="subjectName" value={form.subjectName} onChange={handle} placeholder="Full name" style={inp}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Priority</label>
              <select name="priority" value={form.priority} onChange={handle} style={inp}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Assign To</label>
              <input name="assignedTo" value={form.assignedTo} onChange={handle} placeholder="username" style={inp}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Due Date</label>
            <input name="dueDate" type="date" value={form.dueDate} onChange={handle} style={{...inp,colorScheme:"dark"}}/>
          </div>
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handle} placeholder="Initial observations..." rows={3}
              style={{...inp,resize:"vertical",lineHeight:1.5}}/>
          </div>
        </div>
        {error&&<div style={{color:C.red,fontSize:12,marginTop:10,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={12}/>{error}</div>}
        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:C.s2,border:`1px solid ${C.border}`,color:C.text2,borderRadius:9,cursor:"pointer",fontSize:13}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{flex:1,padding:"9px",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,border:"none",color:C.bg,borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Plus size={13}/>{saving?"Creating...":"Create Case"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Case Detail Modal ─────────────────────────────────────────────────────────
function CaseDetailModal({ caseData, onClose, onUpdated }) {
  const [newStatus,  setNewStatus]  = useState(caseData.status);
  const [resolution, setResolution] = useState(caseData.resolution||"");
  const [assignedTo, setAssignedTo] = useState(caseData.assignedTo||"");
  const [decision,   setDecision]   = useState("");
  const [comment,    setComment]    = useState("");
  const [savedDec,   setSavedDec]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [savingDec,  setSavingDec]  = useState(false);
  const [activeTab,  setActiveTab]  = useState("details");

  const admin = isAdmin(); // ✅
  const sc = STATUS_CFG[caseData.status]    || STATUS_CFG.OPEN;
  const pc = PRIORITY_CFG[caseData.priority] || PRIORITY_CFG.MEDIUM;
  const isOverdue = caseData.dueDate && new Date(caseData.dueDate) < new Date() && caseData.status !== "CLOSED";

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${DEC_API}/${caseData.caseType}/${caseData.screeningId}`, {headers:authHeaders()});
        if (r.ok) { const d = await r.json(); if (d) setSavedDec(d); }
      } catch(e) {}
    })();
  }, []);

  const handleStatusUpdate = async () => {
    if (newStatus === caseData.status && assignedTo === (caseData.assignedTo||"")) return;
    setSaving(true);
    try {
      if (assignedTo !== (caseData.assignedTo||"")) {
        await fetch(`${API}/${caseData.id}`, {
          method:"PUT", headers:authHeaders(),
          body:JSON.stringify({ assignedTo: assignedTo||null }),
        });
      }
      if (newStatus !== caseData.status) {
        const res = await fetch(`${API}/${caseData.id}/status`, {
          method:"PUT", headers:authHeaders(),
          body:JSON.stringify({ status:newStatus, resolution }),
        });
        if (!res.ok) throw new Error("Failed");
        onUpdated(await res.json());
      } else {
        const res = await fetch(`${API}/${caseData.id}`, {headers:authHeaders()});
        if (res.ok) onUpdated(await res.json());
      }
      onClose();
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDecision = async () => {
    if (!decision) return;
    setSavingDec(true);
    try {
      const res = await fetch(DEC_API, {
        method:"POST", headers:authHeaders(),
        body:JSON.stringify({ screeningType:caseData.caseType, screeningId:caseData.screeningId, decision, comment }),
      });
      if (!res.ok) throw new Error("Failed");
      setSavedDec(await res.json());
      setDecision(""); setComment("");
    } catch(e) { console.error(e); }
    finally { setSavingDec(false); }
  };

  const TABS = [
    { id:"details",  label:"Details",  icon:<Briefcase size={12}/> },
    { id:"decision", label:"Decision", icon:<Scale size={12}/>     },
  ];

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,
        width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",
        position:"relative",animation:"fadeUp .25s ease"}}>
        <div style={{height:2,background:`linear-gradient(90deg,${sc.color},${C.purple})`,borderRadius:"16px 16px 0 0"}} />
        <div style={{padding:"18px 20px"}}>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{caseData.reference}</span>
                {isOverdue&&<span style={{fontSize:10,fontWeight:700,color:C.red,background:"rgba(239,68,68,0.1)",padding:"1px 7px",borderRadius:5,border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",gap:3}}><AlertTriangle size={9}/>OVERDUE</span>}
                {savedDec&&<span style={{fontSize:10,fontWeight:700,padding:"1px 8px",borderRadius:5,background:DECISION_CFG[savedDec.decision]?.bg,color:DECISION_CFG[savedDec.decision]?.color,border:`1px solid ${DECISION_CFG[savedDec.decision]?.color}44`,display:"flex",alignItems:"center",gap:4}}>{DECISION_CFG[savedDec.decision]?.icon}{DECISION_CFG[savedDec.decision]?.label}</span>}
              </div>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>{caseData.subjectName}</div>
              <div style={{fontSize:11,color:C.text2,marginTop:2}}>{caseData.caseType} · #{caseData.screeningId}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.text2,cursor:"pointer"}}><XCircle size={18}/></button>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:4,marginBottom:16,background:C.s2,borderRadius:10,padding:3}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                flex:1,padding:"7px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,
                background:activeTab===t.id?`linear-gradient(135deg,${C.cyan}22,${C.purple}22)`:"transparent",
                border:`1px solid ${activeTab===t.id?C.cyan+"44":"transparent"}`,
                color:activeTab===t.id?C.cyan:C.text2,
                display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ── Details Tab ── */}
          {activeTab==="details"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[
                  {label:"Status",    value:<span style={{color:sc.color,fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:4}}>{sc.icon}{sc.label}</span>},
                  {label:"Priority",  value:<span style={{color:pc.color,fontWeight:700,fontSize:12}}>{caseData.priority}</span>},
                  {label:"Created By",value:caseData.createdBy||"—"},
                  {label:"Created",   value:caseData.createdAt?new Date(caseData.createdAt).toLocaleDateString():"—",mono:true},
                  {label:"Due Date",  value:caseData.dueDate?new Date(caseData.dueDate).toLocaleDateString():"—",color:isOverdue?C.red:undefined,mono:true},
                  {label:"Case Type", value:caseData.caseType,mono:true},
                ].map(f=>(
                  <div key={f.label} style={{background:C.s2,borderRadius:9,padding:"9px 12px",border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>{f.label}</div>
                    {typeof f.value==="string"
                      ?<div style={{fontSize:13,fontWeight:600,color:f.color||C.text,fontFamily:f.mono?"'JetBrains Mono',monospace":"inherit"}}>{f.value}</div>
                      :f.value}
                  </div>
                ))}
              </div>

              {caseData.notes&&(
                <div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 12px",marginBottom:14}}>
                  <div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:5}}>Notes</div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{caseData.notes}</div>
                </div>
              )}

              {/* ✅ Admin Controls — SUPER_ADMIN + COMPANY_ADMIN فقط */}
              {admin&&caseData.status!=="CLOSED"&&(
                <div style={{background:"rgba(0,212,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:12}}>
                    Admin Controls
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>
                      <UserCheck size={11} style={{display:"inline",marginLeft:4}}/> Assign To
                    </label>
                    <input value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}
                      placeholder="Enter username to assign..."
                      style={{width:"100%",padding:"9px 12px",background:C.s2,border:`1px solid ${C.border}`,
                        borderRadius:8,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"'IBM Plex Sans',sans-serif"}}/>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>Update Status</label>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                      {STATUS_FLOW.map((s,i)=>{
                        const scf=STATUS_CFG[s];
                        const isActive=newStatus===s;
                        return (
                          <div key={s} style={{display:"flex",alignItems:"center",gap:5}}>
                            <button onClick={()=>setNewStatus(s)} style={{
                              padding:"6px 11px",borderRadius:8,cursor:"pointer",
                              background:isActive?`${scf.color}20`:C.s2,
                              border:`1px solid ${isActive?scf.color:C.border}`,
                              color:isActive?scf.color:C.text2,
                              fontSize:11,fontWeight:600,transition:"all .15s",
                              display:"flex",alignItems:"center",gap:4}}>
                              {scf.icon}{scf.label}
                            </button>
                            {i<STATUS_FLOW.length-1&&<ArrowRight size={11} color={C.border}/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {newStatus==="CLOSED"&&(
                    <textarea value={resolution} onChange={e=>setResolution(e.target.value)}
                      placeholder="Resolution notes..." rows={2}
                      style={{width:"100%",padding:"9px 12px",background:C.s2,border:`1px solid ${C.border}`,
                        borderRadius:8,color:C.text,fontSize:13,outline:"none",resize:"none",
                        fontFamily:"'IBM Plex Sans',sans-serif",boxSizing:"border-box",marginBottom:10}}/>
                  )}
                  <button onClick={handleStatusUpdate}
                    disabled={saving||(newStatus===caseData.status&&assignedTo===(caseData.assignedTo||""))}
                    style={{width:"100%",padding:"9px",
                      background:(newStatus===caseData.status&&assignedTo===(caseData.assignedTo||""))?C.s2:`linear-gradient(135deg,${STATUS_CFG[newStatus]?.color||C.cyan},${C.purple})`,
                      border:"none",color:(newStatus===caseData.status&&assignedTo===(caseData.assignedTo||""))?C.text2:"white",
                      borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <CheckCircle size={13}/>{saving?"Saving...":"Save Changes"}
                  </button>
                </div>
              )}

              {caseData.status==="CLOSED"&&caseData.resolution&&(
                <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:9,padding:"10px 12px",marginTop:12}}>
                  <div style={{fontSize:10,color:C.green,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:5,display:"flex",alignItems:"center",gap:5}}>
                    <CheckCircle size={11}/> Resolution
                  </div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{caseData.resolution}</div>
                </div>
              )}
            </>
          )}

          {/* ── Decision Tab ── */}
          {activeTab==="decision"&&(
            <>
              {savedDec&&(
                <div style={{background:DECISION_CFG[savedDec.decision]?.bg,border:`1px solid ${DECISION_CFG[savedDec.decision]?.color}44`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                  <div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:6}}>Last Decision</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <span style={{fontSize:13,fontWeight:700,color:DECISION_CFG[savedDec.decision]?.color,display:"flex",alignItems:"center",gap:5}}>
                      {DECISION_CFG[savedDec.decision]?.icon} {DECISION_CFG[savedDec.decision]?.label}
                    </span>
                    <span style={{fontSize:11,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>
                      {savedDec.decidedBy} · {savedDec.decidedAt?new Date(savedDec.decidedAt).toLocaleDateString():"—"}
                    </span>
                  </div>
                  {savedDec.comment&&<div style={{fontSize:12,color:C.text2,marginTop:6}}>"{savedDec.comment}"</div>}
                </div>
              )}

              {/* ✅ Record Decision — ADMIN فقط */}
              {admin ? (
                <>
                  <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Record New Decision</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {DECISIONS.map(d=>(
                      <button key={d.value} onClick={()=>setDecision(d.value)} style={{
                        padding:"9px 8px",borderRadius:9,cursor:"pointer",
                        background:decision===d.value?`${d.color}20`:C.s2,
                        border:`1px solid ${decision===d.value?d.color:C.border}`,
                        color:decision===d.value?d.color:C.text2,
                        fontSize:12,fontWeight:600,transition:"all .15s",
                        display:"flex",alignItems:"center",gap:5}}>
                        {d.icon}{d.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={comment} onChange={e=>setComment(e.target.value)}
                    placeholder="Comment / Reason (optional)" rows={2}
                    style={{width:"100%",padding:"9px 12px",background:C.s2,border:`1px solid ${C.border}`,
                      borderRadius:8,color:C.text,fontSize:13,outline:"none",resize:"none",
                      fontFamily:"'IBM Plex Sans',sans-serif",boxSizing:"border-box",marginBottom:12}}/>
                  <button onClick={handleDecision} disabled={savingDec||!decision} style={{
                    width:"100%",padding:"9px",
                    background:decision?`linear-gradient(135deg,${DECISIONS.find(d=>d.value===decision)?.color||C.cyan},${C.purple})`:C.s2,
                    border:"none",color:decision?"white":C.text2,
                    borderRadius:9,cursor:decision?"pointer":"not-allowed",
                    fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <Scale size={13}/>{savingDec?"Saving...":"Save Decision"}
                  </button>
                </>
              ) : (
                <div style={{textAlign:"center",padding:"30px 20px",color:C.text2}}>
                  <Scale size={32} style={{opacity:.3,marginBottom:12}}/>
                  <div style={{fontSize:13}}>Only Admins can record decisions</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
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

  useEffect(()=>{fetchStats();},[]);
  useEffect(()=>{fetchCases();},[filter,page]);

  const fetchStats = async () => {
    try { const r=await fetch(`${API}/stats`,{headers:authHeaders()}); if(r.ok)setStats(await r.json()); } catch(e){}
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const url = filter==="ALL"
        ? `${API}?page=${page}&size=10`
        : `${API}/status/${filter}?page=${page}&size=10`;
      const r = await fetch(url,{headers:authHeaders()});
      if(r.ok){ const d=await r.json(); setCases(d.content||[]); setTotalPages(d.totalPages||1); }
    } catch(e){} finally{setLoading(false);}
  };

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q.trim()){fetchCases();return;}
    try {
      const r=await fetch(`${API}/search?q=${encodeURIComponent(q)}&page=0&size=10`,{headers:authHeaders()});
      if(r.ok){const d=await r.json();setCases(d.content||[]);setTotalPages(d.totalPages||1);}
    } catch(e){}
  };

  const handleCreated = (c) => { setCases(p=>[c,...p]); fetchStats(); };
  const handleUpdated = (u) => { setCases(p=>p.map(c=>c.id===u.id?u:c)); fetchStats(); };

  const FILTERS = [
    {value:"ALL",      label:"All",       color:C.text2 },
    {value:"OPEN",     label:"Open",      color:C.cyan  },
    {value:"IN_REVIEW",label:"In Review", color:C.orange},
    {value:"ESCALATED",label:"Escalated", color:C.red   },
    {value:"CLOSED",   label:"Closed",    color:C.green },
  ];

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .cm-row:hover{background:rgba(0,212,255,0.03)!important;cursor:pointer;}
        .cm-filter:hover{border-color:rgba(0,212,255,0.3)!important;color:#e2e8f0!important;}
        .cm-card-mob:hover{background:rgba(0,212,255,0.03)!important;}
        .cm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:20px;}
        .cm-table{width:100%;border-collapse:collapse;min-width:650px;}
        .cm-table-wrap{overflow-x:auto;}
        .cm-cards{display:none;}
        @media(max-width:768px){
          .cm-table-wrap{display:none!important;}
          .cm-cards{display:block!important;}
          .cm-stats{grid-template-columns:repeat(3,1fr)!important;}
        }
      `}</style>

      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",animation:"fadeUp .4s ease"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:36,background:`linear-gradient(180deg,${C.cyan},${C.purple})`,borderRadius:2}} />
            <div>
              <h2 style={{margin:0,fontSize:20,fontWeight:700,color:C.text}}>Case Management</h2>
              <p style={{margin:0,fontSize:12,color:C.text2,marginTop:2}}>Track and resolve compliance cases</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{fetchCases();fetchStats();}} style={{padding:"8px 12px",background:C.s2,border:`1px solid ${C.border}`,color:C.text2,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <RefreshCw size={13}/>
            </button>
            {isAdmin()&&( // ✅
              <button onClick={()=>setShowCreate(true)} style={{padding:"8px 16px",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,border:"none",color:C.bg,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,boxShadow:`0 4px 14px rgba(0,212,255,0.22)`}}>
                <Plus size={14}/> New Case
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats&&(
          <div className="cm-stats">
            {[
              {label:"Total",    value:stats.total,    color:C.cyan  },
              {label:"Open",     value:stats.open,     color:C.cyan  },
              {label:"Review",   value:stats.inReview, color:C.orange},
              {label:"Escalated",value:stats.escalated,color:C.red   },
              {label:"Critical", value:stats.critical, color:C.red   },
              {label:"Overdue",  value:stats.overdue,  color:C.red   },
              {label:"Closed",   value:stats.closed,   color:C.green },
            ].map(s=>(
              <div key={s.label} style={{background:C.s1,border:`1px solid ${s.color}22`,borderRadius:11,padding:"11px 12px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:.6}} />
                <div style={{fontSize:10,color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:19,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters + Search */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",flex:1}}>
            {FILTERS.map(f=>(
              <button key={f.value} className="cm-filter" onClick={()=>{setFilter(f.value);setPage(0);}} style={{
                padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,
                background:filter===f.value?`${f.color}15`:C.s2,
                border:`1px solid ${filter===f.value?f.color:C.border}`,
                color:filter===f.value?f.color:C.text2,transition:"all .15s"}}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{position:"relative"}}>
            <Search size={13} color="#3a5a7a" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            <input value={search} onChange={e=>handleSearch(e.target.value)}
              placeholder="Search cases..."
              style={{padding:"7px 12px 7px 30px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:12,outline:"none",width:200}}/>
          </div>
        </div>

        {/* Table */}
        <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr style={{background:C.s2}}>
                  {["Reference","Subject","Type","Status","Priority","Assigned To","Due Date",""].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading&&Array.from({length:5}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:8}).map((_,j)=>(
                    <td key={j} style={{padding:"12px 14px"}}><div style={{height:12,borderRadius:4,background:C.s2,width:j===0?"80px":j===1?"150px":"70px"}}/></td>
                  ))}</tr>
                ))}
                {!loading&&cases.map((c,i)=>{
                  const sc=STATUS_CFG[c.status]||STATUS_CFG.OPEN;
                  const pc=PRIORITY_CFG[c.priority]||PRIORITY_CFG.MEDIUM;
                  const isOverdue=c.dueDate&&new Date(c.dueDate)<new Date()&&c.status!=="CLOSED";
                  return (
                    <tr key={c.id} className="cm-row" onClick={()=>setSelected(c)}
                      style={{borderBottom:`1px solid ${C.s2}`,transition:"background .15s",animation:`fadeUp .3s ease ${i*.03}s both`}}>
                      <td style={{padding:"11px 14px",fontSize:11,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{c.reference}</td>
                      <td style={{padding:"11px 14px"}}><div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{c.subjectName}</div></td>
                      <td style={{padding:"11px 14px"}}><span style={{fontSize:10,fontWeight:700,color:c.caseType==="PERSON"?C.cyan:C.purple,fontFamily:"'JetBrains Mono',monospace"}}>{c.caseType}</span></td>
                      <td style={{padding:"11px 14px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.icon}{sc.label}</span></td>
                      <td style={{padding:"11px 14px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:"50%",background:pc.dot}}/><span style={{fontSize:11,color:pc.color,fontWeight:600}}>{c.priority}</span></div></td>
                      <td style={{padding:"11px 14px",fontSize:12,color:C.text2}}>{c.assignedTo||<span style={{color:"#3a5a7a",fontStyle:"italic"}}>Unassigned</span>}</td>
                      <td style={{padding:"11px 14px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:isOverdue?C.red:C.text2}}>{c.dueDate?new Date(c.dueDate).toLocaleDateString():"—"}{isOverdue&&" ⚠"}</td>
                      <td style={{padding:"11px 14px"}}><ArrowRight size={14} color={C.text2}/></td>
                    </tr>
                  );
                })}
                {!loading&&cases.length===0&&(
                  <tr><td colSpan={8} style={{padding:"50px 20px",textAlign:"center"}}>
                    <Briefcase size={36} color="#3a5a7a" style={{marginBottom:10,opacity:.4}}/>
                    <div style={{fontSize:13,color:C.text2}}>No cases found</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="cm-cards">
            {!loading&&cases.map((c,i)=>{
              const sc=STATUS_CFG[c.status]||STATUS_CFG.OPEN;
              const pc=PRIORITY_CFG[c.priority]||PRIORITY_CFG.MEDIUM;
              const isOverdue=c.dueDate&&new Date(c.dueDate)<new Date()&&c.status!=="CLOSED";
              return (
                <div key={c.id} className="cm-card-mob" onClick={()=>setSelected(c)}
                  style={{padding:"13px 15px",borderBottom:`1px solid ${C.s2}`,transition:"background .15s",cursor:"pointer",animation:`fadeUp .3s ease ${i*.04}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.subjectName}</div>
                      <div style={{fontSize:10,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{c.reference}</div>
                    </div>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,flexShrink:0,marginLeft:8,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.icon}{sc.label}</span>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:pc.dot}}/><span style={{fontSize:11,color:pc.color}}>{c.priority}</span></div>
                    <span style={{fontSize:11,color:C.text2}}>{c.caseType}</span>
                    {c.assignedTo&&<span style={{fontSize:11,color:C.text2,display:"flex",alignItems:"center",gap:3}}><UserCheck size={10}/>{c.assignedTo}</span>}
                    {isOverdue&&<span style={{fontSize:10,color:C.red,display:"flex",alignItems:"center",gap:3}}><AlertTriangle size={10}/>Overdue</span>}
                    <ArrowRight size={12} color={C.text2} style={{marginLeft:"auto"}}/>
                  </div>
                </div>
              );
            })}
            {!loading&&cases.length===0&&<div style={{padding:"40px 20px",textAlign:"center",color:C.text2,fontSize:13}}>No cases found</div>}
          </div>

          {totalPages>1&&(
            <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"center",alignItems:"center",gap:8}}>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                style={{padding:"5px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:page===0?C.text2:C.text,cursor:page===0?"not-allowed":"pointer",fontSize:12}}>← Prev</button>
              <span style={{fontSize:12,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>{page+1}/{totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1}
                style={{padding:"5px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,color:page===totalPages-1?C.text2:C.text,cursor:page===totalPages-1?"not-allowed":"pointer",fontSize:12}}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {showCreate&&<CreateCaseModal onClose={()=>setShowCreate(false)} onCreated={handleCreated}/>}
      {selected&&<CaseDetailModal caseData={selected} onClose={()=>setSelected(null)} onUpdated={handleUpdated}/>}
    </Layout>
  );
}