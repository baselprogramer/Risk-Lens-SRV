import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ChevronLeft } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationBell, ToastContainer } from "./NotificationBell";
import { useLang } from "../context/LangContext";
import { staticContent } from "../locales/content";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);
  const [toasts,      setToasts]      = useState([]);
  const location = useLocation();
  const navigate  = useNavigate();
  const {lang} = useLang()
  const data = staticContent.sideBar[lang]

  // ✅ هون داخل الـ component — صح
  const { notifications, unreadCount, connected, markAllRead, dismiss } = useNotifications();

  // ✅ كل ما يجي إشعار جديد، اعرض toast
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (unreadCount > prevCountRef.current && notifications.length > 0) {
      const latest = notifications[0];
      setToasts(prev => [latest, ...prev].slice(0, 5));
      // اخفيه بعد 6 ثواني
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== latest.id));
      }, 6000);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, notifications]);

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

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
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
      `}</style>

      {/* ✅ Header مع الـ NotificationBell */}
      <div style={{ position:"relative", zIndex:200 }}>
        <Header
          notificationSlot={
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              connected={connected}
              onMarkAllRead={markAllRead}
              onDismiss={dismiss}
            />
          }
        />
      </div>

      <div style={{ display:"flex", flex:1, minHeight:0, position:"relative", zIndex:1 }}>

        {/* Desktop Sidebar + Toggle */}
        <div id="sidebar-desktop" style={{
          display:"flex",
          height:"100%",
          position:"relative",
          flexShrink:0,
        }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

          <button
            className="sb-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position:"absolute",
              right:-11, top:72,
              width:22, height:22,
              borderRadius:6,
              background:"linear-gradient(135deg,#00d4ff,#8b5cf6)",
              border:"2px solid #060912",
              cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 2px 10px rgba(0,212,255,0.3)",
              padding:0, zIndex:200,
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
        {data.NAV_ITEMS.map(({path, label, Icon}) => {
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

      {/* ✅ Toast Container — يظهر فوق كل شي */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default Layout;