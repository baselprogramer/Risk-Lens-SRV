import React, { useState } from "react";
import { searchSanctions, getPersonDetails } from "../services/searchService";
import Layout from "../components/Layout";

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  orange:"#f59e0b", red:"#ef4444", text:"#e2e8f0", text2:"#7a8fa8",
};

function normalizeAliases(aliases) {
  if (!aliases) return [];
  if (!Array.isArray(aliases)) aliases = [aliases];
  return aliases.flatMap(alias => {
    if (!alias) return [];
    if (typeof alias === "object") {
      if (alias.wholeName)  return [alias.wholeName.trim()];
      if (alias.lastName)   return [alias.lastName.trim()];
      if (alias.whole_name) return [alias.whole_name.trim()];
      if (alias.name)       return [alias.name.trim()];
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
  if (Array.isArray(dobs))
    return dobs.map(d => d.dateOfBirth||d.year||d.date_of_birth||JSON.stringify(d)).filter(Boolean);
  return [dobs];
}

function normalizeNationality(n) {
  if (!n) return [];
  if (Array.isArray(n))
    return n.map(x => x.country||x.nationality||x.value||JSON.stringify(x)).filter(Boolean);
  return [n];
}

function getRiskConfig(score) {
  if (score >= 90) return { label:"CRITICAL", color:C.red,    bg:"rgba(239,68,68,0.12)"  };
  if (score >= 75) return { label:"HIGH",     color:C.orange, bg:"rgba(245,158,11,0.12)" };
  if (score >= 55) return { label:"MEDIUM",   color:C.cyan,   bg:"rgba(0,212,255,0.10)"  };
  return               { label:"LOW",      color:C.green,  bg:"rgba(16,185,129,0.10)" };
}

function getSourceColor(source) {
  switch (source) {
    case "OFAC":  return C.red;
    case "EU":    return C.purple;
    case "UN":    return C.orange;
    case "UK":    return C.cyan;
    case "LOCAL": return C.green;
    default:      return C.text2;
  }
}

const SanctionsSearch = () => {
  const [query,          setQuery]          = useState("");
  const [results,        setResults]        = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [hasSearched,    setHasSearched]    = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setHasSearched(true);
    try {
      const data = await searchSanctions(query.trim());
      setResults(data);
    } catch { alert("Search failed"); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin  {to{transform:rotate(360deg)}}
        .ss-card:hover{transform:translateY(-2px)!important;box-shadow:0 8px 32px rgba(0,212,255,0.10)!important;}
        .ss-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.08);}
        .ss-detail-row:hover{background:rgba(0,212,255,0.04)!important;}
        .ss-input:focus{border-color:rgba(0,212,255,0.5)!important;box-shadow:0 0 0 3px rgba(0,212,255,0.08)!important;}

        /* ── Responsive ── */
        .ss-scores{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
        .ss-modal-inner{width:560px;max-height:82vh;}
        .ss-detail-grid{display:grid;grid-template-columns:130px 1fr;gap:10px;}
        .ss-search-row{display:flex;gap:12px;}

        @media(max-width:768px){
          .ss-scores{grid-template-columns:repeat(3,1fr)!important;gap:8px!important;}
          .ss-modal-inner{width:calc(100vw - 32px)!important;max-height:90vh!important;}
          .ss-detail-grid{grid-template-columns:100px 1fr!important;}
          .ss-search-row{flex-direction:column!important;gap:8px!important;}
          .ss-search-btn{width:100%!important;}
          .page-title{font-size:1.3rem!important;}
          .ss-card-padding{padding:14px 16px!important;}
          .ss-result-name{font-size:15px!important;}
        }
      `}</style>

      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",animation:"fadeUp .5s ease"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
          <div style={{width:4,height:36,background:`linear-gradient(180deg,${C.cyan},${C.purple})`,borderRadius:2}} />
          <div>
            <h2 className="page-title" style={{margin:0,fontSize:22,fontWeight:700,color:C.text}}>Sanctions Search</h2>
            <p style={{margin:0,fontSize:12,color:C.text2,marginTop:2}}>OFAC · EU · UN · UK · Local</p>
          </div>
        </div>

        {/* Search Box */}
        <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,
          padding:"16px 18px",marginBottom:22,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,
            background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
          <div className="ss-search-row">
            <input className="ss-input" type="text" placeholder="Enter name to search..."
              value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleSearch()}
              style={{flex:1,padding:"12px 14px",background:C.s2,border:`1px solid ${C.border}`,
                borderRadius:9,fontSize:14,color:C.text,outline:"none",transition:"all .2s",
                fontFamily:"'IBM Plex Sans',sans-serif"}} />
            <button className="ss-btn ss-search-btn" onClick={handleSearch} disabled={loading}
              style={{background:loading?C.s2:`linear-gradient(135deg,${C.cyan},${C.purple})`,
                color:loading?C.text2:C.bg,padding:"12px 24px",border:"none",borderRadius:9,
                fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",
                transition:"all .2s",whiteSpace:"nowrap",
                boxShadow:loading?"none":`0 4px 16px rgba(0,212,255,0.22)`}}>
              {loading?"Searching...":"🔍 Search"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{textAlign:"center",padding:"50px 0"}}>
            <div style={{width:34,height:34,border:`3px solid ${C.border}`,
              borderTop:`3px solid ${C.cyan}`,borderRadius:"50%",
              animation:"spin 1s linear infinite",display:"inline-block"}} />
            <p style={{marginTop:14,color:C.text2,fontSize:14}}>Searching sanctions databases...</p>
          </div>
        )}

        {/* No Results */}
        {!loading&&hasSearched&&results.length===0&&(
          <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,
            padding:"50px 24px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:14,opacity:.3}}>🔍</div>
            <h4 style={{color:C.text,margin:"0 0 8px",fontSize:17,fontWeight:600}}>No Matching Records Found</h4>
            <p style={{color:C.text2,margin:0,fontSize:13}}>Try a different name or spelling</p>
          </div>
        )}

        {/* Results */}
        {!loading&&results.map((item,i) => {
          const risk = getRiskConfig(item.score);
          const srcColor = getSourceColor(item.source);
          return (
            <div key={item.id} className="ss-card" style={{background:C.s1,border:`1px solid ${C.border}`,
              borderRadius:14,marginBottom:14,transition:"all .2s",overflow:"hidden",
              animation:`fadeUp .4s ease ${i*.06}s both`,boxShadow:"0 2px 12px rgba(0,0,0,0.25)"}}>
              <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
              <div className="ss-card-padding" style={{padding:"18px 22px"}}>

                {/* Name + Risk */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
                  marginBottom:12,gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <h4 className="ss-result-name" style={{margin:"0 0 5px",fontSize:17,fontWeight:700,
                      color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {item.name}
                    </h4>
                    <span style={{background:`${srcColor}22`,color:srcColor,
                      border:`1px solid ${srcColor}44`,padding:"2px 9px",borderRadius:5,
                      fontSize:11,fontWeight:700,letterSpacing:"0.5px",
                      fontFamily:"'JetBrains Mono',monospace"}}>
                      {item.source}
                    </span>
                  </div>
                  <span style={{background:risk.bg,color:risk.color,
                    border:`1px solid ${risk.color}44`,padding:"4px 12px",borderRadius:7,
                    fontSize:11,fontWeight:700,letterSpacing:"0.5px",flexShrink:0,
                    fontFamily:"'JetBrains Mono',monospace"}}>
                    {risk.label}
                  </span>
                </div>

                {/* Scores */}
                <div className="ss-scores">
                  {[
                    {label:"Match",   value:`${item.score.toFixed(1)}%`,          color:C.cyan   },
                    {label:"Name",    value:`${item.nameSimilarity.toFixed(1)}%`,  color:C.purple },
                    {label:"Alias",   value:`${item.aliasSimilarity.toFixed(1)}%`, color:C.green  },
                  ].map(({label,value,color}) => (
                    <div key={label} style={{background:C.s2,border:`1px solid ${C.border}`,
                      borderRadius:9,padding:"9px 12px"}}>
                      <div style={{fontSize:10,color:C.text2,marginBottom:3,
                        textTransform:"uppercase",letterSpacing:"0.4px"}}>{label}</div>
                      <div style={{fontSize:16,fontWeight:700,color,
                        fontFamily:"'JetBrains Mono',monospace"}}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* View Details */}
                <button className="ss-btn" onClick={async () => {
                  try {
                    const details = await getPersonDetails(item.id, item.source);
                    setSelectedPerson({...details, source:item.source});
                  } catch(err) { console.error(err); }
                }} style={{background:`linear-gradient(135deg,${C.cyan},${C.purple})`,
                  color:C.bg,padding:"9px 20px",border:"none",borderRadius:8,
                  fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s",
                  boxShadow:`0 4px 14px rgba(0,212,255,0.2)`}}>
                  View Details →
                </button>
              </div>
            </div>
          );
        })}

        {/* Modal */}
        {selectedPerson && (
          <div onClick={()=>setSelectedPerson(null)} style={{position:"fixed",inset:0,
            background:"rgba(6,9,18,0.85)",display:"flex",alignItems:"center",
            justifyContent:"center",zIndex:1000,backdropFilter:"blur(6px)",padding:"16px"}}>
            <div className="ss-modal-inner" onClick={e=>e.stopPropagation()}
              style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,
                overflowY:"auto",position:"relative",
                boxShadow:"0 24px 64px rgba(0,0,0,0.6)",animation:"fadeUp .25s ease"}}>
              <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`,
                borderRadius:"16px 16px 0 0"}} />
              <div style={{padding:"20px 22px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:4,height:26,background:`linear-gradient(180deg,${C.cyan},${C.purple})`,borderRadius:2}} />
                    <h2 style={{margin:0,fontSize:18,fontWeight:700,color:C.text}}>Entity Details</h2>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:`${getSourceColor(selectedPerson.source)}22`,
                      color:getSourceColor(selectedPerson.source),
                      border:`1px solid ${getSourceColor(selectedPerson.source)}44`,
                      padding:"2px 10px",borderRadius:6,fontSize:11,fontWeight:700,
                      fontFamily:"'JetBrains Mono',monospace"}}>
                      {selectedPerson.source}
                    </span>
                    <button onClick={()=>setSelectedPerson(null)} style={{background:"none",border:"none",
                      color:C.text2,cursor:"pointer",fontSize:18,padding:"0 4px",lineHeight:1}}>✕</button>
                  </div>
                </div>

                {[
                  {label:"Full Name",    value:selectedPerson.name},
                  {label:"Aliases",      value:normalizeAliases(selectedPerson.aliases).join(" · ")||"—"},
                  {label:"Date of Birth",value:normalizeDOB(selectedPerson.dateOfBirth).join(", ")||"—"},
                  {label:"Nationality",  value:normalizeNationality(selectedPerson.nationality).join(", ")||"—"},
                  {label:"Program",      value:selectedPerson.program||"—"},
                  {label:"Remarks",      value:selectedPerson.remarks||"—"},
                ].map(({label,value}) => (
                  <div key={label} className="ss-detail-row ss-detail-grid"
                    style={{gap:10,padding:"10px 10px",borderRadius:7,
                      borderBottom:`1px solid ${C.border}`,transition:"background .15s"}}>
                    <div style={{fontSize:11,color:C.text2,fontWeight:600,
                      textTransform:"uppercase",letterSpacing:"0.4px",paddingTop:2}}>
                      {label}
                    </div>
                    <div style={{fontSize:13,color:C.text,fontWeight:value==="—"?400:500,lineHeight:1.5}}>
                      {value}
                    </div>
                  </div>
                ))}

                <button className="ss-btn" onClick={()=>setSelectedPerson(null)}
                  style={{marginTop:16,width:"100%",
                    background:`linear-gradient(135deg,${C.red},#dc2626)`,
                    color:"white",padding:"11px",border:"none",borderRadius:9,
                    fontSize:14,fontWeight:700,cursor:"pointer",
                    boxShadow:"0 4px 14px rgba(239,68,68,0.25)"}}>
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SanctionsSearch;