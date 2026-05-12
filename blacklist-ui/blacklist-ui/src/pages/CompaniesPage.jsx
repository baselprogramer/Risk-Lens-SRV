import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";
import { Plus, Trash2, RefreshCw, Building2, RotateCcw, ToggleLeft, ToggleRight, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const API = `${API_V1}/super/tenants`;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  orange:"#f59e0b", red:"#ef4444", text:"#e2e8f0", text2:"#7a8fa8",
};

const PLAN_CFG = {
  BASIC:      { color:"#7a8fa8", bg:"rgba(122,143,168,0.1)" },
  PRO:        { color:"#00d4ff", bg:"rgba(0,212,255,0.1)"   },
  ENTERPRISE: { color:"#8b5cf6", bg:"rgba(139,92,246,0.1)"  },
};

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateCompanyModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:"", code:"", email:"", phone:"", country:"",
    plan:"PRO", expiryDays:365, notes:""
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handle = e => setForm(p => ({...p, [e.target.name]: e.target.value}));

  const handleSave = async () => {
    if (!form.name||!form.code) { setError("Name and Code are required"); return; }
    setSaving(true);
    try {
      const res = await fetch(API, {
        method:"POST", headers:authHeaders(),
        body: JSON.stringify({...form, expiryDays: parseInt(form.expiryDays)}),
      });
      const data = await res.text();
      if (!res.ok) throw new Error(data);
      onCreated(JSON.parse(data));
      onClose();
    } catch(e) { setError(e.message||"Failed"); }
    finally { setSaving(false); }
  };

  const inp = {
    width:"100%", padding:"9px 12px", background:C.s2,
    border:`1px solid ${C.border}`, borderRadius:8, color:C.text,
    fontSize:13, outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,
        padding:"24px",width:"100%",maxWidth:500,position:"relative",overflow:"hidden",
        animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />

        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:18,
          display:"flex",alignItems:"center",gap:8}}>
          <Building2 size={16} color={C.cyan}/> Add New Company
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
                textTransform:"uppercase",letterSpacing:"0.4px"}}>Company Name *</label>
              <input name="name" value={form.name} onChange={handle}
                placeholder="Al-Amal Exchange" style={inp} />
            </div>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
                textTransform:"uppercase",letterSpacing:"0.4px"}}>Code * (unique)</label>
              <input name="code" value={form.code} onChange={handle}
                placeholder="ALAMAL" style={inp}
                onInput={e => e.target.value = e.target.value.toUpperCase()} />
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
                textTransform:"uppercase",letterSpacing:"0.4px"}}>Email</label>
              <input name="email" value={form.email} onChange={handle}
                placeholder="info@company.com" style={inp} />
            </div>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
                textTransform:"uppercase",letterSpacing:"0.4px"}}>Phone</label>
              <input name="phone" value={form.phone} onChange={handle}
                placeholder="+962..." style={inp} />
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
                textTransform:"uppercase",letterSpacing:"0.4px"}}>Country</label>
              <input name="country" value={form.country} onChange={handle}
                placeholder="Jordan" style={inp} />
            </div>
            <div>
              <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
                textTransform:"uppercase",letterSpacing:"0.4px"}}>Plan</label>
              <select name="plan" value={form.plan} onChange={handle} style={inp}>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:8,
              textTransform:"uppercase",letterSpacing:"0.4px"}}>Subscription Period</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
              {[{l:"1 mo",v:30},{l:"3 mo",v:90},{l:"6 mo",v:180},{l:"1 yr",v:365},{l:"2 yr",v:730}].map(o=>(
                <button key={o.v} onClick={()=>setForm(p=>({...p,expiryDays:o.v}))}
                  style={{padding:"7px 4px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,
                    background:form.expiryDays===o.v?`${C.cyan}20`:C.s2,
                    border:`1px solid ${form.expiryDays===o.v?C.cyan:C.border}`,
                    color:form.expiryDays===o.v?C.cyan:C.text2,transition:"all .15s"}}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
              textTransform:"uppercase",letterSpacing:"0.4px"}}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handle}
              placeholder="Optional notes..." rows={2}
              style={{...inp,resize:"vertical",lineHeight:1.5}} />
          </div>
        </div>

        {error&&<div style={{color:C.red,fontSize:12,marginTop:10,
          display:"flex",alignItems:"center",gap:5}}>
          <AlertTriangle size={12}/>{error}
        </div>}

        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:C.s2,
            border:`1px solid ${C.border}`,color:C.text2,borderRadius:9,cursor:"pointer",fontSize:13}}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex:2,padding:"9px",
            background:`linear-gradient(135deg,${C.cyan},${C.purple})`,
            border:"none",color:C.bg,borderRadius:9,cursor:"pointer",
            fontSize:13,fontWeight:700,display:"flex",alignItems:"center",
            justifyContent:"center",gap:6}}>
            <Building2 size={13}/>{saving?"Creating...":"Add Company"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Renew Modal ───────────────────────────────────────────────────────────────
function RenewModal({ company, onClose, onRenewed }) {
  const [days, setDays] = useState(365);
  const [saving, setSaving] = useState(false);

  const handleRenew = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${company.id}/renew`, {
        method:"PUT", headers:authHeaders(),
        body:JSON.stringify({days}),
      });
      if (!res.ok) throw new Error("Failed");
      onRenewed(await res.json());
      onClose();
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,
        padding:"24px",width:"100%",maxWidth:380,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:`linear-gradient(90deg,${C.orange},${C.purple})`}} />
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6,
          display:"flex",alignItems:"center",gap:8}}>
          <RotateCcw size={15} color={C.orange}/> Renew Subscription
        </div>
        <div style={{fontSize:12,color:C.text2,marginBottom:16}}>
          {company.name} — <span style={{color:C.cyan,fontFamily:"'JetBrains Mono',monospace"}}>{company.code}</span>
        </div>

        <div style={{marginBottom:14}}>
          <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:8,
            textTransform:"uppercase",letterSpacing:"0.4px"}}>Extend by</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
            {[30,90,180,365,730].map(d=>(
              <button key={d} onClick={()=>setDays(d)} style={{
                padding:"7px 4px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,
                background:days===d?`${C.orange}20`:C.s2,
                border:`1px solid ${days===d?C.orange:C.border}`,
                color:days===d?C.orange:C.text2,transition:"all .15s"}}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,
          padding:"10px 12px",marginBottom:14,fontSize:12,color:C.text2}}>
          Current: <span style={{color:company.expiresAt&&new Date(company.expiresAt)<new Date()?C.red:C.green,fontWeight:600}}>
            {company.expiresAt ? new Date(company.expiresAt).toLocaleDateString() : "No expiry"}
          </span>
          <br/>
          New: <span style={{color:C.cyan,fontWeight:600}}>
            {new Date(Date.now()+days*86400000).toLocaleDateString()}
          </span>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:C.s2,
            border:`1px solid ${C.border}`,color:C.text2,borderRadius:9,cursor:"pointer",fontSize:13}}>
            Cancel
          </button>
          <button onClick={handleRenew} disabled={saving} style={{
            flex:2,padding:"9px",
            background:`linear-gradient(135deg,${C.orange},${C.purple})`,
            border:"none",color:"white",borderRadius:9,cursor:"pointer",
            fontSize:13,fontWeight:700,display:"flex",alignItems:"center",
            justifyContent:"center",gap:6}}>
            <RotateCcw size={13}/>{saving?"Renewing...":"Renew"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const [companies,   setCompanies]   = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [renewComp,   setRenewComp]   = useState(null);
  const [msg,         setMsg]         = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(API,            { headers: authHeaders() }),
        fetch(`${API}/stats`, { headers: authHeaders() }),
      ]);
      if (cRes.ok) setCompanies(await cRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (text, ok=true) => {
    setMsg({text,ok});
    setTimeout(()=>setMsg(null), 3000);
  };

  const handleToggle = async (c) => {
    try {
      await fetch(`${API}/${c.id}/toggle`, {
        method:"PUT", headers:authHeaders(),
        body:JSON.stringify({active:!c.active}),
      });
      setCompanies(prev => prev.map(x => x.id===c.id ? {...x, active:!c.active} : x));
      showToast(c.active ? "Company disabled" : "Company enabled ✅", !c.active);
    } catch(e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this company? This cannot be undone.")) return;
    try {
      await fetch(`${API}/${id}`, {method:"DELETE", headers:authHeaders()});
      setCompanies(prev => prev.filter(c => c.id!==id));
      showToast("Company deleted");
    } catch(e) { console.error(e); }
  };

  const handleRenewed = (updated) => {
    setCompanies(prev => prev.map(c => c.id===updated.id ? updated : c));
    showToast("Subscription renewed ✅");
  };

  const getDaysLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.floor((new Date(expiresAt) - new Date()) / 86400000);
    return days;
  };

  const getDaysColor = (days) => {
    if (days === null) return C.green;
    if (days < 0)  return C.red;
    if (days <= 7) return C.red;
    if (days <= 30) return C.orange;
    return C.green;
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .co-row:hover{background:rgba(0,212,255,0.03)!important;}
        .co-btn:hover{filter:brightness(1.12);transform:translateY(-1px);}
        .co-table-wrap{overflow-x:auto;}
        .co-table{width:100%;border-collapse:collapse;min-width:750px;}
        .co-cards{display:none;}
        .co-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px;}
        @media(max-width:768px){
          .co-table-wrap{display:none!important;}
          .co-cards{display:block!important;}
          .co-stats{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",animation:"fadeUp .4s ease"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          marginBottom:22,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:36,background:`linear-gradient(180deg,${C.cyan},${C.purple})`,borderRadius:2}} />
            <div>
              <h2 style={{margin:0,fontSize:20,fontWeight:700,color:C.text}}>Companies</h2>
              <p style={{margin:0,fontSize:12,color:C.text2,marginTop:2}}>Manage subscriber companies</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="co-btn" onClick={fetchAll} style={{
              padding:"8px 12px",background:C.s2,border:`1px solid ${C.border}`,
              color:C.text2,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
              <RefreshCw size={13}/>
            </button>
            <button className="co-btn" onClick={()=>setShowCreate(true)} style={{
              padding:"8px 16px",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,
              border:"none",color:C.bg,borderRadius:9,cursor:"pointer",
              display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,
              boxShadow:`0 4px 14px rgba(0,212,255,0.22)`,transition:"all .2s"}}>
              <Plus size={14}/> Add Company
            </button>
          </div>
        </div>

        {/* Toast */}
        {msg&&(
          <div style={{marginBottom:14,padding:"11px 16px",borderRadius:10,
            background:msg.ok?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",
            border:`1px solid ${msg.ok?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,
            color:msg.ok?C.green:C.red,fontSize:13,fontWeight:600}}>
            {msg.text}
          </div>
        )}

        {/* Stats */}
        {stats&&(
          <div className="co-stats">
            {[
              {label:"Total",    value:stats.total,   color:C.cyan  },
              {label:"Active",   value:stats.active,  color:C.green },
              {label:"Inactive", value:stats.inactive,color:C.text2 },
              {label:"Expired",  value:stats.expired, color:C.red   },
            ].map(s=>(
              <div key={s.label} style={{background:C.s1,border:`1px solid ${s.color}22`,
                borderRadius:11,padding:"12px 14px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:.6}} />
                <div style={{fontSize:10,color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:20,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />

          {/* Desktop */}
          <div className="co-table-wrap">
            <table className="co-table">
              <thead>
                <tr style={{background:C.s2}}>
                  {["Company","Code","Plan","Status","Days Left","Expires","Actions"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,
                      color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",
                      borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading&&Array.from({length:3}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:7}).map((_,j)=>(
                    <td key={j} style={{padding:"13px 14px"}}>
                      <div style={{height:12,borderRadius:4,background:C.s2,width:j===0?"140px":"70px"}} />
                    </td>
                  ))}</tr>
                ))}
                {!loading&&companies.map((c,i)=>{
                  const plan = PLAN_CFG[c.plan] || PLAN_CFG.BASIC;
                  const days = getDaysLeft(c.expiresAt);
                  const daysColor = getDaysColor(days);
                  return (
                    <tr key={c.id} className="co-row" style={{borderBottom:`1px solid ${C.s2}`,transition:"background .15s",animation:`fadeUp .3s ease ${i*.05}s both`}}>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:9}}>
                          <div style={{width:32,height:32,borderRadius:9,
                            background:`linear-gradient(135deg,${C.cyan}22,${C.purple}22)`,
                            border:`1px solid ${C.cyan}33`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:13,fontWeight:700,color:C.cyan}}>
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:C.text}}>{c.name}</div>
                            {c.email&&<div style={{fontSize:10,color:C.text2}}>{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{fontSize:11,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{c.code}</span>
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,
                          background:plan.bg,color:plan.color,border:`1px solid ${plan.color}44`}}>
                          {c.plan}
                        </span>
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        {c.active ? (
                          <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,
                            background:"rgba(16,185,129,0.1)",color:C.green,border:"1px solid rgba(16,185,129,0.25)",
                            display:"inline-flex",alignItems:"center",gap:4}}>
                            <CheckCircle size={10}/> Active
                          </span>
                        ) : (
                          <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,
                            background:"rgba(122,143,168,0.1)",color:C.text2,border:`1px solid ${C.border}`,
                            display:"inline-flex",alignItems:"center",gap:4}}>
                            <Clock size={10}/> Disabled
                          </span>
                        )}
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{fontSize:12,fontWeight:700,color:daysColor,fontFamily:"'JetBrains Mono',monospace"}}>
                          {days === null ? "∞" : days < 0 ? "Expired" : `${days}d`}
                        </span>
                      </td>
                      <td style={{padding:"12px 14px",fontSize:11,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:5}}>
                          <button className="co-btn" onClick={()=>setRenewComp(c)} title="Renew"
                            style={{padding:"5px 9px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:7,color:C.orange,cursor:"pointer",display:"flex",transition:"all .2s"}}>
                            <RotateCcw size={13}/>
                          </button>
                          <button className="co-btn" onClick={()=>handleToggle(c)} title={c.active?"Disable":"Enable"}
                            style={{padding:"5px 9px",background:c.active?"rgba(239,68,68,0.08)":"rgba(16,185,129,0.08)",border:`1px solid ${c.active?"rgba(239,68,68,0.2)":"rgba(16,185,129,0.2)"}`,borderRadius:7,color:c.active?C.red:C.green,cursor:"pointer",display:"flex",transition:"all .2s"}}>
                            {c.active?<ToggleRight size={13}/>:<ToggleLeft size={13}/>}
                          </button>
                          <button className="co-btn" onClick={()=>handleDelete(c.id)} title="Delete"
                            style={{padding:"5px 9px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,color:C.red,cursor:"pointer",display:"flex",transition:"all .2s"}}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading&&companies.length===0&&(
                  <tr><td colSpan={7} style={{padding:"50px 20px",textAlign:"center"}}>
                    <Building2 size={36} color="#3a5a7a" style={{marginBottom:10,opacity:.4}}/>
                    <div style={{fontSize:13,color:C.text2}}>No companies yet</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="co-cards">
            {!loading&&companies.map((c,i)=>{
              const plan = PLAN_CFG[c.plan]||PLAN_CFG.BASIC;
              const days = getDaysLeft(c.expiresAt);
              const daysColor = getDaysColor(days);
              return (
                <div key={c.id} style={{padding:"14px 16px",borderBottom:`1px solid ${C.s2}`,animation:`fadeUp .3s ease ${i*.05}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:36,height:36,borderRadius:9,
                        background:`linear-gradient(135deg,${C.cyan}22,${C.purple}22)`,
                        border:`1px solid ${C.cyan}33`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:14,fontWeight:700,color:C.cyan}}>
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:C.text}}>{c.name}</div>
                        <div style={{fontSize:10,color:C.cyan,fontFamily:"'JetBrains Mono',monospace"}}>{c.code}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,
                        background:plan.bg,color:plan.color,border:`1px solid ${plan.color}44`}}>
                        {c.plan}
                      </span>
                      <span style={{fontSize:11,fontWeight:700,color:daysColor,fontFamily:"'JetBrains Mono',monospace"}}>
                        {days===null?"∞":days<0?"Expired":`${days}d`}
                      </span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setRenewComp(c)} style={{flex:1,padding:"7px",
                      background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",
                      borderRadius:8,color:C.orange,cursor:"pointer",fontSize:12,fontWeight:600,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      <RotateCcw size={12}/> Renew
                    </button>
                    <button onClick={()=>handleToggle(c)} style={{flex:1,padding:"7px",
                      background:c.active?"rgba(239,68,68,0.08)":"rgba(16,185,129,0.08)",
                      border:`1px solid ${c.active?"rgba(239,68,68,0.2)":"rgba(16,185,129,0.2)"}`,
                      borderRadius:8,color:c.active?C.red:C.green,cursor:"pointer",fontSize:12,fontWeight:600,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      {c.active?<><ToggleRight size={12}/> Disable</>:<><ToggleLeft size={12}/> Enable</>}
                    </button>
                    <button onClick={()=>handleDelete(c.id)} style={{padding:"7px 10px",
                      background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",
                      borderRadius:8,color:C.red,cursor:"pointer",display:"flex",alignItems:"center"}}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
            {!loading&&companies.length===0&&(
              <div style={{padding:"40px 20px",textAlign:"center",color:C.text2,fontSize:13}}>No companies yet</div>
            )}
          </div>
        </div>
      </div>

      {showCreate && <CreateCompanyModal onClose={()=>setShowCreate(false)} onCreated={(c)=>{setCompanies(p=>[c,...p]);fetchAll();}}/>}
      {renewComp  && <RenewModal company={renewComp} onClose={()=>setRenewComp(null)} onRenewed={handleRenewed}/>}
    </Layout>
  );
}