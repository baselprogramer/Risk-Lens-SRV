import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAllSanctions, createSanction, updateSanction, deleteSanction } from "../services/localSanctionService";
import LocalSanctionForm from "../components/LocalSanctionForm";
import { API_V1 } from "../config/api";
import { Pencil, Trash2, RefreshCw, RotateCcw, Upload, FileSpreadsheet, Plus, Search } from "lucide-react";

const PAGE_SIZE = 10;

const LocalSanctionsPage = () => {
  const [sanctions,  setSanctions]  = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [error,      setError]      = useState(null);
  const [file,       setFile]       = useState(null);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try { setLoading(true); setError(null); setSanctions(await getAllSanctions()); }
    catch (e) { setError("Failed to load sanctions."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleReindex = async () => {
    if (!window.confirm("Reindex all local sanctions?")) return;
    setReindexing(true);
    try {
      const res = await fetch(`${API_V1}/elastic/reindex-local`, {
        method:"POST", headers:{ Authorization:`Bearer ${localStorage.getItem("jwtToken")}` },
      });
      if (!res.ok) throw new Error(`Reindex failed: ${res.status}`);
      showToast("Reindex completed!");
    } catch (e) { showToast(e.message||"Reindex failed","error"); }
    finally { setReindexing(false); }
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true); setError(null);
      if (selected) { await updateSanction(selected.id, data); showToast("Record updated"); setSelected(null); }
      else           { await createSanction(data); showToast("Record added"); }
      await loadData();
    } catch (e) { setError(e.message||"Failed"); showToast(e.message||"Failed","error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sanction?")) return;
    try { setLoading(true); await deleteSanction(id); showToast("Record deleted"); await loadData(); }
    catch (e) { showToast(e.message||"Failed","error"); }
    finally { setLoading(false); }
  };

  const handleEdit = (s) => { setSelected(s); setError(null); window.scrollTo({top:0,behavior:"smooth"}); };
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) { showToast("Select a file first!","error"); return; }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${API_V1}/local-sanctions/import`, {
        method:"POST", headers:{ Authorization:`Bearer ${localStorage.getItem("jwtToken")}` }, body:formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const result = await res.json();
      showToast(`${result.saved} records imported`);
      setFile(null); await loadData();
    } catch (e) { setError(e.message); showToast(e.message,"error"); }
    finally { setLoading(false); }
  };

  const filtered   = sanctions.filter(s => !search ||
    (s.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (s.nationality||"").toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  // ── SVG Icon components ──
  const IconEdit    = () => <Pencil      size={14} strokeWidth={2} />;
  const IconDelete  = () => <Trash2      size={14} strokeWidth={2} />;
  const IconRefresh = () => <RefreshCw   size={14} strokeWidth={2} />;
  const IconReindex = () => <RotateCcw   size={14} strokeWidth={2} />;
  const IconUpload  = () => <Upload      size={14} strokeWidth={2} />;
  const IconFile    = () => <FileSpreadsheet size={14} strokeWidth={2} />;
  const IconAdd     = () => <Plus        size={14} strokeWidth={2} />;
  const IconSearch  = () => <Search      size={14} strokeWidth={2} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;}
        @keyframes spin   {to{transform:rotate(360deg)}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .ls-row:hover{background:rgba(0,212,255,0.04)!important;}
        .pg-btn:hover:not(:disabled){background:rgba(0,212,255,0.12)!important;border-color:rgba(0,212,255,0.4)!important;color:#00d4ff!important;}
        .icon-btn:hover{opacity:1!important;filter:brightness(1.15);transform:scale(1.05);}
        .upload-zone:hover{background:rgba(0,212,255,0.08)!important;border-color:rgba(0,212,255,0.5)!important;}
        .reindex-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
        .tool-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}

        .ls-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid #1a2d4a;}
        .ls-search{width:200px;}
        .ls-table-wrap{overflow-x:auto;}
        .ls-table{width:100%;border-collapse:collapse;min-width:600px;}
        .ls-cards{display:none;}
        .ls-pagination{padding:12px 16px;border-top:1px solid #1a2d4a;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}

        @media(max-width:768px){
          .ls-table-wrap{display:none!important;}
          .ls-cards{display:block!important;}
          .ls-search{width:100%!important;}
          .ls-toolbar{gap:8px!important;}
          .upload-row{flex-direction:column!important;}
          .page-title{font-size:1.2rem!important;}
        }
      `}</style>

      <Layout>
        <div style={{maxWidth:1300,margin:"0 auto",animation:"fadeUp .4s ease"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22,flexWrap:"wrap"}}>
            <div style={{width:4,height:34,background:"linear-gradient(180deg,#00d4ff,#8b5cf6)",borderRadius:4}} />
            <div style={{flex:1}}>
              <h2 className="page-title" style={{margin:0,fontSize:"1.5rem",fontWeight:700,color:"#e2e8f0"}}>Local Sanctions</h2>
              <p style={{margin:0,fontSize:"0.75rem",color:"#7a8fa8",marginTop:2}}>Manage local sanction records</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0,212,255,.07)",
              border:"1px solid rgba(0,212,255,.2)",padding:"5px 12px",borderRadius:20,
              fontSize:"0.7rem",color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace"}}>
              {sanctions.length.toLocaleString()} records
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div style={{position:"fixed",top:20,right:20,zIndex:999,padding:"12px 16px",
              borderRadius:10,animation:"slideIn .3s ease",
              background:toast.type==="error"?"rgba(239,68,68,0.12)":"rgba(16,185,129,0.12)",
              border:`1px solid ${toast.type==="error"?"rgba(239,68,68,0.35)":"rgba(16,185,129,0.35)"}`,
              color:toast.type==="error"?"#ef4444":"#10b981",
              fontSize:"0.84rem",fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
              maxWidth:"calc(100vw - 40px)",display:"flex",alignItems:"center",gap:8}}>
              {toast.type==="error"
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              }
              {toast.msg}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",
              borderRadius:10,padding:"10px 14px",marginBottom:16,
              color:"#ef4444",fontSize:"0.82rem",
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
              <button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",
                display:"flex",alignItems:"center"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          {/* Upload */}
          <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,
            padding:"16px",marginBottom:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:"linear-gradient(90deg,#00d4ff,#8b5cf6,transparent)",opacity:.6}} />
            <div style={{display:"flex",alignItems:"center",gap:7,fontSize:"0.75rem",fontWeight:700,
              color:"#7a8fa8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>
              <FileSpreadsheet size={14} color="#7a8fa8" />
              Import Excel
            </div>
            <div className="upload-row" style={{display:"flex",gap:10,alignItems:"center"}}>
              <label style={{flex:1,cursor:loading?"not-allowed":"pointer"}}>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={loading} style={{display:"none"}} />
                <div className="upload-zone" style={{padding:"10px 14px",
                  border:"1px dashed rgba(0,212,255,0.3)",borderRadius:9,
                  background:"rgba(0,212,255,0.04)",
                  color:file?"#e2e8f0":"#7a8fa8",fontSize:"0.84rem",
                  transition:"all 0.2s",textAlign:"center",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                  <FileSpreadsheet size={15} />
                  {file ? file.name : "Choose Excel file (.xlsx, .xls)"}
                </div>
              </label>
              <button className="tool-btn" onClick={handleUpload} disabled={loading||!file} style={{
                background:loading||!file?"#1a2d4a":"linear-gradient(135deg,#10b981,#059669)",
                color:loading||!file?"#3a5a7a":"#fff",
                padding:"10px 16px",border:"none",borderRadius:9,
                fontSize:"0.84rem",fontWeight:600,
                cursor:loading||!file?"not-allowed":"pointer",
                display:"flex",alignItems:"center",gap:6,
                transition:"all .2s",whiteSpace:"nowrap",
                boxShadow:loading||!file?"none":"0 4px 12px rgba(16,185,129,0.25)"}}>
                <Upload size={14} />
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          {/* Form */}
          <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,
            padding:"16px",marginBottom:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:selected?"linear-gradient(90deg,#f59e0b,#f97316,transparent)":"linear-gradient(90deg,#8b5cf6,#00d4ff,transparent)",
              opacity:.6}} />
            <div style={{display:"flex",alignItems:"center",gap:7,fontSize:"0.75rem",fontWeight:700,
              color:"#7a8fa8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>
              {selected
                ? <><Pencil size={13} /> Edit Sanction</>
                : <><Plus   size={13} /> Add New Sanction</>
              }
            </div>
            <LocalSanctionForm onSubmit={handleSubmit} selected={selected}
              onCancel={()=>{setSelected(null);setError(null);}} disabled={loading} />
          </div>

          {/* Table Card */}
          <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,overflow:"hidden"}}>

            {/* Toolbar */}
            <div className="ls-toolbar">
              <div style={{fontSize:"0.95rem",fontWeight:700,color:"#e2e8f0",marginRight:"auto"}}>
                Records
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                <Search size={13} color="#3a5a7a" style={{position:"absolute",left:10,pointerEvents:"none"}} />
                <input value={search} onChange={e=>handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="ls-search"
                  style={{background:"#111c2e",border:"1px solid #1a2d4a",borderRadius:9,
                    padding:"7px 12px 7px 30px",color:"#e2e8f0",fontSize:"0.82rem",outline:"none"}}
                  onFocus={e=>e.target.style.borderColor="rgba(0,212,255,.4)"}
                  onBlur={e=>e.target.style.borderColor="#1a2d4a"} />
              </div>

              {/* Refresh */}
              <button className="tool-btn" onClick={loadData} disabled={loading} style={{
                padding:"7px 12px",background:"rgba(0,212,255,.07)",
                border:"1px solid rgba(0,212,255,.2)",borderRadius:9,
                color:"#00d4ff",cursor:loading?"not-allowed":"pointer",
                display:"flex",alignItems:"center",gap:5,
                fontSize:"0.78rem",transition:"all .2s",opacity:loading?.5:1}}>
                {loading
                  ? <span style={{display:"inline-block",width:12,height:12,
                      border:"2px solid rgba(0,212,255,.3)",borderTop:"2px solid #00d4ff",
                      borderRadius:"50%",animation:"spin .8s linear infinite"}} />
                  : <RefreshCw size={13} />
                }
              </button>

              {/* Reindex */}
              <button className="reindex-btn" onClick={handleReindex} disabled={reindexing} style={{
                padding:"7px 12px",
                background:reindexing?"#1a2d4a":"linear-gradient(135deg,rgba(139,92,246,0.15),rgba(0,212,255,0.15))",
                border:`1px solid ${reindexing?"#1a2d4a":"rgba(139,92,246,0.4)"}`,
                borderRadius:9,color:reindexing?"#3a5a7a":"#a78bfa",
                fontSize:"0.78rem",fontWeight:600,
                cursor:reindexing?"not-allowed":"pointer",
                display:"flex",alignItems:"center",gap:5,transition:"all .2s"}}>
                {reindexing
                  ? <span style={{display:"inline-block",width:11,height:11,
                      border:"2px solid rgba(139,92,246,.3)",borderTop:"2px solid #8b5cf6",
                      borderRadius:"50%",animation:"spin .8s linear infinite"}} />
                  : <RotateCcw size={13} />
                }
                <span>Reindex</span>
              </button>
            </div>

            {loading && <div style={{height:2,background:"#111c2e",overflow:"hidden"}}>
              <div style={{height:"100%",width:"40%",background:"linear-gradient(90deg,#00d4ff,#8b5cf6)",borderRadius:2}} />
            </div>}

            {/* Desktop Table */}
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr style={{background:"#111c2e"}}>
                    {["#","Name","Nationality","Status","Actions"].map(h=>(
                      <th key={h} style={{padding:"10px 14px",textAlign:"left",
                        fontSize:"0.66rem",fontWeight:700,color:"#3a5a7a",
                        letterSpacing:"0.8px",borderBottom:"1px solid #1a2d4a",
                        textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s,i)=>(
                    <tr key={s.id} className="ls-row" style={{borderBottom:"1px solid #111c2e",transition:"background .15s"}}>
                      <td style={{padding:"11px 14px",fontSize:"0.7rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>
                        {(page-1)*PAGE_SIZE+i+1}
                      </td>
                      <td style={{padding:"11px 14px"}}>
                        <div style={{fontSize:"0.85rem",fontWeight:600,color:"#e2e8f0"}}>{s.name||"—"}</div>
                        {s.note && <div style={{fontSize:"0.72rem",color:"#7a8fa8",marginTop:2,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{s.note}</div>}
                      </td>
                      <td style={{padding:"11px 14px",fontSize:"0.82rem",color:"#94a3b8"}}>{s.nationality||s.country||"—"}</td>
                      <td style={{padding:"11px 14px"}}>
                        <span style={{padding:"2px 9px",borderRadius:6,fontSize:"0.7rem",fontWeight:700,
                          fontFamily:"'JetBrains Mono',monospace",
                          ...(s.active||s.status==="ACTIVE"
                            ?{background:"rgba(16,185,129,0.1)",color:"#10b981",border:"1px solid rgba(16,185,129,0.25)"}
                            :{background:"rgba(239,68,68,0.1)", color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)"})}}>
                          {s.active||s.status==="ACTIVE"?"ACTIVE":"INACTIVE"}
                        </span>
                      </td>
                      <td style={{padding:"11px 14px"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button className="icon-btn" onClick={()=>handleEdit(s)} title="Edit"
                            style={{padding:"6px 10px",background:"rgba(0,212,255,0.08)",
                              border:"1px solid rgba(0,212,255,0.2)",borderRadius:7,
                              color:"#00d4ff",cursor:"pointer",opacity:.85,
                              display:"flex",alignItems:"center",transition:"all .2s"}}>
                            <Pencil size={13} strokeWidth={2} />
                          </button>
                          <button className="icon-btn" onClick={()=>handleDelete(s.id)} title="Delete"
                            style={{padding:"6px 10px",background:"rgba(239,68,68,0.08)",
                              border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,
                              color:"#ef4444",cursor:"pointer",opacity:.85,
                              display:"flex",alignItems:"center",transition:"all .2s"}}>
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading&&paginated.length===0&&(
                    <tr><td colSpan={5} style={{padding:"40px 20px",textAlign:"center"}}>
                      <div style={{marginBottom:10,opacity:.4}}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7a8fa8" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <div style={{fontSize:"0.9rem",fontWeight:600,color:"#4a6a8a"}}>
                        {search?"No results found":"No Sanctions Found"}
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="ls-cards">
              {paginated.map((s,i)=>(
                <div key={s.id} style={{padding:"14px 16px",borderBottom:"1px solid #111c2e",
                  animation:`fadeUp .3s ease ${i*.04}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"0.9rem",fontWeight:700,color:"#e2e8f0",
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {s.name||"—"}
                      </div>
                      {s.nationality&&<div style={{fontSize:"0.72rem",color:"#7a8fa8",marginTop:2}}>{s.nationality}</div>}
                    </div>
                    <span style={{padding:"2px 9px",borderRadius:6,fontSize:"0.7rem",fontWeight:700,
                      fontFamily:"'JetBrains Mono',monospace",flexShrink:0,marginLeft:8,
                      ...(s.active||s.status==="ACTIVE"
                        ?{background:"rgba(16,185,129,0.1)",color:"#10b981",border:"1px solid rgba(16,185,129,0.25)"}
                        :{background:"rgba(239,68,68,0.1)", color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)"})}}>
                      {s.active||s.status==="ACTIVE"?"ACTIVE":"INACTIVE"}
                    </span>
                  </div>
                  {s.note&&<div style={{fontSize:"0.75rem",color:"#7a8fa8",marginBottom:8,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.note}</div>}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>handleEdit(s)} style={{flex:1,padding:"8px",
                      background:"rgba(0,212,255,0.08)",border:"1px solid rgba(0,212,255,0.2)",
                      borderRadius:8,color:"#00d4ff",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={()=>handleDelete(s.id)} style={{flex:1,padding:"8px",
                      background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",
                      borderRadius:8,color:"#ef4444",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!loading&&paginated.length===0&&(
                <div style={{padding:"40px 20px",textAlign:"center",color:"#4a6a8a"}}>
                  {search?"No results found":"No Sanctions Found"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filtered.length>PAGE_SIZE&&(
              <div className="ls-pagination">
                <div style={{fontSize:"0.74rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:"#00d4ff"}}>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)}</span>
                  {" "}of <span style={{color:"#00d4ff"}}>{filtered.length}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <button className="pg-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}
                    style={{padding:"6px 11px",background:"#111c2e",border:"1px solid #1a2d4a",
                      borderRadius:8,color:page===1?"#3a5a7a":"#94a3b8",
                      fontSize:"0.78rem",cursor:page===1?"not-allowed":"pointer",
                      display:"flex",alignItems:"center"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  {Array.from({length:totalPages},(_,i)=>i+1)
                    .filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1)
                    .reduce((acc,n,i,arr)=>{if(i>0&&n-arr[i-1]>1)acc.push("...");acc.push(n);return acc;},[])
                    .map((n,i)=>n==="..."
                      ?<span key={`e${i}`} style={{color:"#3a5a7a",fontSize:"0.78rem",padding:"0 2px"}}>…</span>
                      :<button key={n} className="pg-btn" onClick={()=>setPage(n)}
                        style={{width:30,height:30,borderRadius:8,
                          background:n===page?"rgba(0,212,255,0.12)":"#111c2e",
                          border:n===page?"1px solid rgba(0,212,255,0.4)":"1px solid #1a2d4a",
                          color:n===page?"#00d4ff":"#94a3b8",fontSize:"0.78rem",cursor:"pointer",
                          fontWeight:n===page?700:400}}>{n}</button>
                    )}
                  <button className="pg-btn" onClick={()=>setPage(p=>p+1)} disabled={page===totalPages}
                    style={{padding:"6px 11px",background:"#111c2e",border:"1px solid #1a2d4a",
                      borderRadius:8,color:page===totalPages?"#3a5a7a":"#94a3b8",
                      fontSize:"0.78rem",cursor:page===totalPages?"not-allowed":"pointer",
                      display:"flex",alignItems:"center"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
                <div style={{fontSize:"0.7rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>
                  {page}/{totalPages}
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default LocalSanctionsPage;