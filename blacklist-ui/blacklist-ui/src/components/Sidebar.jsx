import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Radar, Search, Database, Globe,
  ArrowLeftRight, LogOut, User, Users, ClipboardList,
  X, Briefcase, Key, Building2, Shield, Webhook, Activity
} from "lucide-react";
import { getUserRole, getUsername, logout } from "../services/authService";
import { useLang } from "../context/LangContext";
import { staticContent } from "../locales/content";


const ROLE_CFG = {
  SUPER_ADMIN:   { label:"SUPER ADMIN",   color:"#f59e0b", iconColor:"#f59e0b", gradA:"rgba(245,158,11,0.18)", gradB:"rgba(239,68,68,0.12)",  border:"rgba(245,158,11,0.28)" },
  COMPANY_ADMIN: { label:"COMPANY ADMIN", color:"#00c4f0", iconColor:"#00c4f0", gradA:"rgba(0,196,240,0.15)",  gradB:"rgba(100,100,255,0.12)", border:"rgba(0,196,240,0.28)"  },
  ADMIN:         { label:"ADMIN",         color:"#00c4f0", iconColor:"#00c4f0", gradA:"rgba(0,196,240,0.15)",  gradB:"rgba(100,100,255,0.12)", border:"rgba(0,196,240,0.28)"  },
  SUBSCRIBER:    { label:"SUBSCRIBER",    color:"#10b981", iconColor:"#10b981", gradA:"rgba(16,185,129,0.15)", gradB:"rgba(0,196,240,0.12)",   border:"rgba(16,185,129,0.28)" },
};

/* section grouping — visual separator labels */
const SECTIONS = [
  { label:"Core",        items:["/dashboard","/screen","/search","/transfer","/cases"] },
  { label:"Admin",       items:["/local","/webhooks","/list","/audit","/users","/monitoring"] },
  { label:"System",      items:["/api-keys","/companies"] },
];

