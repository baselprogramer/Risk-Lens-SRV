import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAllSanctions, createSanction, updateSanction, deleteSanction } from "../services/localSanctionService";
import LocalSanctionForm from "../components/LocalSanctionForm";
import { API_V1 } from "../config/api";
import { authHeaders, getToken } from "../services/authService";
import { Pencil, Trash2, RefreshCw, RotateCcw, Upload, FileSpreadsheet, Plus, Search, X } from "lucide-react";
import { useLang } from "../context/LangContext";
import { staticContent2 } from "../locales/content_2";

const PAGE_SIZE = 10;

const LocalSanctionsPage = () => {
  const [sanctions,      setSanctions]      = useState([]);
  const [selected,       setSelected]       = useState(null);
  const [viewing,        setViewing]        = useState(null);
  const [showForm,       setShowForm]       = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [reindexing,     setReindexing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [file,           setFile]           = useState(null);
  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState("");
  const [typeFilter,     setTypeFilter]     = useState("ALL");
  const [toast,          setToast]          = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [confirmReindex, setConfirmReindex] = useState(false);

  const {lang} = useLang()
  const t = staticContent2.localSanction?.[lang] || staticContent2.localSanction?.en || {};
  const isRtl = lang === "ar";
  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try { setLoading(true); setError(null); setSanctions(await getAllSanctions()); }
    catch (e) { setError("Failed to load sanctions."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleReindex = async () => {
    setConfirmReindex(false);
    setReindexing(true);
    try {
      const res = await fetch(`${API_V1}/elastic/reindex-local`, {
        method:"POST", headers:{ ...authHeaders(), "Content-Type":"application/json" },
      });
      if (!res.ok) throw new Error(`Reindex failed: ${res.status}`);
      showToast("Reindex completed successfully!");
    } catch (e) { showToast(e.message||"Reindex failed","error"); }
    finally { setReindexing(false); }
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true); setError(null);
      if (selected) {
        await updateSanction(selected.id, data);
        showToast("✓ Record updated successfully");
        setSelected(null); setShowForm(false);
      } else {
        await createSanction(data);
        showToast("✓ Record added successfully");
        setShowForm(false);
      }
      await loadData();
    } catch (e) { setError(e.message||"Failed"); showToast(e.message||"Failed","error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setLoading(true);
      await deleteSanction(confirmDelete.id);
      showToast("✓ Record deleted");
      setViewing(null);
      setConfirmDelete(null);
      await loadData();
    }
    catch (e) { showToast(e.message||"Failed","error"); }
    finally { setLoading(false); }
  };

  const handleEdit       = (s) => { setSelected(s); setShowForm(true); setViewing(null); };
  const handleView       = (s) => setViewing(s);
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) { showToast("Select a file first!","error"); return; }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true); setError(null);
      const res = await fetch(`${API_V1}/local-sanctions/import`, {
        method:"POST", headers:{ Authorization:`Bearer ${getToken()}` }, body:formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const result = await res.json();
      showToast(`✓ ${result.saved} records imported successfully`);
      setFile(null); await loadData();
    } catch (e) { setError(e.message); showToast(e.message,"error"); }
    finally { setLoading(false); }
  };

  const filtered = sanctions.filter(s => {
    const matchSearch = !search ||
      (s.name||"").toLowerCase().includes(search.toLowerCase()) ||
      (s.nationality||"").toLowerCase().includes(search.toLowerCase()) ||
      (s.issuingAuthority||"").toLowerCase().includes(search.toLowerCase()) ||
      (s.motherName||"").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || s.recordType === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  const isEntity = typeFilter === "ENTITY";
  const colSpanCount = isEntity ? 8 : 10;

  // const PERSON_HEADERS = ["#","Name","Type","Mother Name","Nationality","DOB","ID Number","Issuing Authority","Status","Actions"];
  // const ENTITY_HEADERS = ["#","Name","Type","Entity Type","Reg. No.","Issuing Authority","Status","Actions"];

    const TypeBadge = ({ type }) => (
    <span style={{
      padding:"1px 7px", borderRadius:5, fontSize:"0.62rem", fontWeight:700,
      fontFamily:"'JetBrains Mono',monospace", flexShrink:0,
      ...(type==="ENTITY"
        ? {background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)"}
        : {background:"rgba(0,212,255,0.08)", color:"#00d4ff", border:"1px solid rgba(0,212,255,0.15)"})
    }}>
      {type === "ENTITY" ? t.typeEntity : t.typePerson}
    </span>
  );

    const StatusBadge = ({ active }) => (
    <span style={{
      padding:"2px 9px", borderRadius:6, fontSize:"0.7rem", fontWeight:700,
      fontFamily:"'JetBrains Mono',monospace",
      ...(active
        ? {background:"rgba(16,185,129,0.1)", color:"#10b981", border:"1px solid rgba(16,185,129,0.25)"}
        : {background:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"1px solid rgba(239,68,68,0.25)"})
    }}>
      {active ? t.statusActive : t.statusInactive}
    </span>
  );

  const InfoRow = ({ label, value }) => value ? (
    <div style={{display:"flex",gap:8,padding:"8px 0",borderBottom:"1px solid #111c2e"}}>
      <div style={{width:140,flexShrink:0,fontSize:"0.72rem",fontWeight:700,
        color:"#3a5a7a",textTransform:"uppercase",letterSpacing:"0.5px",paddingTop:1}}>{label}</div>
      <div style={{flex:1,fontSize:"0.84rem",color:"#e2e8f0",wordBreak:"break-word"}}>{value}</div>
    </div>
  ) : null;

  const ConfirmModal = ({ icon, iconColor, title, message, confirmLabel, confirmColor, confirmShadow, onConfirm, onCancel, loading: isLoading }) => (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",
      zIndex:999999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} dir={isRtl ? "rtl" : "ltr"}>
      <div style={{background:"#0d1321",border:`1px solid ${iconColor}40`,
        borderRadius:16,width:"100%",maxWidth:400,padding:"28px 24px",
        position:"relative",animation:"modalIn .2s ease"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,
          background:`linear-gradient(90deg,${iconColor},transparent)`,borderRadius:"16px 16px 0 0"}}/>
        <div style={{width:48,height:48,borderRadius:"50%",
          background:`${iconColor}18`,border:`1px solid ${iconColor}40`,
          display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
          {icon}
        </div>
        <div style={{fontSize:"1rem",fontWeight:700,color:"#e2e8f0",marginBottom:8}}>{title}</div>
        <div style={{fontSize:"0.84rem",color:"#7a8fa8",marginBottom:24,lineHeight:1.6}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel}
            style={{padding:"9px 20px",background:"#111c2e",border:"1px solid #1a2d4a",
              borderRadius:9,color:"#94a3b8",fontSize:"0.84rem",fontWeight:600,cursor:"pointer"}}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            style={{padding:"9px 20px",
              background:isLoading?"#1a2d4a":`linear-gradient(135deg,${confirmColor})`,
              border:"none",borderRadius:9,color:isLoading?"#3a5a7a":"#fff",
              fontSize:"0.84rem",fontWeight:700,cursor:isLoading?"not-allowed":"pointer",
              display:"flex",alignItems:"center",gap:6,
              boxShadow:isLoading?"none":confirmShadow}}>
            {isLoading && <span style={{display:"inline-block",width:12,height:12,
              border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",
              borderRadius:"50%",animation:"spin .8s linear infinite"}}/>}
            {isLoading?"Processing...":confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;}
        @keyframes spin   {to{transform:rotate(360deg)}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        .ls-row{cursor:pointer;transition:background .15s;}
        .ls-row:hover{background:rgba(0,212,255,0.05)!important;}
        .pg-btn:hover:not(:disabled){background:rgba(0,212,255,0.12)!important;border-color:rgba(0,212,255,0.4)!important;color:#00d4ff!important;}
        .icon-btn:hover{opacity:1!important;filter:brightness(1.15);transform:scale(1.05);}
        .upload-zone:hover{background:rgba(0,212,255,0.08)!important;border-color:rgba(0,212,255,0.5)!important;}
        .reindex-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
        .tool-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
        .type-tab:hover{color:#00d4ff!important;opacity:.85;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:60px 16px 16px;}
        .modal-box{background:#0d1321;border:1px solid #1a2d4a;border-radius:16px;width:100%;max-width:680px;max-height:85vh;overflow-y:auto;animation:modalIn .25s ease;position:relative;}
        .modal-box::-webkit-scrollbar{width:4px;}
        .modal-box::-webkit-scrollbar-thumb{background:#1a2d4a;border-radius:4px;}
        .ls-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 16px;border-bottom:1px solid #1a2d4a;}
        .ls-search{width:200px;}
        .ls-table-wrap{overflow-x:auto;}
        .ls-table{width:100%;border-collapse:collapse;min-width:750px;}
        .ls-cards{display:none;}
        .ls-pagination{padding:12px 16px;border-top:1px solid #1a2d4a;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        @media(max-width:768px){
          .ls-table-wrap{display:none!important;}
          .ls-cards{display:block!important;}
          .ls-search{width:100%!important;}
          .ls-toolbar{gap:8px!important;}
          .upload-row{flex-direction:column!important;}
          .page-title{font-size:1.2rem!important;}
          .header-count{display:none!important;}
          .modal-overlay{padding:16px;}
          .modal-box{max-height:92vh;}
        }
      `}</style>

      <Layout>
        <div style={{maxWidth:1400,margin:"0 auto",animation:"fadeUp .4s ease"}}>

          {/* Toast */}
          {toast && (
            <div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",
              zIndex:999999,padding:"14px 22px",borderRadius:12,
              animation:"toastIn .3s cubic-bezier(.34,1.56,.64,1)",
              background:toast.type==="error"?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",
              border:`1.5px solid ${toast.type==="error"?"rgba(239,68,68,0.5)":"rgba(16,185,129,0.5)"}`,
              color:toast.type==="error"?"#ef4444":"#10b981",
              fontSize:"0.9rem",fontWeight:700,
              boxShadow:`0 8px 32px ${toast.type==="error"?"rgba(239,68,68,0.25)":"rgba(16,185,129,0.25)"}`,
              display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap"}}>
              {toast.type==="error"
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              }
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22,flexWrap:"wrap"}}>
            <div style={{width:4,height:34,background:"linear-gradient(180deg,#00d4ff,#8b5cf6)",borderRadius:4}} />
            <div style={{flex:1}}>
              <h2 className="page-title" style={{margin:0,fontSize:"1.5rem",fontWeight:700,color:"#e2e8f0"}}>{t.pagetitle}</h2>
              <p style={{margin:0,fontSize:"0.75rem",color:"#7a8fa8",marginTop:2}}>{t.pageSubtitle}</p>
            </div>
            <div className="header-count" style={{display:"flex",alignItems:"center",gap:6,
              background:"rgba(0,212,255,.07)",border:"1px solid rgba(0,212,255,.2)",
              padding:"5px 12px",borderRadius:20,fontSize:"0.7rem",color:"#00d4ff",
              fontFamily:"'JetBrains Mono',monospace"}}>
              {sanctions.length.toLocaleString()} {t.recordsCount}
            </div>
            <button className="tool-btn" onClick={()=>{setSelected(null);setShowForm(true);}} style={{
              padding:"9px 16px",background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",
              border:"none",borderRadius:9,color:"#060912",fontSize:"0.84rem",fontWeight:700,
              cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .2s",
              boxShadow:"0 4px 14px rgba(0,212,255,0.25)"}}>
              <Plus size={14}/> {t.addSanction}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",
              borderRadius:10,padding:"10px 14px",marginBottom:16,color:"#ef4444",fontSize:"0.82rem",
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
              <button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",display:"flex"}}>
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
              <FileSpreadsheet size={14} color="#7a8fa8"/> {t.excelImport}
            </div>
            <div className="upload-row" style={{display:"flex",gap:10,alignItems:"center"}}>
              <label style={{flex:1,cursor:loading?"not-allowed":"pointer"}}>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={loading} style={{display:"none"}}/>
                <div className="upload-zone" style={{padding:"10px 14px",
                  border:"1px dashed rgba(0,212,255,0.3)",borderRadius:9,
                  background:"rgba(0,212,255,0.04)",color:file?"#e2e8f0":"#7a8fa8",
                  fontSize:"0.84rem",transition:"all 0.2s",textAlign:"center",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                  <FileSpreadsheet size={15}/>
                  {file ? file.name : t.chooseExcelFile}
                </div>
              </label>
              <button className="tool-btn" onClick={handleUpload} disabled={loading||!file} style={{
                background:loading||!file?"#1a2d4a":"linear-gradient(135deg,#10b981,#059669)",
                color:loading||!file?"#3a5a7a":"#fff",
                padding:"10px 16px",border:"none",borderRadius:9,fontSize:"0.84rem",fontWeight:600,
                cursor:loading||!file?"not-allowed":"pointer",
                display:"flex",alignItems:"center",gap:6,transition:"all .2s",whiteSpace:"nowrap",
                boxShadow:loading||!file?"none":"0 4px 12px rgba(16,185,129,0.25)"}}>
                <Upload size={14}/>
                {loading ? t.underUpload : t.upload}
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,overflow:"hidden"}}>

            {/* Toolbar */}
            <div className="ls-toolbar">
              {/* marginInlineEnd (was marginRight) — pushes the rest to the inline-end in both directions */}
              <div style={{fontSize:"0.95rem",fontWeight:700,color:"#e2e8f0",marginInlineEnd:"auto"}}>{t.recordsTitle}</div>

              {/* Type Filter */}
              <div style={{display:"flex",gap:3,background:"#111c2e",
                border:"1px solid #1a2d4a",borderRadius:8,padding:3}}>
                {t.typeFilter.map(({val,label})=>(
                  <button key={val} className="type-tab"
                    onClick={()=>{setTypeFilter(val);setPage(1);}}
                    style={{
                      padding:"5px 12px",borderRadius:6,border:"none",
                      fontSize:"0.72rem",fontWeight:700,cursor:"pointer",transition:"all .15s",
                      background: typeFilter===val ? "rgba(0,212,255,0.15)" : "transparent",
                      color:       typeFilter===val ? "#00d4ff"              : "#3a5a7a",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                {/* insetInlineStart (was left) — icon stays on the leading edge in both directions */}
                <Search size={13} color="#3a5a7a" style={{position:"absolute",insetInlineStart:10,pointerEvents:"none"}}/>
                <input value={search} onChange={e=>handleSearch(e.target.value)}
                  placeholder={t.searchPlaceholder} className="ls-search"
                  style={{background:"#111c2e",border:"1px solid #1a2d4a",borderRadius:9,
                    paddingBlock:"7px",paddingInlineStart:"30px",paddingInlineEnd:"12px",
                    color:"#e2e8f0",fontSize:"0.82rem",outline:"none"}}
                  onFocus={e=>e.target.style.borderColor="rgba(0,212,255,.4)"}
                  onBlur={e=>e.target.style.borderColor="#1a2d4a"}/>
              </div>

              <button className="tool-btn" onClick={loadData} disabled={loading} style={{
                padding:"7px 12px",background:"rgba(0,212,255,.07)",
                border:"1px solid rgba(0,212,255,.2)",borderRadius:9,color:"#00d4ff",
                cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,
                fontSize:"0.78rem",transition:"all .2s",opacity:loading?.5:1}}>
                {loading
                  ? <span style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(0,212,255,.3)",borderTop:"2px solid #00d4ff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
                  : <RefreshCw size={13}/>}
              </button>

              <button className="reindex-btn" onClick={()=>setConfirmReindex(true)} disabled={reindexing} style={{
                padding:"7px 12px",
                background:reindexing?"#1a2d4a":"linear-gradient(135deg,rgba(139,92,246,0.15),rgba(0,212,255,0.15))",
                border:`1px solid ${reindexing?"#1a2d4a":"rgba(139,92,246,0.4)"}`,
                borderRadius:9,color:reindexing?"#3a5a7a":"#a78bfa",fontSize:"0.78rem",fontWeight:600,
                cursor:reindexing?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .2s"}}>
                {reindexing
                  ? <span style={{display:"inline-block",width:11,height:11,border:"2px solid rgba(139,92,246,.3)",borderTop:"2px solid #8b5cf6",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
                  : <RotateCcw size={13}/>}
                <span>{t.reindex}</span>
              </button>
            </div>

            {loading && <div style={{height:2,background:"#111c2e",overflow:"hidden"}}>
              <div style={{height:"100%",width:"40%",background:"linear-gradient(90deg,#00d4ff,#8b5cf6)",borderRadius:2}}/>
            </div>}

            {/* Desktop Table */}
            <div className="ls-table-wrap">
              <table className="ls-table">
                <thead>
                  <tr style={{background:"#111c2e"}}>
                    {(isEntity ? t.entity_headers : t.person_headers).map(h=>(
                      /* textAlign:"start" (was "left") — matches the <td>s in both directions */
                      <th key={h} style={{padding:"10px 14px",textAlign:"start",fontSize:"0.62rem",
                        fontWeight:700,color:"#3a5a7a",letterSpacing:"0.8px",
                        borderBottom:"1px solid #1a2d4a",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s,i)=>(
                    <tr key={s.id} className="ls-row" onClick={()=>handleView(s)}
                      style={{borderBottom:"1px solid #111c2e"}}>

                      {/* # */}
                      <td style={{padding:"11px 14px",fontSize:"0.7rem",color:"#3a5a7a",
                        fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                        {(page-1)*PAGE_SIZE+i+1}
                      </td>

                      {/* Name */}
                      <td style={{padding:"11px 14px",maxWidth:200}}>
                        <div style={{fontSize:"0.84rem",fontWeight:600,color:"#e2e8f0",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {s.name||"—"}
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                        <TypeBadge type={s.recordType}/>
                      </td>

                      {/* ENTITY columns */}
                      {isEntity ? (<>
                        <td style={{padding:"11px 14px",fontSize:"0.82rem",color:"#94a3b8",whiteSpace:"nowrap"}}>
                          {s.entityType||"—"}
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.78rem",color:"#94a3b8",
                          fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                          <bdi>{s.commercialRegNo||"—"}</bdi>
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.78rem",color:"#94a3b8",
                          whiteSpace:"nowrap",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis"}}>
                          {s.issuingAuthority||"—"}
                        </td>
                      </>) : (<>
                        {/* PERSON columns */}
                        <td style={{padding:"11px 14px",fontSize:"0.82rem",color:"#94a3b8",whiteSpace:"nowrap"}}>
                          {s.motherName||"—"}
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.82rem",color:"#94a3b8",whiteSpace:"nowrap"}}>
                          {s.nationality||"—"}
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.78rem",color:"#94a3b8",
                          fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                          <bdi>{s.dateOfBirth||"—"}</bdi>
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.78rem",color:"#94a3b8",
                          fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap",maxWidth:140,
                          overflow:"hidden",textOverflow:"ellipsis"}}>
                          <bdi>{s.idNumber||"—"}</bdi>
                        </td>
                        <td style={{padding:"11px 14px",fontSize:"0.78rem",color:"#94a3b8",
                          whiteSpace:"nowrap",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis"}}>
                          {s.issuingAuthority||"—"}
                        </td>
                      </>)}

                      {/* Status */}
                      <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                        <StatusBadge active={s.active}/>
                      </td>

                      {/* Actions */}
                      <td style={{padding:"11px 14px",whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:6}}>
                          <button className="icon-btn" onClick={()=>handleEdit(s)} aria-label={t.edit}
                            style={{padding:"6px 10px",background:"rgba(0,212,255,0.08)",
                              border:"1px solid rgba(0,212,255,0.2)",borderRadius:7,color:"#00d4ff",
                              cursor:"pointer",opacity:.85,display:"flex",alignItems:"center",transition:"all .2s"}}>
                            <Pencil size={13} strokeWidth={2}/>
                          </button>
                          <button className="icon-btn" onClick={()=>setConfirmDelete({id:s.id,name:s.name})} aria-label={t.delete}
                            style={{padding:"6px 10px",background:"rgba(239,68,68,0.08)",
                              border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,color:"#ef4444",
                              cursor:"pointer",opacity:.85,display:"flex",alignItems:"center",transition:"all .2s"}}>
                            <Trash2 size={13} strokeWidth={2}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading&&paginated.length===0&&(
                    <tr><td colSpan={colSpanCount} style={{padding:"40px 20px",textAlign:"center"}}>
                      <div style={{marginBottom:10,opacity:.4}}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7a8fa8" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div style={{fontSize:"0.9rem",fontWeight:600,color:"#4a6a8a"}}>
                        {search ? t.noResults : t.noRecords}
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
                  animation:`fadeUp .3s ease ${i*.04}s both`,cursor:"pointer"}}
                  onClick={()=>handleView(s)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    {/* marginInlineEnd (was marginRight) */}
                    <div style={{flex:1,minWidth:0,marginInlineEnd:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                        <div style={{fontSize:"0.9rem",fontWeight:700,color:"#e2e8f0",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {s.name||"—"}
                        </div>
                        <TypeBadge type={s.recordType}/>
                      </div>
                      {s.recordType==="PERSON" && s.nationality &&
                        <div style={{fontSize:"0.72rem",color:"#7a8fa8"}}>{s.nationality}</div>}
                      {s.recordType==="ENTITY" && s.entityType &&
                        <div style={{fontSize:"0.72rem",color:"#7a8fa8"}}>{s.entityType}</div>}
                      {s.issuingAuthority &&
                        <div style={{fontSize:"0.72rem",color:"#7a8fa8",marginTop:2}}>{s.issuingAuthority}</div>}
                    </div>
                    <StatusBadge active={s.active}/>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:8}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>handleEdit(s)} style={{flex:1,padding:"8px",
                      background:"rgba(0,212,255,0.08)",border:"1px solid rgba(0,212,255,0.2)",
                      borderRadius:8,color:"#00d4ff",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <Pencil size={13}/> {t.edit}
                    </button>
                    <button onClick={()=>setConfirmDelete({id:s.id,name:s.name})} style={{flex:1,padding:"8px",
                      background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",
                      borderRadius:8,color:"#ef4444",fontSize:"0.78rem",fontWeight:600,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <Trash2 size={13}/> {t.delete}
                    </button>
                  </div>
                </div>
              ))}
              {!loading&&paginated.length===0&&(
                <div style={{padding:"40px 20px",textAlign:"center",color:"#4a6a8a"}}>
                  {search ? t.noResults : t.noRecords}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filtered.length>PAGE_SIZE&&(
              <div className="ls-pagination">
                <div style={{fontSize:"0.74rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:"#00d4ff"}}><bdi>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)}</bdi></span>
                  {" "}{t.paginationOf}{" "}<span style={{color:"#00d4ff"}}>{filtered.length}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  {/* PREV — chevron now flips with direction (was hardcoded) */}
                  <button className="pg-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}
                    style={{padding:"6px 11px",background:"#111c2e",border:"1px solid #1a2d4a",
                      borderRadius:8,color:page===1?"#3a5a7a":"#94a3b8",fontSize:"0.78rem",
                      cursor:page===1?"not-allowed":"pointer",display:"flex",alignItems:"center"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points={isRtl ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}/>
                    </svg>
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
                  {/* NEXT — chevron now flips with direction (was hardcoded) */}
                  <button className="pg-btn" onClick={()=>setPage(p=>p+1)} disabled={page===totalPages}
                    style={{padding:"6px 11px",background:"#111c2e",border:"1px solid #1a2d4a",
                      borderRadius:8,color:page===totalPages?"#3a5a7a":"#94a3b8",fontSize:"0.78rem",
                      cursor:page===totalPages?"not-allowed":"pointer",display:"flex",alignItems:"center"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points={isRtl ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}/>
                    </svg>
                  </button>
                </div>
                <div style={{fontSize:"0.7rem",color:"#3a5a7a",fontFamily:"'JetBrains Mono',monospace"}}>
                  <bdi>{page}/{totalPages}</bdi>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Modal */}
        {viewing && (
          <div className="modal-overlay" onClick={()=>setViewing(null)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,
                background:viewing.recordType==="ENTITY"
                  ?"linear-gradient(90deg,#f59e0b,#f97316,transparent)"
                  :"linear-gradient(90deg,#00d4ff,#8b5cf6,transparent)",opacity:.8}}/>
              <div style={{padding:"18px 20px",borderBottom:"1px solid #1a2d4a",
                display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                    <h3 style={{margin:0,fontSize:"1.1rem",fontWeight:700,color:"#e2e8f0"}}>{viewing.name}</h3>
                    <TypeBadge type={viewing.recordType}/>
                    <StatusBadge active={viewing.active}/>
                  </div>
                  {viewing.translatedName && viewing.translatedName !== viewing.name &&
                    <div style={{fontSize:"0.78rem",color:"#7a8fa8"}}>{viewing.translatedName}</div>}
                </div>
                <button onClick={()=>setViewing(null)} aria-label={t.cancel}
                  style={{background:"rgba(239,68,68,0.08)",
                  border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,color:"#ef4444",
                  cursor:"pointer",padding:"6px 8px",display:"flex",alignItems:"center",flexShrink:0}}>
                  <X size={15}/>
                </button>
              </div>
              <div style={{padding:"16px 20px"}}>
                {viewing.recordType==="PERSON" ? (<>
                  <InfoRow label={t.motherName}       value={viewing.motherName}/>
                  <InfoRow label={t.nationality}      value={viewing.nationality}/>
                  <InfoRow label={t.dateOfBirth}      value={viewing.dateOfBirth}/>
                  <InfoRow label={t.idNumber}         value={viewing.idNumber}/>
                  <InfoRow label={t.issuingAuthority} value={viewing.issuingAuthority}/>
                  <InfoRow label={t.additionalInfo}   value={viewing.additionalInfo}/>
                  <InfoRow label={t.aliases}          value={viewing.aliases}/>
                </>) : (<>
                  <InfoRow label={t.entityType}       value={viewing.entityType}/>
                  <InfoRow label={t.commercialRegNo}  value={viewing.commercialRegNo}/>
                  <InfoRow label={t.issuingAuthority} value={viewing.issuingAuthority}/>
                </>)}
                <InfoRow label={t.note}      value={viewing.note}/>
                <InfoRow label={t.createdAt} value={viewing.createdAt?.replace("T"," ").slice(0,19)}/>
              </div>
              <div style={{padding:"14px 20px",borderTop:"1px solid #1a2d4a",
                display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button onClick={()=>handleEdit(viewing)}
                  style={{padding:"9px 18px",background:"rgba(0,212,255,0.1)",
                    border:"1px solid rgba(0,212,255,0.3)",borderRadius:9,color:"#00d4ff",
                    fontSize:"0.84rem",fontWeight:600,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:6}}>
                  <Pencil size={13}/> {t.edit}
                </button>
                <button onClick={()=>setConfirmDelete({id:viewing.id,name:viewing.name})}
                  style={{padding:"9px 18px",background:"rgba(239,68,68,0.1)",
                    border:"1px solid rgba(239,68,68,0.3)",borderRadius:9,color:"#ef4444",
                    fontSize:"0.84rem",fontWeight:600,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:6}}>
                  <Trash2 size={13}/> {t.delete}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={()=>{setShowForm(false);setSelected(null);}}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,
                background:selected
                  ?"linear-gradient(90deg,#f59e0b,#f97316,transparent)"
                  :"linear-gradient(90deg,#8b5cf6,#00d4ff,transparent)",opacity:.7}}/>
              <div style={{padding:"18px 20px",borderBottom:"1px solid #1a2d4a",
                display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:"0.8rem",fontWeight:700,color:"#7a8fa8",
                    textTransform:"uppercase",letterSpacing:"0.6px",
                    display:"flex",alignItems:"center",gap:6}}>
                    {selected
                      ? <><Pencil size={13}/> {t.editSanction}</>
                      : <><Plus size={13}/> {t.addNewSanction}</>}
                  </span>
                  {/* Reuses TypeBadge instead of duplicating its ternary + inline styles */}
                  {selected && <TypeBadge type={selected.recordType}/>}
                </div>
                <button onClick={()=>{setShowForm(false);setSelected(null);}} aria-label={t.cancel}
                  style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",
                    borderRadius:7,color:"#ef4444",cursor:"pointer",padding:"6px 8px",
                    display:"flex",alignItems:"center"}}>
                  <X size={15}/>
                </button>
              </div>
              <div style={{padding:"20px"}}>
                <LocalSanctionForm onSubmit={handleSubmit} selected={selected}
                  onCancel={()=>{setShowForm(false);setSelected(null);}} disabled={loading}/>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete */}
        {confirmDelete && (
          <ConfirmModal
            icon={<Trash2 size={20} color="#ef4444"/>}
            iconColor="#ef4444"
            title={t.deleteRecordTitle}
            message={<>{t.confirmDelete}{" "}<span style={{color:"#e2e8f0",fontWeight:600}} dir={isRtl ? "rtl" : "ltr"}>"{confirmDelete.name}"</span>{t.confirmQuestion}{" "}{t.noRollback}</>}
            confirmLabel={t.delete}
            confirmColor="#ef4444,#dc2626"
            confirmShadow="0 4px 14px rgba(239,68,68,0.3)"
            onConfirm={handleDelete}
            onCancel={()=>setConfirmDelete(null)}
            loading={loading}
          />
        )}

        {/* Confirm Reindex */}
        {confirmReindex && (
          <ConfirmModal
            icon={<RotateCcw size={20} color="#8b5cf6"/>}
            iconColor="#8b5cf6"
            title={t.reindexTitle}
            message={<span dir={isRtl ? "rtl" : "ltr"}>{t.reindexMessage}</span>}
            confirmLabel={t.reindex}
            confirmColor="#8b5cf6,#6d28d9"
            confirmShadow="0 4px 14px rgba(139,92,246,0.3)"
            onConfirm={handleReindex}
            onCancel={()=>setConfirmReindex(false)}
            loading={reindexing}
          />
        )}

      </Layout>

    </>
  );
};

export default LocalSanctionsPage;