import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Radar, Search, Database, Globe,
  ArrowLeftRight, LogOut, User, Users, ClipboardList,
  X, Briefcase, Key, Building2, Shield, ChevronLeft, Webhook,Activity} from "lucide-react";
import { getUserRole, getUsername, logout } from "../services/authService";
import LogoIcon from "../assets/logo.svg";

// ── Menu Items ────────────────────────────────────────────────────────────────
// roles: null = الكل | array = محدد
const menuItems = [
  { to:"/dashboard", label:"Dashboard",       icon:LayoutDashboard, roles:null                               },
  { to:"/screen",    label:"Risk Screening",  icon:Radar,           roles:null                               },
  { to:"/search",    label:"Search",          icon:Search,          roles:null                               },
  { to:"/transfer",  label:"Transfer Scan",   icon:ArrowLeftRight,  roles:null                               },
  { to:"/cases",     label:"Case Management", icon:Briefcase,       roles:null                               },
  { to:"/local",     label:"Local Sanctions", icon:Database,        roles:["SUPER_ADMIN"]    },
  { to:"/webhooks",  label:"Webhooks",        icon:Webhook,         roles:["SUPER_ADMIN","COMPANY_ADMIN"] }, 
  { to:"/list",      label:"Global Sanctions",icon:Globe,           roles:["SUPER_ADMIN","COMPANY_ADMIN"]    },
  { to:"/audit",     label:"Audit Trail",     icon:ClipboardList,   roles:["SUPER_ADMIN","COMPANY_ADMIN"]    },
  { to:"/users",     label:"User Management", icon:Users,           roles:["SUPER_ADMIN","COMPANY_ADMIN"]    },
  { to:"/monitoring", label:"Monitoring", icon:Activity, roles:["SUPER_ADMIN","COMPANY_ADMIN"] },
  { to:"/api-keys",  label:"API Keys",        icon:Key,             roles:["SUPER_ADMIN"]    },
  { to:"/companies", label:"Companies",       icon:Building2,       roles:["SUPER_ADMIN"]                    },
];

// ── Role Config ───────────────────────────────────────────────────────────────
const ROLE_CFG = {
  SUPER_ADMIN:   { label:"SUPER ADMIN",    color:"#f59e0b", iconColor:"#f59e0b", gradient:"rgba(245,158,11,0.2),rgba(239,68,68,0.2)",   border:"rgba(245,158,11,0.3)"  },
  COMPANY_ADMIN: { label:"COMPANY ADMIN",  color:"#00d4ff", iconColor:"#00d4ff", gradient:"rgba(0,212,255,0.2),rgba(139,92,246,0.2)",   border:"rgba(0,212,255,0.3)"   },
  ADMIN:         { label:"ADMIN",          color:"#00d4ff", iconColor:"#00d4ff", gradient:"rgba(0,212,255,0.2),rgba(139,92,246,0.2)",   border:"rgba(0,212,255,0.3)"   },
  SUBSCRIBER:    { label:"SUBSCRIBER",     color:"#10b981", iconColor:"#10b981", gradient:"rgba(16,185,129,0.2),rgba(0,212,255,0.2)",   border:"rgba(16,185,129,0.3)"  },
};

