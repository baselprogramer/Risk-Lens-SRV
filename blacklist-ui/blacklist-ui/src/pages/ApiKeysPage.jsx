import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";
import { Plus, Trash2, RefreshCw, Key, ToggleLeft, ToggleRight, Copy, Check, RotateCcw, Shield } from "lucide-react";

const API = `${API_V1}/admin/api-keys`;
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  orange:"#f59e0b", red:"#ef4444", text:"#e2e8f0", text2:"#7a8fa8",
};

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateKeyModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:"", description:"", username:"", expiryDays:30, allowedIps:""
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handle = e => setForm(p => ({...p, [e.target.name]: e.target.value}));

  const handleSave = async () => {
    if (!form.name||!form.username||!form.expiryDays) {
      setError("Name, Username and Expiry Days are required"); return;
    }
    setSaving(true);
    try {
      const res = await fetch(API, {
        method:"POST", headers:authHeaders(),
        body: JSON.stringify({
          ...form,
          expiryDays: parseInt(form.expiryDays),
          allowedIps: form.allowedIps||null,
        }),
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

  const EXPIRY_OPTIONS = [
    {label:"7 days",   value:7  },
    {label:"30 days",  value:30 },
    {label:"90 days",  value:90 },
    {label:"180 days", value:180},
    {label:"1 year",   value:365},
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,
        padding:"24px",width:"100%",maxWidth:460,position:"relative",overflow:"hidden",
        animation:"fadeUp .25s ease"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />

        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:18,
          display:"flex",alignItems:"center",gap:8}}>
          <Key size={16} color={C.cyan}/> Create API Key
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
              textTransform:"uppercase",letterSpacing:"0.4px"}}>Company / Client Name *</label>
            <input name="name" value={form.name} onChange={handle}
              placeholder="e.g. Al-Amal Exchange" style={inp} />
          </div>
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
              textTransform:"uppercase",letterSpacing:"0.4px"}}>Username (Subscriber) *</label>
            <input name="username" value={form.username} onChange={handle}
              placeholder="e.g. sub1" style={inp} />
          </div>
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
              textTransform:"uppercase",letterSpacing:"0.4px"}}>Description</label>
            <input name="description" value={form.description} onChange={handle}
              placeholder="Optional notes" style={inp} />
          </div>

          {/* Expiry */}
          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:8,
              textTransform:"uppercase",letterSpacing:"0.4px"}}>Subscription Period *</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
              {EXPIRY_OPTIONS.map(o=>(
                <button key={o.value} onClick={()=>setForm(p=>({...p,expiryDays:o.value}))}
                  style={{padding:"7px 4px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,
                    background:form.expiryDays===o.value?`${C.cyan}20`:C.s2,
                    border:`1px solid ${form.expiryDays===o.value?C.cyan:C.border}`,
                    color:form.expiryDays===o.value?C.cyan:C.text2,transition:"all .15s"}}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,
              textTransform:"uppercase",letterSpacing:"0.4px"}}>IP Whitelist (optional)</label>
            <input name="allowedIps" value={form.allowedIps} onChange={handle}
              placeholder="192.168.1.1, 10.0.0.1 (leave empty for all)" style={inp} />
          </div>
        </div>

        {error&&<div style={{color:C.red,fontSize:12,marginTop:10}}>{error}</div>}

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
            <Key size={13}/>{saving?"Creating...":"Generate API Key"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Created Key Modal — يظهر الـ key مرة واحدة ──────────────────────────────
function CreatedKeyModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.rawKey);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1001,padding:"16px"}}>
      <div style={{background:C.s1,border:`1px solid rgba(16,185,129,0.4)`,borderRadius:16,
        padding:"28px 24px",width:"100%",maxWidth:500,position:"relative",overflow:"hidden",
        animation:"fadeUp .25s ease"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:`linear-gradient(90deg,${C.green},${C.cyan})`}} />

        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{width:56,height:56,borderRadius:"50%",
            background:"rgba(16,185,129,0.15)",border:"2px solid rgba(16,185,129,0.4)",
            display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
            <Key size={24} color={C.green}/>
          </div>
          <div style={{fontSize:16,fontWeight:700,color:C.green,marginBottom:4}}>
            API Key Created Successfully!
          </div>
          <div style={{fontSize:12,color:C.text2}}>
            Copy this key now — it won't be shown again
          </div>
        </div>

        {/* Key Display */}
        <div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,
          padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:10,color:C.text2,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.4px"}}>
            API Key
          </div>
          <div style={{fontSize:12,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",
            wordBreak:"break-all",lineHeight:1.6,marginBottom:10}}>
            {data.rawKey}
          </div>
          <button onClick={handleCopy} style={{
            width:"100%",padding:"9px",
            background:copied?"rgba(16,185,129,0.15)":`linear-gradient(135deg,${C.cyan},${C.purple})`,
            border:copied?"1px solid rgba(16,185,129,0.4)":"none",
            color:copied?C.green:"#060912",borderRadius:8,cursor:"pointer",
            fontSize:13,fontWeight:700,display:"flex",alignItems:"center",
            justifyContent:"center",gap:6,transition:"all .2s"}}>
            {copied?<><Check size={13}/> Copied!</>:<><Copy size={13}/> Copy API Key</>}
          </button>
        </div>

        {/* Info */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[
            {label:"Username",   value:data.username},
            {label:"Expires",    value:data.expiresAt},
            {label:"Client",     value:data.name},
            {label:"Key Prefix", value:data.keyPrefix},
          ].map(f=>(
            <div key={f.label} style={{background:C.s2,borderRadius:8,padding:"8px 10px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.text2,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.4px"}}>{f.label}</div>
              <div style={{fontSize:12,fontWeight:600,color:C.text,fontFamily:"'JetBrains Mono',monospace"}}>{f.value}</div>
            </div>
          ))}
        </div>

        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",
          borderRadius:9,padding:"10px 12px",marginBottom:14,fontSize:12,color:C.orange,
          display:"flex",alignItems:"flex-start",gap:8}}>
          <Shield size={14} style={{flexShrink:0,marginTop:1}}/>
          Send this key to the subscriber securely. They will use it as:
          <code style={{fontFamily:"'JetBrains Mono',monospace"}}> X-API-Key: {data.keyPrefix}...</code>
        </div>

        <button onClick={onClose} style={{width:"100%",padding:"10px",
          background:`linear-gradient(135deg,${C.green},#059669)`,
          border:"none",color:"white",borderRadius:9,cursor:"pointer",
          fontSize:13,fontWeight:700}}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── Renew Modal ───────────────────────────────────────────────────────────────
