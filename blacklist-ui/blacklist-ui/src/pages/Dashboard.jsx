import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getDashboardData } from "../services/screeningService";
import { API_V1 } from "../config/api";
import {
  LayoutDashboard, Bell, Scale,
  Search, ShieldAlert, AlertTriangle, CheckCircle, Zap,
  TrendingUp, Globe, Clock, Activity,
  XCircle, Eye, FileText, ChevronRight,
  BarChart2, RefreshCw, Shield
} from "lucide-react";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
});

const RISK_META = {
  CRITICAL: { color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.25)",   label:"Critical" },
  HIGH:     { color:"#f97316", bg:"rgba(249,115,22,0.1)",  border:"rgba(249,115,22,0.25)",  label:"High"     },
  MEDIUM:   { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.25)",  label:"Medium"   },
  LOW:      { color:"#60a5fa", bg:"rgba(96,165,250,0.1)",  border:"rgba(96,165,250,0.25)",  label:"Low"      },
  VERY_LOW: { color:"#10b981", bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.25)",  label:"Very Low" },
};
const riskMeta = (r) => RISK_META[(r||"").toUpperCase()] || RISK_META.VERY_LOW;

const TABS = [
  { id:"overview",   label:"Overview",   icon:LayoutDashboard },
  { id:"monitoring", label:"Monitoring", icon:Bell            },
  { id:"decisions",  label:"Decisions",  icon:Scale           },
];

const DECISION_CFG = {
  TRUE_MATCH:     { color:"#ef4444", bg:"rgba(239,68,68,0.12)",  icon:<XCircle size={11}/>,      label:"True Match"     },
  FALSE_POSITIVE: { color:"#10b981", bg:"rgba(16,185,129,0.12)", icon:<CheckCircle size={11}/>,  label:"False Positive" },
  PENDING_REVIEW: { color:"#f59e0b", bg:"rgba(245,158,11,0.12)", icon:<Clock size={11}/>,         label:"Pending Review" },
  RISK_ACCEPTED:  { color:"#00d4ff", bg:"rgba(0,212,255,0.12)",  icon:<AlertTriangle size={11}/>, label:"Risk Accepted"  },
};