const Sidebar = ({ onClose , collapsed, setCollapsed }) => {
 // const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const role      = getUserRole();
  const username  = getUsername() || "User";
  const isMobile  = window.innerWidth <= 768;
  const roleCfg   = ROLE_CFG[role] || ROLE_CFG.SUBSCRIBER;

  // فلتر الـ menu حسب الـ role
  const visibleItems = menuItems.filter(item => {
    if (!item.roles) return true;               
    return item.roles.includes(role);
  });

  const handleLogout   = () => { logout(); navigate("/login"); };
  const handleNavClick = () => { if (isMobile && onClose) onClose(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@600&display=swap');
        .sb-item {
          display:flex; align-items:center; gap:12px;
          padding:9px 10px; margin:3px 0; border-radius:10px;
          text-decoration:none; color:#4a6a8a;
          font-weight:500; font-size:0.82rem;
          transition:all 0.2s ease; position:relative;
          border:1px solid transparent;
          font-family:'IBM Plex Sans',sans-serif;
        }
        .sb-item:hover {
          color:#e2e8f0 !important;
          background:rgba(0,212,255,0.06) !important;
          border-color:rgba(0,212,255,0.15) !important;
          transform:translateX(3px);
        }
        .sb-item.active {
          color:#e2e8f0 !important;
          background:rgba(0,212,255,0.1) !important;
          border-color:rgba(0,212,255,0.3) !important;
          font-weight:600 !important;
        }
        .sb-item.active::before {
          content:''; position:absolute; left:0; top:20%; bottom:20%;
          width:3px; background:linear-gradient(180deg,#00d4ff,#8b5cf6);
          border-radius:0 3px 3px 0;
        }
        .sb-toggle:hover { transform:scale(1.15) !important; box-shadow:0 4px 14px rgba(0,212,255,0.4) !important; }
        .sb-logout:hover { color:#ef4444 !important; background:rgba(239,68,68,0.08) !important; border-color:rgba(239,68,68,0.2) !important; }
        .sb-super-badge {
          display:inline-flex; align-items:center; gap:3px;
          padding:1px 6px; border-radius:4px;
          background:rgba(245,158,11,0.15);
          border:1px solid rgba(245,158,11,0.3);
          font-size:0.58rem; font-weight:700;
          color:#f59e0b; font-family:'JetBrains Mono',monospace;
          letter-spacing:0.3px;
        }
        .sb-nav::-webkit-scrollbar { display: none; }
        .sb-nav { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{
          width: isMobile ? "260px" : collapsed ? "68px" : "240px",
          height: "100%",           
          minHeight: "100%",        
          background:"#0d1321",
          borderRight:"1px solid #1a2d4a",
          padding: collapsed && !isMobile ? "20px 10px" : "20px 14px",
          position:"relative",
          transition:"width 0.28s ease, padding 0.28s ease",
          display:"flex",
          flexDirection:"column",
          flexShrink:0,
          fontFamily:"'IBM Plex Sans',sans-serif",
          overflow:"visible",        
          zIndex:10,
          boxSizing:"border-box",   
        }}>

        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background: role==="SUPER_ADMIN"
            ? "linear-gradient(90deg,#f59e0b,#ef4444,transparent)"
            : "linear-gradient(90deg,#00d4ff,#8b5cf6,transparent)" }} />

        {/* Brand + Close */}
        <div style={{ display:"flex", alignItems:"center", gap:11,
          marginBottom:28, paddingBottom:18, borderBottom:"1px solid #1a2d4a",
          overflow:"hidden", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:38, height:38, flexShrink:0,
              background:"linear-gradient(135deg,rgba(0,212,255,0.15),rgba(139,92,246,0.15))",
              border:"1px solid rgba(0,212,255,0.3)", borderRadius:10,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 14px rgba(0,212,255,0.15)" }}>
              <img src={LogoIcon} alt="Blacklist API Logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
              
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontSize:"1.05rem", fontWeight:700, letterSpacing:"-0.2px",
                  background:"linear-gradient(135deg,#e2e8f0 0%,#00d4ff 100%)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  whiteSpace:"nowrap" }}>RiskLens</div>
                <div style={{ fontSize:"0.65rem", color:"#3a5a7a",
                  fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap", marginTop:1 }}>
                  Sanctions &amp; AML Intelligence
                </div>
              </div>
            )}
          </div>
          {isMobile && onClose && (
            <button onClick={onClose} style={{ background:"none", border:"none",
              cursor:"pointer", color:"#4a6a8a", padding:4 }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {(!collapsed || isMobile) && (
            <div style={{ fontSize:"0.63rem", color:"#3a5a7a", fontWeight:700,
              letterSpacing:"1px", textTransform:"uppercase",
              padding:"0 6px", marginBottom:8,
              fontFamily:"'JetBrains Mono',monospace" }}>
              Navigation
            </div>
          )}

          {visibleItems.map(item => (
            <NavLink key={item.to} to={item.to} end
              className={({ isActive }) => `sb-item${isActive ? " active" : ""}`}
              title={collapsed && !isMobile ? item.label : undefined}
              onClick={handleNavClick}>
              <item.icon size={20} strokeWidth={2} style={{ flexShrink:0, minWidth:20 }} />
              {(!collapsed || isMobile) && (
                <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  flex:1 }}>
                  {item.label}
                </span>
              )}
              {/* Super Admin badge على Companies */}
              {(!collapsed || isMobile) && item.to==="/companies" && (
                <span className="sb-super-badge">
                  <Shield size={8}/> SUPER
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        {(!collapsed || isMobile) && (
          <div style={{ margin:"12px 0 8px", padding:"10px 12px",
            background:"rgba(0,212,255,0.04)", border:"1px solid #1a2d4a", borderRadius:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                background:`linear-gradient(135deg,${roleCfg.gradient})`,
                border:`1px solid ${roleCfg.border}`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {role === "SUPER_ADMIN"
                  ? <Shield size={14} color={roleCfg.iconColor}/>
                  : <User   size={14} color={roleCfg.iconColor}/>
                }
              </div>
              <div style={{ overflow:"hidden", flex:1 }}>
                <div style={{ fontSize:"0.78rem", fontWeight:600, color:"#e2e8f0",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {username}
                </div>
                <div style={{ fontSize:"0.62rem", fontWeight:700,
                  fontFamily:"'JetBrains Mono',monospace", color:roleCfg.color }}>
                  {roleCfg.label}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button className="sb-item sb-logout" onClick={handleLogout}
          title={collapsed && !isMobile ? "Logout" : undefined}
          style={{ width:"100%", background:"none", border:"1px solid transparent",
            cursor:"pointer", color:"#4a6a8a", transition:"all 0.2s",
            display:"flex", alignItems:"center", gap:12,
            padding:"11px 14px", borderRadius:10,
            fontFamily:"'IBM Plex Sans',sans-serif",
            fontSize:"0.88rem", fontWeight:500 }}>
          <LogOut size={20} strokeWidth={2} style={{ flexShrink:0, minWidth:20 }} />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>

        {/* Collapse toggle — desktop only */}
   
      </div>
    </>
  );
};

export default Sidebar;