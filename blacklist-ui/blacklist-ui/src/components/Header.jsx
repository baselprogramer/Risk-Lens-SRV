import { useNavigate } from "react-router-dom";
import { getUsername } from "../services/authService";

const Header = ({ onMenuClick }) => {
  const username    = getUsername() || "User";
  const firstLetter = username.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@600&display=swap');
        .hdr-user:hover {
          border-color: rgba(0,212,255,0.35) !important;
          background: rgba(0,212,255,0.09) !important;
        }
        /* ── زر الـ menu محذوف تماماً من الموبايل ── */
        #mobile-menu-btn { display: none !important; }

        @media (max-width: 768px) {
          #header-title-sub  { display: none !important; }
          #header-title-main { font-size: 0.88rem !important; }
        }
      `}</style>

      <div style={{
        background:"#0d1321", borderBottom:"1px solid #1a2d4a",
        padding:"0 16px", height:58,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100, flexShrink:0,
        fontFamily:"'IBM Plex Sans',sans-serif",
      }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:"linear-gradient(90deg,#00d4ff,#8b5cf6,transparent)" }} />

        {/* Left */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:4, height:28,
            background:"linear-gradient(180deg,#00d4ff,#8b5cf6)", borderRadius:4 }} />
          <div>
            <div id="header-title-main" style={{ fontSize:"1rem", fontWeight:700,
              color:"#e2e8f0", letterSpacing:"-0.2px", lineHeight:1.2 }}>
              RiskLens
            </div>
            <div id="header-title-sub" style={{ fontSize:"0.65rem", color:"#3a5a7a",
              fontFamily:"'JetBrains Mono',monospace" }}>
              Sanctions &amp; AML Intelligence plateform
            </div>
          </div>
        </div>

        {/* Right — User badge */}
        <div className="hdr-user" style={{
          display:"flex", alignItems:"center", gap:8,
          background:"rgba(0,212,255,0.06)",
          border:"1px solid rgba(0,212,255,0.18)",
          padding:"6px 12px 6px 8px", borderRadius:10,
          transition:"all 0.2s", cursor:"default",
        }}>
          <div style={{ width:30, height:30, borderRadius:"50%",
            background:"linear-gradient(135deg,rgba(0,212,255,0.2),rgba(139,92,246,0.2))",
            border:"1px solid rgba(0,212,255,0.3)",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#00d4ff", fontWeight:700, fontSize:"0.82rem",
            fontFamily:"'JetBrains Mono',monospace" }}>
            {firstLetter}
          </div>
          <span style={{ color:"#e2e8f0", fontWeight:600, fontSize:"0.86rem" }}>
            {username}
          </span>
        </div>
      </div>
    </>
  );
};

export default Header;