const Sidebar = ({ onClose, collapsed, setCollapsed }) => {
  const navigate  = useNavigate();
  const role      = getUserRole();
  const username  = getUsername() || "User";
  const firstLetter = username.charAt(0).toUpperCase();
  const isMobile  = window.innerWidth <= 768;
  const roleCfg   = ROLE_CFG[role] || ROLE_CFG.SUBSCRIBER;
  const { lang } = useLang();
  const data = staticContent.sideBar[lang];

  const visibleItems = data.menuItem.filter(item =>
    !item.roles || item.roles.includes(role)
  );

  const handleLogout   = () => { logout(); navigate("/login"); };
  const handleNavClick = () => { if (isMobile && onClose) onClose(); };

  /* which items belong to which section */
  const getSectionItems = (paths) =>
    visibleItems.filter(i => paths.includes(i.to));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        /* ── nav item ── */
        .sb-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          margin: 1px 0;
          border-radius: 8px;
          text-decoration: none;
          color: rgba(120,160,200,0.65);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.18s ease;
          border: 1px solid transparent;
          font-family: 'IBM Plex Sans', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          position: relative;
        }
        .sb-item:hover {
          color: #cde4f5 !important;
          background: rgba(0,195,235,0.06) !important;
          border-color: rgba(0,195,235,0.12) !important;
          transform: translateX(2px);
        }
        .sb-item.active {
          color: #ddeef8 !important;
          background: rgba(0,195,235,0.09) !important;
          border-color: rgba(0,195,235,0.22) !important;
          font-weight: 600 !important;
        }
        .sb-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 18%; bottom: 18%;
          width: 2.5px;
          background: linear-gradient(180deg, rgba(0,195,235,0.9), rgba(100,100,255,0.7));
          border-radius: 0 2px 2px 0;
        }

        /* logout */
        .sb-logout:hover {
          color: #fc8181 !important;
          background: rgba(239,68,68,0.07) !important;
          border-color: rgba(239,68,68,0.18) !important;
        }

        /* section label */
        .sb-section-lbl {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(0,195,235,0.28);
          padding: 0 10px;
          margin: 14px 0 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sb-section-lbl::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(0,195,235,0.08);
        }

        /* super badge */
        .sb-super-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 1px 5px;
          border-radius: 3px;
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.25);
          font-size: 8px;
          font-weight: 700;
          color: rgba(245,158,11,0.85);
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.1px;
          margin-left: auto;
          flex-shrink: 0;
        }

        /* hide scrollbar */
        .sb-nav::-webkit-scrollbar { display: none; }
        .sb-nav { -ms-overflow-style: none; scrollbar-width: none; }

        /* tooltip for collapsed mode */
        .sb-item[data-tip]:hover::after {
          content: attr(data-tip);
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: #0d1929;
          border: 1px solid rgba(0,195,235,0.2);
          color: #cde4f5;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 999;
          font-family: 'IBM Plex Sans', sans-serif;
        }
      `}</style>

      <div style={{
        width: isMobile ? "256px" : collapsed ? "64px" : "232px",
        height: "100%",
        minHeight: "100%",
        background: "#080f1c",
        borderRight: "1px solid rgba(0,195,235,0.08)",
        padding: collapsed && !isMobile ? "18px 8px" : "18px 12px",
        position: "relative",
        transition: "width 0.26s ease, padding 0.26s ease",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        fontFamily: "'IBM Plex Sans', sans-serif",
        overflow: "visible",
        zIndex: 10,
        boxSizing: "border-box",
      }}>

        {/* role accent top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: role === "SUPER_ADMIN"
            ? "linear-gradient(90deg,rgba(245,158,11,0.9),rgba(239,68,68,0.5),transparent)"
            : "linear-gradient(90deg,rgba(0,195,235,0.8),rgba(100,100,255,0.4),transparent)",
        }} />

        {/* ── Top: close btn (mobile) ── */}
        {isMobile && onClose && (
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid rgba(0,195,235,0.12)",
              cursor: "pointer", color: "rgba(0,195,235,0.5)",
              padding: "4px 8px", borderRadius: 6, display:"flex", alignItems:"center",
            }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="sb-nav" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {SECTIONS.map(section => {
            const sectionVisible = getSectionItems(section.items);
            if (sectionVisible.length === 0) return null;
            return (
              <div key={section.label}>
                {(!collapsed || isMobile) && (
                  <div className="sb-section-lbl">{section.label}</div>
                )}
                {collapsed && !isMobile && (
                  <div style={{
                    height: 1, background: "rgba(0,195,235,0.07)",
                    margin: "10px 4px 6px",
                  }} />
                )}
                {sectionVisible.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) => `sb-item${isActive ? " active" : ""}`}
                    data-tip={collapsed && !isMobile ? item.label : undefined}
                    onClick={handleNavClick}
                  >
                    <item.icon
                      size={18}
                      strokeWidth={1.8}
                      style={{ flexShrink: 0, minWidth: 18 }}
                    />
                    {(!collapsed || isMobile) && (
                      <>
                        <span style={{ flex: 1, overflow:"hidden", textOverflow:"ellipsis" }}>
                          {item.label}
                        </span>
                        {item.to === "/companies" && (
                          <span className="sb-super-badge">
                            <Shield size={7} /> SUPER
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* ── User Info ── */}
        {(!collapsed || isMobile) && (
          <div style={{
            margin: "10px 0 8px",
            padding: "10px 11px",
            background: "rgba(0,195,235,0.03)",
            border: "1px solid rgba(0,195,235,0.09)",
            borderRadius: 9,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{
                width: 30, height: 30,
                borderRadius: 8, flexShrink: 0,
                background: `linear-gradient(135deg,${roleCfg.gradA},${roleCfg.gradB})`,
                border: `1px solid ${roleCfg.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {role === "SUPER_ADMIN"
                  ? <Shield size={13} color={roleCfg.iconColor} strokeWidth={1.8} />
                  : <User   size={13} color={roleCfg.iconColor} strokeWidth={1.8} />
                }
              </div>
              <div style={{ overflow:"hidden", flex:1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#cde4f2",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {username}
                </div>
                <div style={{
                  fontSize: 9.5, fontWeight: 600,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: roleCfg.color, marginTop: 1, letterSpacing: "0.06em",
                }}>
                  {roleCfg.label}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* collapsed avatar */}
        {collapsed && !isMobile && (
          <div style={{
            width: 36, height: 36, borderRadius: 9, margin: "8px auto",
            background: `linear-gradient(135deg,${roleCfg.gradA},${roleCfg.gradB})`,
            border: `1px solid ${roleCfg.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {role === "SUPER_ADMIN"
              ? <Shield size={14} color={roleCfg.iconColor} strokeWidth={1.8} />
              : <User   size={14} color={roleCfg.iconColor} strokeWidth={1.8} />
            }
          </div>
        )}

        {/* ── Logout ── */}
        <button
          className="sb-item sb-logout"
          onClick={handleLogout}
          data-tip={collapsed && !isMobile ? "Logout" : undefined}
          style={{
            width: "100%", background: "none",
            border: "1px solid transparent", cursor: "pointer",
            color: "rgba(120,160,200,0.6)", transition: "all 0.18s",
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px", borderRadius: 8,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13, fontWeight: 500, marginTop: 4,
          }}
        >
          <LogOut size={18} strokeWidth={1.8} style={{ flexShrink:0, minWidth:18 }} />
          {(!collapsed || isMobile) && <span>{data.logout}</span>}
        </button>

      </div>
    </>
  );
};

export default Sidebar;