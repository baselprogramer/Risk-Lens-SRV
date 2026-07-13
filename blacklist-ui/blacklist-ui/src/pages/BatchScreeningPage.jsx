import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import {
  uploadBatch, getBatchJob, getBatchResults, getBatchHistory
} from "../services/batchScreeningService";
import { API_V1 } from "../config/api";
import { getToken } from "../services/authService";
import {
  Upload, FileSpreadsheet, RefreshCw, ShieldCheck, ShieldAlert,
  CheckCircle2, XCircle, Loader2, ListChecks, Download
} from "lucide-react";
import { authHeaders } from "../services/authService";
import { useLang } from "../context/LangContext";
import { staticContent } from "../locales/content";


const POLL_MS = 3000;

// مستوى الخطر → لون badge
const RISK_STYLE = {
  CRITICAL: { bg: "rgba(239,68,68,0.12)",  fg: "#ef4444", bd: "rgba(239,68,68,0.3)",  label: "حرج" },
  HIGH:     { bg: "rgba(245,158,11,0.12)", fg: "#f59e0b", bd: "rgba(245,158,11,0.3)", label: "عالٍ" },
  MEDIUM:   { bg: "rgba(0,212,255,0.1)",   fg: "#00d4ff", bd: "rgba(0,212,255,0.25)", label: "متوسط" },
  LOW:      { bg: "rgba(139,92,246,0.1)",  fg: "#8b5cf6", bd: "rgba(139,92,246,0.25)",label: "منخفض" },
  VERY_LOW: { bg: "rgba(16,185,129,0.1)",  fg: "#10b981", bd: "rgba(16,185,129,0.25)",label: "سليم" },
};

const BatchScreeningPage = () => {
  const [file,     setFile]     = useState(null);
  const [job,      setJob]      = useState(null);      // { jobId, status, progressPercent, ... }
  const [results,  setResults]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [downloading, setDownloading] = useState(false);
  const pollRef = useRef(null);

  const { lang } = useLang();
  const t = staticContent.batchScrenning[lang];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadHistory = async () => {
    try { setHistory(await getBatchHistory()); } catch { /* غير حرِج */ }
  };

  useEffect(() => {
    loadHistory();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (jobId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const j = await getBatchJob(jobId);
        setJob(j);
        if (j.status === "COMPLETED" || j.status === "FAILED") {
          stopPolling();
          setLoading(false);
          if (j.status === "COMPLETED") {
            setResults(await getBatchResults(jobId));
            showToast(`✓ اكتمل الفحص — ${j.matchedRecords} مطابقة من ${j.totalRecords}`);
          } else {
            setError(j.errorMessage || "فشل الفحص الجماعي");
            showToast("فشل الفحص الجماعي", "error");
          }
          loadHistory();
        }
      } catch (e) {
        stopPolling();
        setLoading(false);
        setError(e.message || "فشل متابعة حالة الفحص");
      }
    }, POLL_MS);
  };

  const handleUpload = async () => {
    if (!file) { showToast("اختر ملفاً أولاً!", "error"); return; }
    try {
      setLoading(true); setError(null); setResults([]); setJob(null);
      const created = await uploadBatch(file);   // { jobId, status, totalRecords, ... }
      setJob(created);
      showToast(`✓ بدأ الفحص — ${created.totalRecords} اسم`);
      startPolling(created.jobId);
    } catch (e) {
      setLoading(false);
      setError(e.message);
      showToast(e.message, "error");
    }
  };

  const openJob = async (jobId) => {
    try {
      setLoading(true); setError(null); setResults([]);
      const j = await getBatchJob(jobId);
      setJob(j);
      if (j.status === "COMPLETED") {
        setResults(await getBatchResults(jobId));
        setLoading(false);
      } else if (j.status === "PROCESSING" || j.status === "PENDING") {
        startPolling(jobId);
      } else {
        setLoading(false);
        if (j.status === "FAILED") setError(j.errorMessage || "هذا الفحص فشل");
      }
    } catch (e) { setLoading(false); setError(e.message); }
  };