export default function Dashboard() {
  const [stats,          setStats]          = useState({});
  const [rateLimit,      setRateLimit]      = useState(null);
  const [monthlyData,    setMonthlyData]    = useState([]);
  const [topCountries,   setTopCountries]   = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeTab,      setActiveTab]      = useState("overview");
  const [decStats,       setDecStats]       = useState(null);
  const [caseStats,      setCaseStats]      = useState(null);
  const [auditTrail,     setAuditTrail]     = useState([]);
  const [loadingAudit,   setLoadingAudit]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await getDashboardData();
        setStats(d.stats || {});
        setRateLimit(d.rateLimit || null);
        setMonthlyData(d.monthlyData || []);
        setTopCountries(d.topCountries || []);
        setRecentActivity(d.recentActivity || []);
      } catch(e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (activeTab !== "decisions" && activeTab !== "monitoring") return;
    (async () => {
      try {
        const cRes = await fetch(`${API_V1}/cases/stats`, { headers: authHeaders() });
        if (cRes.ok) setCaseStats(await cRes.json());
      } catch(e) { console.error(e); }
    })();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "decisions") return;
    (async () => {
      try {
        const dRes = await fetch(`${API_V1}/decisions/stats`, { headers: authHeaders() });
        if (dRes.ok) setDecStats(await dRes.json());
      } catch(e) { console.error(e); }
    })();
  }, [activeTab]);

  const fetchAuditTrail = async () => {
    setLoadingAudit(true);
    try {
      const r = await fetch(`${API_V1}/decisions/all?page=0&size=10`, { headers: authHeaders() });
      if (r.ok) {
        const d = await r.json();
        setAuditTrail(Array.isArray(d) ? d : (d.content || []));
      }
    } catch(e) { console.error(e); }
    finally { setLoadingAudit(false); }
  };

  useEffect(() => {
    if (activeTab === "decisions") fetchAuditTrail();
  }, [activeTab]);

  const maxBar = Math.max(...monthlyData.map(d => d.searches||0), 1);
  const total  = stats.totalSearches || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,.35)}50%{box-shadow:0 0 0 7px rgba(0,212,255,0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .d-card{animation:fadeUp .4s ease both;}
        .stat-card:hover{transform:translateY(-4px)!important;box-shadow:0 16px 40px rgba(0,0,0,.5)!important;}
        .row-hover:hover{background:rgba(0,212,255,.04)!important;}
        .tab-btn{background:transparent;border:1px solid transparent;cursor:pointer;transition:all .2s;font-family:'IBM Plex Sans',sans-serif;}
        .tab-btn:hover{color:#00d4ff!important;border-color:rgba(0,212,255,.2)!important;}
        .tab-btn.active{background:rgba(0,212,255,.1)!important;color:#00d4ff!important;border-color:rgba(0,212,255,.35)!important;}
        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;}
        .chart-grid{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:18px;}
        .case-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;}
        .decision-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .tabs-wrap{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap;}
        .activity-table{width:100%;border-collapse:collapse;min-width:500px;}
        @media(max-width:768px){
          .stat-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
          .chart-grid{grid-template-columns:1fr!important;}
          .decision-grid{grid-template-columns:1fr!important;}
          .tabs-wrap{gap:4px!important;}
          .tab-btn{padding:7px 10px!important;font-size:0.78rem!important;}
          .page-title{font-size:1.3rem!important;}
          .activity-wrap{overflow-x:auto;}
          .stat-val{font-size:1.5rem!important;}
        }
        @media(max-width:480px){
          .stat-grid{grid-template-columns:1fr 1fr!important;}
          .case-grid{grid-template-columns:repeat(3,1fr)!important;}
        }
      `}</style>

      <Layout>
        <div style={{background:"#060912",minHeight:"100%",padding:"16px",borderRadius:"14px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"14px",pointerEvents:"none",
            backgroundImage:"linear-gradient(rgba(0,212,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.018) 1px,transparent 1px)",
            backgroundSize:"50px 50px"}} />

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:4,height:34,background:"linear-gradient(180deg,#00d4ff,#8b5cf6)",borderRadius:4}} />
              <div>
                <h2 className="page-title" style={{margin:0,fontSize:"1.55rem",fontWeight:700,color:"#e2e8f0",letterSpacing:"-0.3px"}}>Dashboard</h2>
                <p style={{margin:0,fontSize:"0.75rem",color:"#7a8fa8",marginTop:2}}>Risk &amp; Compliance Overview</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,background:"rgba(0,212,255,.07)",
              border:"1px solid rgba(0,212,255,.2)",padding:"6px 12px",borderRadius:20,
              fontSize:"0.7rem",color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace"}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#00d4ff",display:"inline-block",animation:"pulse 2s infinite"}} />
              LIVE
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-wrap" style={{position:"relative",zIndex:1}}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`tab-btn${activeTab===t.id?" active":""}`}
                  onClick={() => setActiveTab(t.id)}
                  style={{padding:"8px 16px",borderRadius:9,fontSize:"0.84rem",fontWeight:600,
                    color:activeTab===t.id?"#00d4ff":"#7a8fa8",
                    display:"flex",alignItems:"center",gap:6}}>
                  <Icon size={14}/>{t.label}
                </button>
              );
            })}
          </div>

          {/* ══════════════════ OVERVIEW ══════════════════ */}
          {activeTab==="overview" && (
            <div style={{position:"relative",zIndex:1}}>
              <div className="stat-grid">
                {[
                  {title:"Total Searches",   value:stats.totalSearches  ??0, sub:`+${stats.todaySearches||0} today`,   Icon:Search,       color:"#00d4ff", delay:"0s"   },
                  {title:"Positive Matches", value:stats.positiveMatches??0, sub:`${total?((stats.positiveMatches/total)*100).toFixed(1):0}% rate`, Icon:ShieldAlert, color:"#8b5cf6", delay:".05s"},
                  {title:"Critical",         value:stats.criticalRisk   ??0, sub:"Immediate action",   Icon:XCircle,      color:"#ef4444", delay:".1s"  },
                  {title:"High Risk",        value:stats.highRisk       ??0, sub:"Requires review",    Icon:AlertTriangle,color:"#f97316", delay:".15s" },
                  {title:"Medium Risk",      value:stats.mediumRisk     ??0, sub:"Under monitoring",   Icon:Zap,          color:"#f59e0b", delay:".2s"  },
                  {title:"Low / Clear",      value:stats.lowRisk        ??0, sub:"Approved",           Icon:CheckCircle,  color:"#10b981", delay:".25s" },
                ].map((c,i) => <StatCard key={i} {...c} />)}
              </div>

              {/* Rate Limit Widget */}
              {rateLimit && (
                <div className="d-card" style={{background:"#0d1321",border:`1px solid ${rateLimit.usagePercent>=90?"rgba(239,68,68,0.4)":rateLimit.usagePercent>=70?"rgba(245,158,11,0.3)":"#1a2d4a"}`,borderRadius:14,padding:"14px 18px",marginBottom:16,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:rateLimit.usagePercent>=90?"#ef4444":rateLimit.usagePercent>=70?"#f59e0b":"#00d4ff",opacity:.7}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <Activity size={13} color={rateLimit.usagePercent>=90?"#ef4444":rateLimit.usagePercent>=70?"#f59e0b":"#00d4ff"}/>
                      <span style={{fontSize:"0.75rem",fontWeight:700,color:"#e2e8f0"}}>API Usage Today</span>
                      <span style={{fontSize:"0.68rem",padding:"1px 8px",borderRadius:5,background:"rgba(139,92,246,0.15)",color:"#a78bfa",border:"1px solid rgba(139,92,246,0.3)",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{rateLimit.plan}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:"0.72rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>
                        Resets: {new Date(rateLimit.resetAt).toLocaleDateString()}
                      </span>
                      <span style={{fontSize:"0.9rem",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:rateLimit.usagePercent>=90?"#ef4444":rateLimit.usagePercent>=70?"#f59e0b":"#e2e8f0"}}>
                        {rateLimit.usedToday.toLocaleString()} <span style={{fontSize:"0.7rem",color:"#7a8fa8"}}>/ {rateLimit.dailyLimit.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                  <div style={{height:8,background:"#111c2e",borderRadius:6,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",borderRadius:6,width:`${Math.min(rateLimit.usagePercent,100)}%`,
                      background:rateLimit.usagePercent>=90?"linear-gradient(90deg,#ef4444,#dc2626)":rateLimit.usagePercent>=70?"linear-gradient(90deg,#f59e0b,#d97706)":"linear-gradient(90deg,#00d4ff,#8b5cf6)",
                      transition:"width 1s ease"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.69rem",color:"#7a8fa8"}}>
                    <span>{rateLimit.usagePercent}% used</span>
                    <span style={{color:rateLimit.remaining===0?"#ef4444":rateLimit.remaining<50?"#f59e0b":"#10b981",fontWeight:600}}>
                      {rateLimit.remaining.toLocaleString()} remaining
                    </span>
                  </div>
                  {rateLimit.usagePercent >= 90 && (
                    <div style={{marginTop:8,padding:"7px 10px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,fontSize:"0.72rem",color:"#ef4444",display:"flex",alignItems:"center",gap:5}}>
                      <AlertTriangle size={11}/> Approaching daily limit — contact your administrator to upgrade
                    </div>
                  )}
                </div>
              )}

              {/* Risk Distribution Bar */}
              <div className="d-card" style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,padding:"14px 18px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:7,fontSize:"0.72rem",color:"#7a8fa8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>
                  <BarChart2 size={13}/> Risk Distribution
                </div>
                <div style={{display:"flex",height:10,borderRadius:6,overflow:"hidden",gap:2}}>
                  {[{color:"#ef4444",val:stats.criticalRisk||0},{color:"#f97316",val:stats.highRisk||0},
                    {color:"#f59e0b",val:stats.mediumRisk||0},{color:"#60a5fa",val:stats.lowRisk||0},
                    {color:"#10b981",val:total-(stats.positiveMatches||0)}
                  ].map((s,i) => {
                    const pct = total>0?Math.max((s.val/total)*100,s.val>0?2:0):0;
                    return <div key={i} style={{width:`${pct}%`,background:s.color}} />;
                  })}
                </div>
                <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                  {[{label:"Critical",color:"#ef4444",val:stats.criticalRisk||0},
                    {label:"High",color:"#f97316",val:stats.highRisk||0},
                    {label:"Medium",color:"#f59e0b",val:stats.mediumRisk||0},
                    {label:"Low",color:"#60a5fa",val:stats.lowRisk||0},
                    {label:"Clear",color:"#10b981",val:total-(stats.positiveMatches||0)},
                  ].map((s,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:8,height:8,borderRadius:2,background:s.color}} />
                      <span style={{fontSize:"0.7rem",color:"#7a8fa8"}}>{s.label}</span>
                      <span style={{fontSize:"0.7rem",color:s.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="chart-grid">
                <div className="d-card" style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,padding:"18px 20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                    <div style={{fontSize:"0.95rem",fontWeight:700,color:"#e2e8f0",display:"flex",alignItems:"center",gap:7}}>
                      <TrendingUp size={15} color="#00d4ff"/> Monthly Trends
                      <span style={{fontSize:"0.65rem",color:"#3a5a7a",fontWeight:400}}>last 6 months</span>
                    </div>
                    <div style={{display:"flex",gap:12,fontSize:"0.7rem"}}>
                      {[{c:"#00d4ff",l:"Searches"},{c:"#ef4444",l:"Matches"}].map((x,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:10,height:3,background:x.c,borderRadius:2}} />
                          <span style={{color:"#7a8fa8"}}>{x.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {monthlyData.length === 0 ? (
                    <div style={{height:160,display:"flex",alignItems:"center",justifyContent:"center",color:"#3a5a7a",fontSize:"0.82rem"}}>
                      No data yet
                    </div>
                  ) : (
                    <>
                      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140,paddingBottom:4}}>
                        {monthlyData.map((item,i) => {
                          const searchH = Math.max((item.searches/maxBar)*100,3);
                          const matchH  = Math.max(((item.matches||0)/maxBar)*100,2);
                          return (
                            <div key={i} style={{flex:1,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",gap:3,position:"relative"}}>
                              {/* Tooltip on hover */}
                              <div style={{width:"100%",height:"100%",position:"absolute",display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:2}}>
                                {/* Searches bar */}
                                <div title={`${item.searches} searches`} style={{
                                  width:"48%",height:`${searchH}%`,
                                  background:"linear-gradient(180deg,#00d4ff88,#00d4ff33)",
                                  borderRadius:"3px 3px 0 0",border:"1px solid rgba(0,212,255,0.4)",
                                  borderBottom:"none",cursor:"default",
                                  transition:"opacity .2s"
                                }}/>
                                {/* Matches bar */}
                                <div title={`${item.matches||0} matches`} style={{
                                  width:"48%",height:`${matchH}%`,
                                  background:"linear-gradient(180deg,#ef444488,#ef444433)",
                                  borderRadius:"3px 3px 0 0",border:"1px solid rgba(239,68,68,0.4)",
                                  borderBottom:"none",cursor:"default"
                                }}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* X axis */}
                      <div style={{display:"flex",borderTop:"1px solid #1a2d4a",paddingTop:6,gap:6}}>
                        {monthlyData.map((item,i) => (
                          <div key={i} style={{flex:1,textAlign:"center"}}>
                            <div style={{fontSize:"0.62rem",color:"#3a5a7a",fontWeight:600}}>{item.month}</div>
                            <div style={{fontSize:"0.58rem",color:"#1a2d4a",fontFamily:"'JetBrains Mono',monospace"}}>{item.searches}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="d-card" style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,padding:"18px 20px"}}>
                  <div style={{fontSize:"0.95rem",fontWeight:700,color:"#e2e8f0",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
                    <Globe size={15} color="#00d4ff"/> Top Sources
                  </div>
                  {topCountries.length === 0 ? (
                    <div style={{textAlign:"center",padding:"20px 0",color:"#3a5a7a",fontSize:"0.82rem"}}>No data yet</div>
                  ) : (() => {
                    const maxCount = Math.max(...topCountries.map(x => x.count), 1);
                    return (
                      <div style={{display:"flex",flexDirection:"column",gap:9}}>
                        {topCountries.map((item,i) => {
                          const pct = Math.round((item.count / maxCount) * 100);
                          return (
                            <div key={i}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                                <div style={{display:"flex",alignItems:"center",gap:7}}>
                                  <span style={{fontSize:"0.9rem"}}>{item.flag}</span>
                                  <span style={{fontSize:"0.8rem",fontWeight:600,color:"#e2e8f0"}}>{item.country}</span>
                                </div>
                                <span style={{fontSize:"0.78rem",fontWeight:700,color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace"}}>{item.count}</span>
                              </div>
                              <div style={{height:4,background:"#111c2e",borderRadius:3,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,#00d4ff,#8b5cf6)`,borderRadius:3,transition:"width 1s ease",opacity:.7}}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="d-card" style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"13px 18px",borderBottom:"1px solid #1a2d4a",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{fontSize:"0.95rem",fontWeight:700,color:"#e2e8f0",display:"flex",alignItems:"center",gap:7}}>
                    <Activity size={14} color="#00d4ff"/> Recent Activity
                  </div>
                  <span style={{padding:"4px 10px",background:"rgba(0,212,255,.07)",border:"1px solid rgba(0,212,255,.2)",borderRadius:20,fontSize:"0.68rem",color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace"}}>
                    {recentActivity.length} records
                  </span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table className="activity-table">
                    <thead>
                      <tr style={{background:"#111c2e"}}>
                        {["","NAME","BY","RISK","SOURCE","TIME"].map(h=>(
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:"0.64rem",fontWeight:700,color:"#3a5a7a",letterSpacing:"0.8px",borderBottom:"1px solid #1a2d4a",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map(item => {
                        const m = riskMeta(item.risk);
                        return (
                          <tr key={item.id} className="row-hover" style={{borderBottom:"1px solid #111c2e",transition:"background .15s"}}>
                            <td style={{padding:"10px 14px"}}>
                              <div style={{width:9,height:9,borderRadius:"50%",background:m.color,boxShadow:`0 0 0 3px ${m.bg}`}} />
                            </td>
                            <td style={{padding:"10px 14px",fontSize:"0.84rem",fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap"}}>{item.name}</td>
                            <td style={{padding:"10px 14px"}}>
                              <span style={{fontSize:"0.72rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>{item.createdBy||"—"}</span>
                            </td>
                            <td style={{padding:"10px 14px"}}>
                              <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.69rem",fontWeight:700,background:m.bg,color:m.color,border:`1px solid ${m.border}`,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{m.label}</span>
                            </td>
                            <td style={{padding:"10px 14px"}}>
                              <span style={{padding:"2px 8px",borderRadius:5,fontSize:"0.67rem",fontWeight:600,background:"rgba(0,212,255,.07)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.15)",fontFamily:"'JetBrains Mono',monospace"}}>
                                {item.source||"—"}
                              </span>
                            </td>
                            <td style={{padding:"10px 14px",fontSize:"0.72rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{item.time}</td>
                          </tr>
                        );
                      })}
                      {recentActivity.length===0 && (
                        <tr><td colSpan={6} style={{padding:36,textAlign:"center",color:"#3a5a7a",fontSize:"0.84rem"}}>No recent activity</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ MONITORING ══════════════════ */}
          {activeTab==="monitoring" && (
            <div style={{position:"relative",zIndex:1}}>
              {/* Stats */}
              <div className="stat-grid">
                {[
                  {title:"Open Cases",  value:caseStats?.open      ?? "—", Icon:Eye,          color:"#00d4ff", delay:"0s"   },
                  {title:"Escalated",   value:caseStats?.escalated ?? "—", Icon:AlertTriangle, color:"#ef4444", delay:".06s" },
                  {title:"In Review",   value:caseStats?.inReview  ?? "—", Icon:Search,        color:"#f59e0b", delay:".12s" },
                  {title:"Closed",      value:caseStats?.closed    ?? "—", Icon:CheckCircle,   color:"#10b981", delay:".18s" },
                  {title:"Critical",    value:caseStats?.critical  ?? "—", Icon:XCircle,       color:"#ef4444", delay:".24s" },
                  {title:"Overdue",     value:caseStats?.overdue   ?? "—", Icon:Clock,         color:"#f97316", delay:".30s" },
                ].map((s,i) => <StatCard key={i} {...s} />)}
              </div>

              {/* Case breakdown */}
              {caseStats && (
                <div className="d-card" style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,padding:"14px 18px",marginBottom:16}}>
                  <div style={{fontSize:"0.72rem",fontWeight:700,color:"#7a8fa8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                    <BarChart2 size={13}/> Case Breakdown
                  </div>
                  {/* Progress bars */}
                  {[
                    {label:"Open",      value:caseStats.open,      total:caseStats.total, color:"#00d4ff"},
                    {label:"Escalated", value:caseStats.escalated, total:caseStats.total, color:"#ef4444"},
                    {label:"In Review", value:caseStats.inReview,  total:caseStats.total, color:"#f59e0b"},
                    {label:"Closed",    value:caseStats.closed,    total:caseStats.total, color:"#10b981"},
                    {label:"Overdue",   value:caseStats.overdue,   total:caseStats.total, color:"#f97316"},
                  ].map((s,i) => {
                    const pct = s.total > 0 ? Math.round((s.value / s.total) * 100) : 0;
                    return (
                      <div key={i} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:"0.74rem",color:"#94a3b8"}}>{s.label}</span>
                          <span style={{fontSize:"0.74rem",color:s.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{s.value} <span style={{color:"#3a5a7a"}}>({pct}%)</span></span>
                        </div>
                        <div style={{height:6,background:"#111c2e",borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:4,transition:"width 1s ease",opacity:.8}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total */}
              {caseStats && (
                <div className="d-card" style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,padding:"12px 18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:"0.8rem",color:"#7a8fa8",fontWeight:600}}>Total Cases</span>
                    <span style={{fontSize:"1.4rem",fontWeight:700,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace"}}>{caseStats.total}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════ DECISIONS ══════════════════ */}
          {activeTab==="decisions" && (
            <div style={{position:"relative",zIndex:1}}>
              {/* Stats */}
              <div className="stat-grid">
                {[
                  {title:"True Matches",   value:decStats?.trueMatches   ?? 0, Icon:XCircle,     color:"#ef4444", delay:"0s"   },
                  {title:"False Positives",value:decStats?.falsePositives ?? 0, Icon:CheckCircle, color:"#10b981", delay:".06s" },
                  {title:"Pending Review", value:decStats?.pendingReview  ?? 0, Icon:Clock,       color:"#f59e0b", delay:".12s" },
                  {title:"Risk Accepted",  value:decStats?.riskAccepted   ?? 0, Icon:Shield,      color:"#00d4ff", delay:".18s" },
                  {title:"Total",          value:decStats?.total          ?? 0, Icon:FileText,    color:"#8b5cf6", delay:".24s" },
                ].map((s,i) => <StatCard key={i} {...s} />)}
              </div>

              {/* Audit Trail */}
              <div className="d-card" style={{background:"#0d1321",border:"1px solid #1a2d4a",borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"13px 18px",borderBottom:"1px solid #1a2d4a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:"0.95rem",fontWeight:700,color:"#e2e8f0",display:"flex",alignItems:"center",gap:7}}>
                    <FileText size={14} color="#00d4ff"/> Audit Trail
                  </div>
                  <button onClick={fetchAuditTrail} style={{background:"none",border:"1px solid #1a2d4a",borderRadius:7,color:"#7a8fa8",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:"0.72rem",padding:"4px 10px"}}>
                    <RefreshCw size={12}/> Refresh
                  </button>
                </div>

                {loadingAudit ? (
                  <div style={{textAlign:"center",padding:"30px 0"}}>
                    <div style={{width:22,height:22,border:"3px solid #1a2d4a",borderTop:"3px solid #00d4ff",borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block"}} />
                  </div>
                ) : auditTrail.length === 0 ? (
                  <div style={{textAlign:"center",padding:"30px 0",color:"#7a8fa8",fontSize:"0.82rem"}}>No decisions recorded yet</div>
                ) : (
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:550}}>
                      <thead>
                        <tr style={{background:"#111c2e"}}>
                          {["DECISION","BY","TYPE","REF","COMMENT","DATE"].map(h=>(
                            <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:"0.62rem",fontWeight:700,color:"#3a5a7a",letterSpacing:"0.7px",borderBottom:"1px solid #1a2d4a",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auditTrail.map((d,i) => {
                          const cfg = DECISION_CFG[d.decision] || DECISION_CFG.PENDING_REVIEW;
                          return (
                            <tr key={d.id||i} className="row-hover" style={{borderBottom:"1px solid #111c2e",transition:"background .15s",animation:`fadeUp .3s ease ${i*.04}s both`}}>
                              <td style={{padding:"10px 14px"}}>
                                <span style={{fontSize:"0.7rem",fontWeight:700,color:cfg.color,background:cfg.bg,padding:"2px 8px",borderRadius:5,border:`1px solid ${cfg.color}33`,display:"inline-flex",alignItems:"center",gap:4,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                                  {cfg.icon} {cfg.label}
                                </span>
                              </td>
                              <td style={{padding:"10px 14px",fontSize:"0.8rem",fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap"}}>{d.decidedBy||"—"}</td>
                              <td style={{padding:"10px 14px"}}>
                                <span style={{fontSize:"0.68rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace",background:"#111c2e",padding:"2px 7px",borderRadius:4,border:"1px solid #1a2d4a"}}>
                                  {d.screeningType||"—"}
                                </span>
                              </td>
                              <td style={{padding:"10px 14px",fontSize:"0.72rem",color:"#00d4ff",fontFamily:"'JetBrains Mono',monospace"}}>#{d.screeningId||"—"}</td>
                              <td style={{padding:"10px 14px",fontSize:"0.76rem",color:"#7a8fa8",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {d.comment||<span style={{color:"#3a5a7a",fontStyle:"italic"}}>No comment</span>}
                              </td>
                              <td style={{padding:"10px 14px",fontSize:"0.7rem",color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>
                                {d.decidedAt ? new Date(d.decidedAt).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </Layout>
    </>
  );
}

function StatCard({title, value, sub, Icon, color, delay="0s"}) {
  return (
    <div className="stat-card d-card"
      style={{background:"#0d1321",border:`1px solid ${color}22`,borderRadius:12,
        padding:"14px 16px",cursor:"default",transition:"all .25s",
        position:"relative",overflow:"hidden",animationDelay:delay}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:color,opacity:.6}} />
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{fontSize:"0.68rem",fontWeight:600,color:"#7a8fa8",textTransform:"uppercase",letterSpacing:"0.5px",lineHeight:1.3}}>{title}</div>
        <div style={{color,opacity:.7}}><Icon size={16}/></div>
      </div>
      <div className="stat-val" style={{fontSize:"1.75rem",fontWeight:700,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",lineHeight:1,marginBottom:6}}>
        {typeof value==="number"?value.toLocaleString():value}
      </div>
      {sub && <div style={{fontSize:"0.69rem",color,fontWeight:500}}>{sub}</div>}
    </div>
  );
}