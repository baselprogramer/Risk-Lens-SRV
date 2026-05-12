import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ChevronLeft } from "lucide-react";

const NavIcons = {
  Dashboard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Screen: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Search: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Transfer: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
      <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
      <path d="M7 12h10"/><path d="m14 9 3 3-3 3"/>
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Cases: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { path:"/dashboard", label:"Dashboard", Icon:NavIcons.Dashboard },
  { path:"/screen",    label:"Screen",    Icon:NavIcons.Screen    },
  { path:"/search",    label:"Search",    Icon:NavIcons.Search    },
  { path:"/transfer",  label:"Transfer",  Icon:NavIcons.Transfer  },
  { path:"/cases",     label:"Cases",     Icon:NavIcons.Cases     },
  { path:"#menu",      label:"More",      Icon:NavIcons.Menu      },
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      background:"#060912", fontFamily:"'IBM Plex Sans',sans-serif",
    }}>
      <style>{`
        @media(max-width:768px){
          #sidebar-desktop{display:none!important;}
          #mobile-nav{display:flex!important;}
          #content-area{padding:12px 10px 80px 10px!important;}
        }
        @media(min-width:769px){
          #sidebar-desktop{display:flex!important;}
          #mobile-nav{display:none!important;}
          #mobile-overlay{display:none!important;}
          #mobile-drawer{display:none!important;}
        }
        .nav-item-btn{
          background:none; border:none; cursor:pointer;
          display:flex; flex-direction:column; align-items:center; gap:3px;
          padding:6px 10px; border-radius:10px; transition:all .15s;
          font-family:'IBM Plex Sans',sans-serif;
          -webkit-tap-highlight-color:transparent;
        }
        .nav-item-btn:active{ transform:scale(0.92); }
        .sb-toggle-btn:hover{ transform:scale(1.15); box-shadow:0 4px 14px rgba(0,212,255,0.4) !important; }
      `}</style>

      <Header />

      <div style={{ display:"flex", flex:1, minHeight:0, position:"relative", zIndex:1 }}>

        {/* Desktop Sidebar + Toggle */}
        <div id="sidebar-desktop" style={{
          display:"flex",
          height:"100%",
          position:"relative",  
          flexShrink:0,
        }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

          {/* Toggle button — جوا نفس الـ div */}
          <button
            className="sb-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position:"absolute",
              right: -11,
              top: 72,
              width:22, height:22,
              borderRadius:6,
              background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",
              border:"2px solid #060912",
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              boxShadow:"0 2px 10px rgba(0,212,255,0.3)",
              padding:0,
              zIndex:200,
              transition:"all 0.2s ease",
            }}>
            <ChevronLeft size={13} color="#060912"
              style={{
                transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
                transition:"transform 0.28s ease",
              }} />
          </button>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div id="mobile-overlay"
            onClick={() => setSidebarOpen(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)",
              zIndex:50, display:"block" }} />
        )}

        {/* Mobile Drawer */}
        <div id="mobile-drawer" style={{
          position:"fixed", top:0, left:0, bottom:0, zIndex:51,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.28s ease",
          display:"block",
        }}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Content */}
        <div id="content-area" style={{
          flex:1, padding:"20px", background:"#060912",
          overflow:"auto", position:"relative",
        }}>
          <div style={{
            position:"absolute", inset:0,
            backgroundImage:"linear-gradient(rgba(0,212,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.018) 1px,transparent 1px)",
            backgroundSize:"50px 50px", pointerEvents:"none", zIndex:0,
          }} />
          <div style={{ position:"relative", zIndex:1 }}>{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div id="mobile-nav" style={{
        display:"none",
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        background:"#0d1321",
        borderTop:"1px solid #1a2d4a",
        padding:"6px 4px",
        justifyContent:"space-around", alignItems:"center",
        boxShadow:"0 -4px 20px rgba(0,0,0,0.4)",
      }}>
        {NAV_ITEMS.map(({path, label, Icon}) => {
          const isActive = path !== "#menu" && location.pathname === path;
          const isMenu   = path === "#menu";
          const color    = isActive ? "#00d4ff" : "#4a6a8a";
          return (
            <button key={path} className="nav-item-btn"
              onClick={() => isMenu ? setSidebarOpen(true) : navigate(path)}
              style={{ color, background: isActive ? "rgba(0,212,255,0.08)" : "none" }}>
              <Icon />
              <span style={{ fontSize:10, fontWeight: isActive ? 700 : 500, letterSpacing:"0.2px" }}>
                {label}
              </span>
              {isActive && (
                <div style={{ position:"absolute", width:4, height:4, borderRadius:"50%",
                  background:"#00d4ff", bottom:2 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Layout;