const downloadReport = async () => {
  if (!job) return;
  try {
    setDownloading(true);
    const res = await fetch(`${API_V1}/batch-screening/${job.jobId}/report`, {
      headers: authHeaders(),      // ← نفس اللي بيشتغل بباقي الطلبات
    });
    if (!res.ok) {
      console.log("REPORT FAIL", res.status, await res.text());
      throw new Error(`فشل التنزيل (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `batch-report-${job.jobId}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    showToast(e.message, "error");
  } finally {
    setDownloading(false);
  }
};

  const isRunning = job && (job.status === "PENDING" || job.status === "PROCESSING");
  const matchedRows = results.filter(r => r.match).length;
  const errorRows   = results.filter(r => r.rowError).length;

  const RiskBadge = ({ level }) => {
    const s = RISK_STYLE[level] || RISK_STYLE.VERY_LOW;
    return (
      <span style={{
        padding: "2px 9px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
        fontFamily: "'JetBrains Mono',monospace",
        background: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
      }}>{s.label}</span>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;}
        @keyframes spin   {to{transform:rotate(360deg)}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes barflow{0%{background-position:0 0}100%{background-position:40px 0}}
        .bs-row:hover{background:rgba(0,212,255,0.05)!important;}
        .upload-zone:hover{background:rgba(0,212,255,0.08)!important;border-color:rgba(0,212,255,0.5)!important;}
        .tool-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
        .bs-table-wrap{overflow-x:auto;}
        .bs-table{width:100%;border-collapse:collapse;min-width:820px;}
        @media(max-width:768px){
          .upload-row{flex-direction:column!important;}
          .page-title{font-size:1.2rem!important;}
          .bs-history{display:none!important;}
        }
      `}</style>

      <Layout>
        <div style={{ maxWidth: 1400, margin: "0 auto", animation: "fadeUp .4s ease" }} dir="rtl">

          {/* Toast */}
          {toast && (
            <div style={{
              position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
              zIndex: 999999, padding: "14px 22px", borderRadius: 12,
              animation: "toastIn .3s cubic-bezier(.34,1.56,.64,1)",
              background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              border: `1.5px solid ${toast.type === "error" ? "rgba(239,68,68,0.5)" : "rgba(16,185,129,0.5)"}`,
              color: toast.type === "error" ? "#ef4444" : "#10b981",
              fontSize: "0.9rem", fontWeight: 700, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 10,
            }}>{toast.msg}</div>
          )}

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <div style={{ width: 4, height: 34, background: "linear-gradient(180deg,#00d4ff,#8b5cf6)", borderRadius: 4 }} />
            <div style={{ flex: 1 }}>
              <h2 className="page-title" style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#e2e8f0" }}>{t.pageTitle}</h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#7a8fa8", marginTop: 2 }}>{t.pageSubtitle}</p>
            </div>
            <button className="tool-btn" onClick={loadHistory} disabled={loading} style={{
              padding: "7px 12px", background: "rgba(0,212,255,.07)", border: "1px solid rgba(0,212,255,.2)",
              borderRadius: 9, color: "#00d4ff", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", opacity: loading ? .5 : 1 }}>
              <RefreshCw size={13} /> {t.refresh}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#ef4444",
              fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 7 }}>
              <XCircle size={14} /> {error}
            </div>
          )}

          {/* Upload */}
          <div style={{
            background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14,
            padding: "16px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg,#00d4ff,#8b5cf6,transparent)", opacity: .6 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.75rem", fontWeight: 700,
              color: "#7a8fa8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              <FileSpreadsheet size={14} color="#7a8fa8" /> {t.excelUpload}
            </div>
            <div className="upload-row" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ flex: 1, cursor: isRunning ? "not-allowed" : "pointer" }}>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={isRunning} style={{ display: "none" }} />
                <div className="upload-zone" style={{
                  padding: "10px 14px", border: "1px dashed rgba(0,212,255,0.3)", borderRadius: 9,
                  background: "rgba(0,212,255,0.04)", color: file ? "#e2e8f0" : "#7a8fa8",
                  fontSize: "0.84rem", textAlign: "center",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <FileSpreadsheet size={15} />
                  {file ? file.name : t.excelFileName}
                </div>
              </label>
              <button className="tool-btn" onClick={handleUpload} disabled={isRunning || !file} style={{
                background: isRunning || !file ? "#1a2d4a" : "linear-gradient(135deg,#10b981,#059669)",
                color: isRunning || !file ? "#3a5a7a" : "#fff",
                padding: "10px 16px", border: "none", borderRadius: 9, fontSize: "0.84rem", fontWeight: 600,
                cursor: isRunning || !file ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <Upload size={14} /> {isRunning ? t.running : t.start}
              </button>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#3a5a7a", marginTop: 8 }}>
                {t.supportedColumns}
            </div>
          </div>

          {/* Progress */}
          {job && (
            <div style={{
              background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14,
              padding: "16px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isRunning
                    ? <Loader2 size={16} color="#00d4ff" style={{ animation: "spin 1s linear infinite" }} />
                    : job.status === "COMPLETED"
                      ? <CheckCircle2 size={16} color="#10b981" />
                      : <XCircle size={16} color="#ef4444" />}
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0" }}>
                    {job.fileName || `فحص #${job.jobId}`}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#7a8fa8", fontFamily: "'JetBrains Mono',monospace" }}>
                    {job.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#7a8fa8", fontFamily: "'JetBrains Mono',monospace" }}>
                  {job.processedRecords}/{job.totalRecords} · {job.progressPercent}%
                </div>
              </div>
              <div style={{ height: 8, background: "#111c2e", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${job.progressPercent || 0}%`,
                  backgroundColor: job.status === "FAILED" ? "#ef4444" : "transparent",
                  backgroundImage: job.status === "FAILED"
                  ? "none"
                  : "repeating-linear-gradient(45deg,#00d4ff,#00d4ff 10px,#8b5cf6 10px,#8b5cf6 20px)",
                  backgroundSize: "40px 40px",
                  animation: isRunning ? "barflow 1s linear infinite" : "none",
                  borderRadius: 6, transition: "width .4s ease" }} />
              </div>
              {job.status === "COMPLETED" && (
                <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "#10b981" }}>✓ {matchedRows} مطابقة</span>
                  <span style={{ fontSize: "0.78rem", color: "#7a8fa8" }}>{job.totalRecords - matchedRows} سليم</span>
                  {errorRows > 0 && <span style={{ fontSize: "0.78rem", color: "#f59e0b" }}>⚠ {errorRows} سطر فيه خطأ</span>}
                  <button className="tool-btn" onClick={downloadReport} disabled={downloading} style={{
                    marginRight: "auto",
                    padding: "8px 14px", background: downloading ? "#1a2d4a" : "linear-gradient(135deg,#10b981,#059669)",
                    color: downloading ? "#3a5a7a" : "#fff", border: "none", borderRadius: 8,
                    fontSize: "0.8rem", fontWeight: 700, cursor: downloading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 6 }}>
                    {downloading
                      ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      : <Download size={14} />}
                    {downloading ? t.downloading : t.download}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div style={{ background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a2d4a", display: "flex", alignItems: "center", gap: 8 }}>
                <ListChecks size={15} color="#00d4ff" />
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e2e8f0" }}>{t.scanningResults}</span>
              </div>
              <div className="bs-table-wrap">
                <table className="bs-table">
                  <thead>
                    <tr style={{ background: "#111c2e" }}>
                      {t.tableHeader.map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "right", fontSize: "0.62rem", fontWeight: 700,
                          color: "#3a5a7a", letterSpacing: "0.8px", borderBottom: "1px solid #1a2d4a",
                          textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.id || i} className="bs-row" style={{
                        borderBottom: "1px solid #111c2e",
                        background: r.rowError ? "rgba(245,158,11,0.05)" : "transparent" }}>
                        <td style={{ padding: "11px 14px", fontSize: "0.7rem", color: "#3a5a7a", fontFamily: "'JetBrains Mono',monospace" }}>
                          {r.rowNumber || i + 1}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: "0.84rem", fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap" }}>
                          {r.inputName || "—"}
                        </td>
                        <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                          {r.rowError
                            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#f59e0b", fontSize: "0.76rem", fontWeight: 700 }}>
                                <ShieldAlert size={13} /> {t.error}
                              </span>
                            : r.match
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#ef4444", fontSize: "0.76rem", fontWeight: 700 }}>
                                  <ShieldAlert size={13} /> {t.trueMatch}
                                </span>
                              : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#10b981", fontSize: "0.76rem", fontWeight: 700 }}>
                                  <ShieldCheck size={13} /> {t.negative}
                                </span>}
                        </td>
                        <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                          {r.rowError ? "—" : <RiskBadge level={r.riskLevel} />}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: "0.82rem", color: "#94a3b8", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.matchedName || "—"}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: "0.76rem", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
                          {r.matchedSource || "—"}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: "0.78rem", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>
                          {r.bestScore != null ? `${r.bestScore.toFixed(1)}%` : "—"}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: "0.76rem", color: "#7a8fa8", whiteSpace: "nowrap" }}>
                          {r.confirmingFactor || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bs-history" style={{ background: "#0d1321", border: "1px solid #1a2d4a", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a2d4a", fontSize: "0.95rem", fontWeight: 700, color: "#e2e8f0" }}>
                عمليات سابقة
              </div>
              <div className="bs-table-wrap">
                <table className="bs-table">
                  <thead>
                    <tr style={{ background: "#111c2e" }}>
                      {t.row.map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "right", fontSize: "0.62rem", fontWeight: 700,
                          color: "#3a5a7a", letterSpacing: "0.8px", borderBottom: "1px solid #1a2d4a",
                          textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.jobId} className="bs-row" onClick={() => openJob(h.jobId)}
                        style={{ borderBottom: "1px solid #111c2e", cursor: "pointer" }}>
                        <td style={{ padding: "11px 14px", fontSize: "0.7rem", color: "#3a5a7a", fontFamily: "'JetBrains Mono',monospace" }}>{h.jobId}</td>
                        <td style={{ padding: "11px 14px", fontSize: "0.82rem", color: "#e2e8f0", whiteSpace: "nowrap", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{h.fileName || "—"}</td>
                        <td style={{ padding: "11px 14px", fontSize: "0.76rem", color: "#7a8fa8", fontFamily: "'JetBrains Mono',monospace" }}>{h.status}</td>
                        <td style={{ padding: "11px 14px", fontSize: "0.78rem", color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{h.totalRecords}</td>
                        <td style={{ padding: "11px 14px", fontSize: "0.78rem", color: "#00d4ff", fontFamily: "'JetBrains Mono',monospace" }}>{h.matchedRecords}</td>
                        <td style={{ padding: "11px 14px", fontSize: "0.74rem", color: "#7a8fa8", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
                          {h.createdAt ? String(h.createdAt).replace("T", " ").slice(0, 16) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </Layout>
    </>
  );
};

export default BatchScreeningPage;