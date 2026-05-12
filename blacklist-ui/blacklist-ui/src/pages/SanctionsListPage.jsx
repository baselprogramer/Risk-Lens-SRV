import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { API_V1 } from "../config/api";

const PAGE_SIZE = 15;

const SOURCES = [
  { id:"ALL",        label:"All Lists",  icon:"🌐",  color:"#00d4ff" },
  { id:"OFAC",       label:"OFAC",       icon:<img src="https://flagcdn.com/w20/us.png" alt="US" style={{width:20,height:14,borderRadius:2}}/>, color:"#ef4444" },
  { id:"UN",         label:"UN",         icon:<img src="https://flagcdn.com/w20/un.png" alt="UN" style={{width:20,height:14,borderRadius:2}}/>, color:"#3b82f6" },
  { id:"EU",         label:"EU",         icon:<img src="https://flagcdn.com/w20/eu.png" alt="EU" style={{width:20,height:14,borderRadius:2}}/>, color:"#f59e0b" },
  { id:"UK",         label:"UK",         icon:<img src="https://flagcdn.com/w20/gb.png" alt="GB" style={{width:20,height:14,borderRadius:2}}/>, color:"#8b5cf6" },
  { id:"INTERPOL",   label:"Interpol",   icon:<img src="https://flagcdn.com/w20/fr.png" alt="FR" style={{width:20,height:14,borderRadius:2}}/>, color:"#ef4444" },
  { id:"WORLD_BANK", label:"World Bank", icon:"🏦",}
];

const TYPE_COLORS = {
  INDIVIDUAL: { bg:"rgba(0,212,255,0.1)",  color:"#00d4ff", border:"rgba(0,212,255,0.25)"  },
  ENTITY:     { bg:"rgba(139,92,246,0.1)", color:"#a78bfa", border:"rgba(139,92,246,0.25)" },
  VESSEL:     { bg:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"rgba(245,158,11,0.25)" },
  AIRCRAFT:   { bg:"rgba(16,185,129,0.1)", color:"#10b981", border:"rgba(16,185,129,0.25)" },
};
const typeStyle = (t) => TYPE_COLORS[(t||"").toUpperCase()] || TYPE_COLORS.ENTITY;

const safeStr = (val) => {
  if (val===null||val===undefined) return "";
  if (typeof val==="string") return val;
  if (typeof val==="number") return String(val);
  if (typeof val==="object") return JSON.stringify(val);
  return "";
};

const extractAliases = (aliases) => {
  if (!aliases) return "—";
  if (typeof aliases==="string") return aliases||"—";
  if (Array.isArray(aliases)) {
    const names = aliases.map(a => {
      if (typeof a==="string") return a;
      const parts = [a.firstName,a.lastName].filter(Boolean);
      if (parts.length) return parts.join(" ");
      return Object.values(a).find(v => typeof v==="string"&&v.trim()!=="") || "";
    }).filter(Boolean);
    return names.length ? names.join("; ") : "—";
  }
  return "—";
};

const extractCountry = (country, nationality) => {
  const val = country||nationality;
  if (!val) return "—";
  if (typeof val==="string") return val||"—";
  if (Array.isArray(val)) {
    const main = val.find(c => c?.mainEntry);
    const picked = main||val[0];
    if (!picked) return "—";
    return typeof picked==="string" ? picked : safeStr(picked.country||picked.name||"—");
  }
  if (typeof val==="object") return safeStr(val.country||val.name||"—");
  return "—";
};

const extractDob = (dob) => {
  if (!dob) return "—";
  if (typeof dob==="string") return dob;
  if (Array.isArray(dob)) return dob[0]?.dateOfBirth||dob[0]?.date||"—";
  if (typeof dob==="object") return dob.dateOfBirth||dob.date||"—";
  return "—";
};