function RenewModal({ keyData, onClose, onRenewed }) {
  const [days,   setDays]   = useState(30);
  const [saving, setSaving] = useState(false);

  const OPTS = [7,30,90,180,365];

  const handleRenew = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${keyData.id}/renew`, {
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
          {keyData.name} — <span style={{color:C.cyan}}>{keyData.username}</span>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:8,
            textTransform:"uppercase",letterSpacing:"0.4px"}}>Extend by</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
            {OPTS.map(d=>(
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
          Current expiry: <span style={{color:keyData.expired?C.red:C.green,fontWeight:600}}>
            {keyData.expiresAt ? new Date(keyData.expiresAt).toLocaleDateString() : "—"}
          </span>
          <br/>
          New expiry: <span style={{color:C.cyan,fontWeight:600}}>
            {new Date(Date.now() + days*86400000).toLocaleDateString()}
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
export default function ApiKeysPage() {
  const [keys,        setKeys]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [createdKey,  setCreatedKey]  = useState(null);
  const [renewKey,    setRenewKey]    = useState(null);
  const [msg,         setMsg]         = useState(null);

  useEffect(()=>{ fetchKeys(); },[]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const r = await fetch(API, {headers:authHeaders()});
      if (r.ok) setKeys(await r.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (text, ok=true) => {
    setMsg({text,ok});
    setTimeout(()=>setMsg(null), 3000);
  };

  const handleCreated = (data) => {
    setCreatedKey(data);
    fetchKeys();
  };

  const handleRenewed = (updated) => {
    setKeys(prev => prev.map(k => k.id===updated.id ? updated : k));
    showToast("Subscription renewed ✅");
  };

  const handleToggle = async (key) => {
    try {
      await fetch(`${API}/${key.id}/toggle`, {
        method:"PUT", headers:authHeaders(),
        body:JSON.stringify({active:!key.active}),
      });
      setKeys(prev => prev.map(k => k.id===key.id ? {...k,active:!k.active} : k));
      showToast(key.active ? "Key disabled" : "Key enabled ✅", !key.active);
    } catch(e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this API key?")) return;
    try {
      await fetch(`${API}/${id}`, {method:"DELETE", headers:authHeaders()});
      setKeys(prev => prev.filter(k => k.id!==id));
      showToast("Key deleted");
    } catch(e) { console.error(e); }
  };

  const getDaysColor = (days, expired) => {
    if (expired) return C.red;
    if (days <= 7)  return C.red;
    if (days <= 30) return C.orange;
    return C.green;
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ak-row:hover{background:rgba(0,212,255,0.03)!important;}
        .ak-btn:hover{filter:brightness(1.12);transform:translateY(-1px);}
        .ak-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3)!important;}
        .ak-cards{display:none;}
        .ak-table-wrap{overflow-x:auto;}
        .ak-table{width:100%;border-collapse:collapse;min-width:700px;}
        @media(max-width:768px){
          .ak-table-wrap{display:none!important;}
          .ak-cards{display:block!important;}
        }
      `}</style>

      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",animation:"fadeUp .4s ease"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          marginBottom:22,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:36,background:`linear-gradient(180deg,${C.cyan},${C.purple})`,borderRadius:2}} />
            <div>
              <h2 style={{margin:0,fontSize:20,fontWeight:700,color:C.text}}>API Keys</h2>
              <p style={{margin:0,fontSize:12,color:C.text2,marginTop:2}}>Manage subscriber access keys</p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="ak-btn" onClick={fetchKeys} style={{
              padding:"8px 12px",background:C.s2,border:`1px solid ${C.border}`,
              color:C.text2,borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
              <RefreshCw size={13}/>
            </button>
            <button className="ak-btn" onClick={()=>setShowCreate(true)} style={{
              padding:"8px 16px",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,
              border:"none",color:C.bg,borderRadius:9,cursor:"pointer",
              display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,
              boxShadow:`0 4px 14px rgba(0,212,255,0.22)`,transition:"all .2s"}}>
              <Plus size={14}/> New Key
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:20}}>
          {[
            {label:"Total",   value:keys.length,                               color:C.cyan  },
            {label:"Active",  value:keys.filter(k=>k.active&&!k.expired).length, color:C.green },
            {label:"Expired", value:keys.filter(k=>k.expired).length,           color:C.red   },
            {label:"Disabled",value:keys.filter(k=>!k.active).length,           color:C.text2 },
          ].map(s=>(
            <div key={s.label} style={{background:C.s1,border:`1px solid ${s.color}22`,
              borderRadius:11,padding:"12px 14px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:.6}} />
              <div style={{fontSize:10,color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:3}}>{s.label}</div>
              <div style={{fontSize:20,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />

          {/* Desktop */}
          <div className="ak-table-wrap">
            <table className="ak-table">
              <thead>
                <tr style={{background:C.s2}}>
                  {["Key Prefix","Client","Username","Status","Days Left","Last Used","Requests","Actions"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,
                      color:C.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",
                      borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading&&Array.from({length:3}).map((_,i)=>(
                  <tr key={i}>{Array.from({length:8}).map((_,j)=>(
                    <td key={j} style={{padding:"13px 14px"}}>
                      <div style={{height:12,borderRadius:4,background:C.s2,width:j===0?"100px":"70px"}} />
                    </td>
                  ))}</tr>
                ))}
                {!loading&&keys.map((k,i)=>{
                  const daysColor = getDaysColor(k.daysRemaining, k.expired);
                  return (
                    <tr key={k.id} className="ak-row" style={{borderBottom:`1px solid ${C.s2}`,transition:"background .15s",animation:`fadeUp .3s ease ${i*.05}s both`}}>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{fontSize:12,color:C.cyan,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{k.keyPrefix}...</span>
                      </td>
                      <td style={{padding:"12px 14px",fontSize:13,fontWeight:600,color:C.text}}>{k.name}</td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:24,height:24,borderRadius:7,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.cyan,fontWeight:700}}>
                            {k.username?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{fontSize:12,color:C.text}}>{k.username}</span>
                        </div>
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        {k.expired ? (
                          <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"rgba(239,68,68,0.1)",color:C.red,border:"1px solid rgba(239,68,68,0.25)"}}>EXPIRED</span>
                        ) : k.active ? (
                          <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"rgba(16,185,129,0.1)",color:C.green,border:"1px solid rgba(16,185,129,0.25)"}}>ACTIVE</span>
                        ) : (
                          <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"rgba(122,143,168,0.1)",color:C.text2,border:`1px solid ${C.border}`}}>DISABLED</span>
                        )}
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{fontSize:12,fontWeight:700,color:daysColor,fontFamily:"'JetBrains Mono',monospace"}}>
                          {k.expired ? "Expired" : `${k.daysRemaining}d`}
                        </span>
                      </td>
                      <td style={{padding:"12px 14px",fontSize:11,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                      </td>
                      <td style={{padding:"12px 14px",fontSize:12,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>
                        {(k.requestCount||0).toLocaleString()}
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:5}}>
                          {/* Renew */}
                          <button className="ak-btn" onClick={()=>setRenewKey(k)} title="Renew"
                            style={{padding:"5px 9px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:7,color:C.orange,cursor:"pointer",display:"flex",transition:"all .2s"}}>
                            <RotateCcw size={13}/>
                          </button>
                          {/* Toggle */}
                          <button className="ak-btn" onClick={()=>handleToggle(k)} title={k.active?"Disable":"Enable"}
                            style={{padding:"5px 9px",background: !k.active ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",border: `1px solid ${!k.active ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,borderRadius:7,color: !k.active?C.red:C.green,cursor:"pointer",display:"flex",transition:"all .2s"}}>
                            {!k.active ? <ToggleLeft size={12}/> : <ToggleRight size={12}/>}
                          </button>
                          {/* Delete */}
                          <button className="ak-btn" onClick={()=>handleDelete(k.id)} title="Delete"
                            style={{padding:"5px 9px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,color:C.red,cursor:"pointer",display:"flex",transition:"all .2s"}}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading&&keys.length===0&&(
                  <tr><td colSpan={8} style={{padding:"50px 20px",textAlign:"center"}}>
                    <Key size={36} color="#3a5a7a" style={{marginBottom:10,opacity:.4}}/>
                    <div style={{fontSize:13,color:C.text2}}>No API keys yet</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="ak-cards">
            {!loading&&keys.map((k,i)=>{
              const daysColor = getDaysColor(k.daysRemaining, k.expired);
              return (
                <div key={k.id} style={{padding:"14px 16px",borderBottom:`1px solid ${C.s2}`,animation:`fadeUp .3s ease ${i*.05}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:3}}>{k.name}</div>
                      <div style={{fontSize:11,color:C.cyan,fontFamily:"'JetBrains Mono',monospace"}}>{k.keyPrefix}...</div>
                    </div>
                    {k.expired ? (
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"rgba(239,68,68,0.1)",color:C.red,border:"1px solid rgba(239,68,68,0.25)"}}>EXPIRED</span>
                    ) : k.active ? (
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"rgba(16,185,129,0.1)",color:C.green,border:"1px solid rgba(16,185,129,0.25)"}}>ACTIVE</span>
                    ) : (
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,background:"rgba(122,143,168,0.1)",color:C.text2,border:`1px solid ${C.border}`}}>DISABLED</span>
                    )}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:C.text2}}>👤 {k.username}</span>
                    <span style={{fontSize:11,fontWeight:700,color:daysColor}}>
                      {k.expired?"Expired":`${k.daysRemaining}d left`}
                    </span>
                    <span style={{fontSize:11,color:C.text2}}>{(k.requestCount||0)} requests</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setRenewKey(k)} style={{flex:1,padding:"7px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,color:C.orange,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      <RotateCcw size={12}/> Renew
                    </button>
                    <button onClick={()=>handleToggle(k)} style={{flex:1,padding:"7px",background:k.active?"rgba(239,68,68,0.08)":"rgba(16,185,129,0.08)",border:`1px solid ${k.active?"rgba(239,68,68,0.2)":"rgba(16,185,129,0.2)"}`,borderRadius:8,color:k.active?C.red:C.green,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      {k.active?<><ToggleRight size={12}/> Disable</>:<><ToggleLeft size={12}/> Enable</>}
                    </button>
                    <button onClick={()=>handleDelete(k.id)} style={{padding:"7px 10px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,color:C.red,cursor:"pointer",display:"flex",alignItems:"center"}}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
            {!loading&&keys.length===0&&(
              <div style={{padding:"40px 20px",textAlign:"center",color:C.text2,fontSize:13}}>No API keys yet</div>
            )}
          </div>
        </div>
      </div>

      {showCreate  && <CreateKeyModal onClose={()=>setShowCreate(false)} onCreated={handleCreated}/>}
      {createdKey  && <CreatedKeyModal data={createdKey} onClose={()=>setCreatedKey(null)}/>}
      {renewKey    && <RenewModal keyData={renewKey} onClose={()=>setRenewKey(null)} onRenewed={handleRenewed}/>}
    </Layout>
  );
}