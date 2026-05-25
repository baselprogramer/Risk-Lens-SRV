import { useNavigate } from "react-router-dom";
import { getUsername } from "../services/authService";
import LogoIcon from "../assets/logo.svg";

const Header = ({ onMenuClick, notificationSlot }) => {
  const username    = getUsername() || "User";
  const firstLetter = username.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        @keyframes logoRingPulse {
          0%,100%{opacity:0.3;transform:scale(1)}
          50%{opacity:0.65;transform:scale(1.04)}
        }

        .hdr-root {
          background: #0a1020;
          border-bottom: 1px solid rgba(0,195,235,0.1);
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          flex-shrink: 0;
          font-family: 'IBM Plex Sans', sans-serif;
          box-shadow: 0 1px 0 rgba(0,195,235,0.04), 0 4px 24px rgba(0,0,0,0.3);
        }

        /* top accent line */
        .hdr-accent {
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, rgba(0,195,235,0.8), rgba(100,100,255,0.4), transparent);
          pointer-events: none;
        }

        /* ── LOGO ── */
        .hdr-logo-wrap {
          display: flex;
          align-items: center;
          gap: 0;
          text-decoration: none;
        }

        .hdr-logo-frame {
          position: relative;
          width: 52px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hdr-logo-ring {
          position: absolute;
          inset: -3px;
          width: calc(100% + 6px);
          height: calc(100% + 6px);
          animation: logoRingPulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        .hdr-logo-box {
          width: 52px;
          height: 37px;
          background: linear-gradient(135deg, rgba(0,195,235,0.09) 0%, rgba(0,120,180,0.05) 100%);
          border: 1px solid rgba(0,195,235,0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .hdr-logo-box img {
          width: 50px;
          height: 45px;
          object-fit: contain;
          filter: brightness(1.15) drop-shadow(0 0 5px rgba(0,195,235,0.38));
        }

        .hdr-logo-divider {
          width: 1px;
          height: 26px;
          background: rgba(0,195,235,0.13);
          margin: 0 13px;
          flex-shrink: 0;
        }

        .hdr-logo-text { display: flex; flex-direction: column; gap: 0; }
        .hdr-logo-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #cfe0f5;
          letter-spacing: -0.2px;
          line-height: 1.1;
        }
        .hdr-logo-name span { color: rgba(0,195,235,0.9); }
        .hdr-logo-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 7.5px;
          font-weight: 500;
          color: rgba(0,195,235,0.35);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 4px;
          line-height: 1;
        }

        /* ── RIGHT SIDE ── */
        .hdr-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* user badge */
        .hdr-user {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,195,235,0.05);
          border: 1px solid rgba(0,195,235,0.16);
          padding: 5px 12px 5px 7px;
          border-radius: 10px;
          transition: all 0.2s;
          cursor: default;
        }
        .hdr-user:hover {
          border-color: rgba(0,195,235,0.32) !important;
          background: rgba(0,195,235,0.09) !important;
        }

        .hdr-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(0,195,235,0.18), rgba(100,100,255,0.18));
          border: 1px solid rgba(0,195,235,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0,195,235,0.9);
          font-weight: 700;
          font-size: 13px;
          font-family: 'Space Grotesk', sans-serif;
          flex-shrink: 0;
        }

        .hdr-username {
          color: #cce0f2;
          font-weight: 600;
          font-size: 13.5px;
          font-family: 'IBM Plex Sans', sans-serif;
        }

        /* responsive */
        @media (max-width: 768px) {
          .hdr-root { padding: 0 14px; height: 56px; }
          .hdr-logo-tag { display: none; }
          .hdr-logo-divider { margin: 0 10px; }
          .hdr-logo-name { font-size: 15px; }
          .hdr-username { display: none; }
          .hdr-user { padding: 5px 7px; border-radius: 50%; }
        }

        @media (max-width: 480px) {
          .hdr-logo-tag    { display: none; }
          .hdr-logo-divider { display: none; }
          .hdr-logo-text   { display: none; }
          .hdr-logo-frame  { width: 46px; height: 33px; }
          .hdr-logo-box    { width: 46px; height: 33px; }
          .hdr-logo-box img { width: 28px; height: 28px; }
        }
      `}</style>

      <div className="hdr-root">
        <div className="hdr-accent" aria-hidden="true" />

        {/* Logo */}
        <div className="hdr-logo-wrap">
          <div className="hdr-logo-frame">
          
            <div className="hdr-logo-box">
              <img src={LogoIcon} alt="RiskLens" />
            </div>
          </div>

          <div className="hdr-logo-divider" />

          <div className="hdr-logo-text">
            <div className="hdr-logo-name">Risk<span>Lens</span></div>
            <div className="hdr-logo-tag">AML · Sanctions · Compliance</div>
          </div>
        </div>

        {/* Right */}
        <div className="hdr-right">
          {notificationSlot}

          <div className="hdr-user">
            <div className="hdr-avatar">{firstLetter}</div>
            <span className="hdr-username">{username}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;