const fetchList = async (source) => {
  const token = localStorage.getItem("jwtToken");
  const url = source==="ALL" ? `${API_V1}/ofac/list` : `${API_V1}/ofac/list?source=${source}`;
  const res = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } });
  if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`);
  return res.json();
};

export default function SanctionsListPage() {
  const [activeSource, setActiveSource] = useState("ALL");
  const [data,         setData]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [stats,        setStats]        = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null); setPage(1); setSearch("");
      try {
        const result = await fetchList(activeSource);
        const list = Array.isArray(result) ? result : (result.content||result.data||[]);
        setData(list);
        const s = {};
        SOURCES.slice(1).forEach(src => { s[src.id] = list.filter(r => (r.source||"").toUpperCase()===src.id).length; });
        s.ALL = list.length;
        setStats(s);
      } catch (e) { setError(e.message); setData([]); }
      finally { setLoading(false); }
    })();
  }, [activeSource]);

  const filtered = data.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (typeof r.name==="string"?r.name:"").toLowerCase().includes(q) ||
      extractAliases(r.aliases).toLowerCase().includes(q) ||
      extractCountry(r.country,r.nationality).replace("—","").toLowerCase().includes(q) ||
      (typeof r.type==="string"?r.type:"").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const srcMeta = SOURCES.find(s => s.id===activeSource)||SOURCES[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;}
        @keyframes fadeUp {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin   {to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .src-tab{background:transparent;border:1px solid transparent;cursor:pointer;transition:all .2s;font-family:'IBM Plex Sans',sans-serif;}
        .src-tab:hover{border-color:rgba(0,212,255,.2)!important;color:#e2e8f0!important;}
        .sl-row:hover{background:rgba(0,212,255,.04)!important;}
        .pg-btn:hover:not(:disabled){background:rgba(0,212,255,.1)!important;border-color:rgba(0,212,255,.35)!important;color:#00d4ff!important;}
        .search-inp:focus{border-color:rgba(0,212,255,.45)!important;box-shadow:0 0 0 3px rgba(0,212,255,.07)!important;}
        .skeleton{background:linear-gradient(90deg,#111c2e 25%,#1a2d4a 50%,#111c2e 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px;}
        .stat-card-sl:hover{transform:translateY(-3px)!important;}

        /* ── Responsive ── */
        .sl-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}
        .sl-tabs{display:flex;gap:5px;margin-bottom:14px;flex-wrap:wrap;}
        .sl-toolbar{padding:12px 14px;border-bottom:1px solid #1a2d4a;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .sl-search{width:200px;}
        .sl-table-wrap{overflow-x:auto;}
        .sl-table{width:100%;border-collapse:collapse;min-width:650px;}
        .sl-cards{display:none;}
        .sl-pagination{padding:12px 14px;border-top:1px solid #1a2d4a;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}

        @media(max-width:768px){
          .sl-stat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .sl-table-wrap{display:none!important;}
          .sl-cards{display:block!important;}
          .sl-search{width:100%!important;margin-right:0!important;}
          .page-title{font-size:1.2rem!important;}
        }
        @media(max-width:480px){
          .sl-stat-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <Layout>
        <div style={{maxWidth:1400,margin:"0 auto",animation:"fadeUp .4s ease"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:4,height:34,background:"linear-gradient(180deg,#00d4ff,#8b5cf6)",borderRadius:4}} />
              <div>
                <h2 className="page-title" style={{margin:0,fontSize:"1.5rem",fontWeight:700,color:"#e2e8f0"}}>Sanctions Lists</h2>
                <p style={{margin:0,fontSize:"0.75rem",color:"#7a8fa8",marginTop:2}}>OFAC · UN · EU · UK</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0,212,255,.07)",
              border:"1px solid rgba(0,212,255,.2)",padding:"5px 12px",borderRadius:20,
              fontSize:"0.7rem",color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace"}}>
              {(stats.ALL||0).toLocaleString()} records
            </div>
          </div>

          {/* Stat Cards */}
          <div className="sl-stat-grid">
            {SOURCES.slice(1).map(src => (
              <div key={src.id} className="stat-card-sl" onClick={()=>setActiveSource(src.id)}
                style={{background:"#0d1321",border:`1px solid ${src.color}22`,
                  borderRadius:12,padding:"12px 14px",cursor:"pointer",
                  transition:"all .22s",position:"relative",overflow:"hidden",
                  boxShadow:activeSource===src.id?`0 0 0 1px ${src.color}55`:"none"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,
                  background:src.color,opacity:activeSource===src.id?.9:.4}} />
                <div style={{fontSize:"1.2rem",marginBottom:4}}>{src.icon}</div>
                <div style={{fontSize:"0.68rem",color:"#7a8fa8",fontWeight:700,
                  textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{src.label}</div>
                <div style={{fontSize:"1.4rem",fontWeight:700,color:"#e2e8f0",
                  fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>
                  {loading?"—":(stats[src.id]||0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Source Tabs */}
          <div className="sl-tabs">
            {SOURCES.map(src => (
              <button key={src.id} className="src-tab" onClick={()=>setActiveSource(src.id)}
                style={{padding:"7px 14px",borderRadius:9,fontSize:"0.82rem",fontWeight:600,
                  color:activeSource===src.id?src.color:"#7a8fa8",
                  background:activeSource===src.id?`${src.color}12`:"transparent",
                  border:activeSource===src.id?`1px solid ${src.color}40`:"1px solid transparent"}}>
                {src.icon} {src.label}
                {stats[src.id]!==undefined&&(
                  <span style={{marginRight:4,fontSize:"0.68rem",fontFamily:"'JetBrains Mono',monospace",opacity:.7}}>
                    {" "}({(stats[src.id]||0).toLocaleString()})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Error */}
          {error&&(
            <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",
              borderRadius:10,padding:"10px 14px",marginBottom:14,
              color:"#ef4444",fontSize:"0.82rem",display:"flex",justifyContent:"space-between"}}>
              <span>⚠️ {error}</span>
              <button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer"}}>✕</button>
            </div>
          )}

          {/* Table Card */}
          <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,overflow:"hidden"}}>

            {/* Toolbar */}
            <div className="sl-toolbar">
              <div style={{display:"flex",alignItems:"center",gap:6,
                background:`${srcMeta.color}10`,border:`1px solid ${srcMeta.color}30`,
                padding:"4px 10px",borderRadius:8}}>
                <span>{srcMeta.icon}</span>
                <span style={{fontSize:"0.8rem",fontWeight:700,color:srcMeta.color}}>{srcMeta.label}</span>
              </div>
              <input className="search-inp sl-search"
                value={search} onChange={e=>handleSearch(e.target.value)}
                placeholder="🔍 Search..."
                style={{background:"#111c2e",border:"1px solid #1a2d4a",borderRadius:9,
                  padding:"7px 12px",color:"#e2e8f0",fontSize:"0.82rem",outline:"none",
                  transition:"all .2s"}} />
              <span style={{fontSize:"0.7rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace",marginLeft:"auto"}}>
                {filtered.length.toLocaleString()} results
              </span>
            </div>

            {loading&&(
              <div style={{height:2,background:"#111c2e",overflow:"hidden"}}>
                <div style={{height:"100%",width:"60%",borderRadius:2,
                  background:"linear-gradient(90deg,#00d4ff,#8b5cf6)",animation:"shimmer 1.4s infinite"}} />
              </div>
            )}

            {/* Desktop Table */}
            <div className="sl-table-wrap">
              <table className="sl-table">
                <thead>
                  <tr style={{background:"#111c2e"}}>
                    {["#","Name","Aliases","Type","Country","Source","DOB"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",
                        fontSize:"0.64rem",fontWeight:700,color:"#3a5a7a",
                        letterSpacing:"0.8px",borderBottom:"1px solid #1a2d4a",
                        textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading&&Array.from({length:6}).map((_,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #111c2e"}}>
                      {Array.from({length:7}).map((_,j)=>(
                        <td key={j} style={{padding:"12px 14px"}}>
                          <div className="skeleton" style={{height:13,width:j===0?"20px":j===1?"130px":j===2?"100px":"70px"}} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!loading&&paginated.map((r,i)=>{
                    const src  = SOURCES.find(s=>s.id===(r.source||"").toUpperCase())||SOURCES[0];
                    const tSty = typeStyle(r.type);
                    return (
                      <tr key={r.id||i} className="sl-row" style={{borderBottom:"1px solid #111c2e",transition:"background .15s"}}>
                        <td style={{padding:"11px 14px",fontSize:"0.68rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>
                          {(page-1)*PAGE_SIZE+i+1}
                        </td>
                        <td style={{padding:"11px 14px"}}>
                          <div style={{fontSize:"0.85rem",fontWeight:600,color:"#e2e8f0",
                            maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {r.name||"—"}
                          </div>
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.78rem",color:"#7a8fa8",
                          maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {Array.isArray(r.aliases)
                            ?r.aliases.map(a=>typeof a==="string"?a:String(a.lastName||a.firstName||a.name||Object.values(a).find(v=>typeof v==="string")||"")).filter(Boolean).join("; ")||"—"
                            :(typeof r.aliases==="string"?r.aliases:"—")}
                        </td>
                        <td style={{padding:"11px 14px"}}>
                          {r.type?(
                            <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.68rem",fontWeight:700,
                              fontFamily:"'JetBrains Mono',monospace",
                              background:tSty.bg,color:tSty.color,border:`1px solid ${tSty.border}`}}>
                              {r.type.toUpperCase()}
                            </span>
                          ):<span style={{color:"#3a5a7a"}}>—</span>}
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.8rem",color:"#94a3b8"}}>
                          {extractCountry(r.country,r.nationality)}
                        </td>
                        <td style={{padding:"11px 14px"}}>
                          <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.68rem",fontWeight:700,
                            fontFamily:"'JetBrains Mono',monospace",
                            background:`${src.color}12`,color:src.color,border:`1px solid ${src.color}28`}}>
                            {src.icon} {r.source||"—"}
                          </span>
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.74rem",color:"#7a8fa8",
                          fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                          {extractDob(r.dateOfBirth||r.dob)}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading&&paginated.length===0&&(
                    <tr><td colSpan={7} style={{padding:"40px 20px",textAlign:"center"}}>
                      <div style={{fontSize:"2rem",marginBottom:8}}>{search?"🔍":"📋"}</div>
                      <div style={{fontSize:"0.9rem",fontWeight:600,color:"#4a6a8a"}}>
                        {search?"No results found":"No records available"}
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sl-cards">
              {loading&&Array.from({length:4}).map((_,i)=>(
                <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid #111c2e"}}>
                  <div className="skeleton" style={{height:14,width:"60%",marginBottom:8}} />
                  <div className="skeleton" style={{height:11,width:"40%"}} />
                </div>
              ))}
              {!loading&&paginated.map((r,i)=>{
                const src  = SOURCES.find(s=>s.id===(r.source||"").toUpperCase())||SOURCES[0];
                const tSty = typeStyle(r.type);
                const aliases = Array.isArray(r.aliases)
                  ?r.aliases.map(a=>typeof a==="string"?a:String(a.lastName||a.firstName||"")).filter(Boolean).join("; ")
                  :(typeof r.aliases==="string"?r.aliases:"");
                return (
                  <div key={r.id||i} style={{padding:"12px 14px",borderBottom:"1px solid #111c2e",
                    animation:`fadeUp .3s ease ${i*.03}s both`}}>
                    {/* Name + Source */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:"0.88rem",fontWeight:700,color:"#e2e8f0",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {r.name||"—"}
                        </div>
                        {aliases&&<div style={{fontSize:"0.72rem",color:"#7a8fa8",marginTop:2,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{aliases}</div>}
                      </div>
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.68rem",fontWeight:700,
                        fontFamily:"'JetBrains Mono',monospace",flexShrink:0,marginLeft:8,
                        background:`${src.color}12`,color:src.color,border:`1px solid ${src.color}28`}}>
                        {src.icon} {r.source||"—"}
                      </span>
                    </div>
                    {/* Type + Country + DOB */}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      {r.type&&(
                        <span style={{padding:"2px 7px",borderRadius:5,fontSize:"0.67rem",fontWeight:700,
                          fontFamily:"'JetBrains Mono',monospace",
                          background:tSty.bg,color:tSty.color,border:`1px solid ${tSty.border}`}}>
                          {r.type.toUpperCase()}
                        </span>
                      )}
                      <span style={{fontSize:"0.75rem",color:"#94a3b8"}}>
                        {extractCountry(r.country,r.nationality)}
                      </span>
                      {extractDob(r.dateOfBirth||r.dob)!=="—"&&(
                        <span style={{fontSize:"0.72rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>
                          {extractDob(r.dateOfBirth||r.dob)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {!loading&&paginated.length===0&&(
                <div style={{padding:"40px 20px",textAlign:"center",color:"#4a6a8a"}}>
                  {search?"No results found":"No records available"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading&&filtered.length>PAGE_SIZE&&(
              <div className="sl-pagination">
                <div style={{fontSize:"0.73rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:"#00d4ff"}}>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)}</span>
                  {" "}of <span style={{color:"#00d4ff"}}>{filtered.length.toLocaleString()}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button className="pg-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}
                    style={{padding:"5px 11px",background:"#111c2e",border:"1px solid #1a2d4a",
                      borderRadius:8,color:page===1?"#3a5a7a":"#94a3b8",
                      fontSize:"0.78rem",cursor:page===1?"not-allowed":"pointer"}}>←</button>
                  {Array.from({length:totalPages},(_,i)=>i+1)
                    .filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1)
                    .reduce((acc,n,i,arr)=>{if(i>0&&n-arr[i-1]>1)acc.push("...");acc.push(n);return acc;},[])
                    .map((n,i)=>n==="..."
                      ?<span key={`e${i}`} style={{color:"#3a5a7a",fontSize:"0.78rem",padding:"0 2px"}}>…</span>
                      :<button key={n} className="pg-btn" onClick={()=>setPage(n)}
                        style={{width:28,height:28,borderRadius:7,
                          background:n===page?"rgba(0,212,255,.12)":"#111c2e",
                          border:n===page?"1px solid rgba(0,212,255,.4)":"1px solid #1a2d4a",
                          color:n===page?"#00d4ff":"#94a3b8",fontSize:"0.76rem",cursor:"pointer",
                          fontWeight:n===page?700:400}}>{n}</button>
                    )}
                  <button className="pg-btn" onClick={()=>setPage(p=>p+1)} disabled={page===totalPages}
                    style={{padding:"5px 11px",background:"#111c2e",border:"1px solid #1a2d4a",
                      borderRadius:8,color:page===totalPages?"#3a5a7a":"#94a3b8",
                      fontSize:"0.78rem",cursor:page===totalPages?"not-allowed":"pointer"}}>→</button>
                </div>
                <div style={{fontSize:"0.68rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>
                  {page}/{totalPages}
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}