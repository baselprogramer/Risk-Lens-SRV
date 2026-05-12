import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Zap, Globe2, Brain, User, ArrowLeftRight, Bell,
  Building2, BarChart3, Shield, Menu, X,
  Scale, UserCheck, Database, AlertTriangle, Lock, FileSearch,
  Code2, Terminal, Key, Mail, Phone,
  CheckCircle, Cpu, Activity
} from "lucide-react";
import LogoIcon from "../assets/logo.svg";

// ══ GLOBAL STYLES ═══════════════════════════════════════════════════
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { background: #071828; color: #f0f9ff; font-family: 'Inter', system-ui, sans-serif; margin: 0; overflow-x: hidden; -webkit-font-smoothing: antialiased; }

  /* Nav */
  .lp-links { display: flex; align-items: center; gap: 2px; }
  .lp-ctas  { display: flex; gap: 8px; align-items: center; }
  .lp-burger { display: none !important; background: none; border: none; color: #94b4c8; cursor: pointer; padding: 6px; border-radius: 8px; transition: background 0.2s; }
  .lp-burger:hover { background: rgba(255,255,255,0.06); }
    @media(max-width: 900px) {
    .lp-links  { display: none !important; }
    .lp-ctas   { display: none !important; }
    .lp-burger { display: flex !important; align-items: center; }
    .lp-nav-el      { padding: 10px 16px !important; }
    .lp-brand-logo  { width: 28px !important; height: 24px !important; }
    .lp-brand-text  { font-size: 0.9rem !important; }
  }

  /* Drawer */
  .lp-drawer {
    position: fixed; inset: 0; z-index: 299;
    background: rgba(4,12,24,0.99); backdrop-filter: blur(28px);
    display: flex; flex-direction: column; align-items: stretch;
    animation: lpDrawIn 0.2s ease;
  }
  @keyframes lpDrawIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  .lp-dl {
    background: none; border: none; width: 280px; font-size: 1.25rem; font-weight: 700;
    padding: 13px 0; text-align: center; border-radius: 12px; cursor: pointer;
    font-family: inherit; transition: all 0.2s; letter-spacing: -0.3px;
  }
  .lp-dl:hover { background: rgba(0,212,255,0.07); color: #00d4ff !important; }
  .lp-dclose-btn {
    position: absolute; top: 18px; right: 18px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: #94b4c8; cursor: pointer; width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  }
  .lp-dclose-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }

  /* Animations */
  .lp-rv { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .lp-in { opacity: 1; transform: none; }
  @keyframes lpFu    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
  @keyframes lpPd    { 0%,100%{box-shadow:0 0 8px #00d4ff;opacity:1} 50%{box-shadow:0 0 22px #00d4ff;opacity:0.6} }
  @keyframes lpGs    { 0%{background-position:0% center} 100%{background-position:200% center} }
  @keyframes lpFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-12px) rotate(2deg)} 66%{transform:translateY(-6px) rotate(-1deg)} }

  /* Responsive — Nav */
  @media(max-width:900px) {
    .lp-links  { display: none !important; }
    .lp-ctas   { display: none !important; }
    .lp-burger { display: flex !important; align-items: center; }
  }

  /* Responsive — Grids */
  .lp-stats-grid  { display: grid; grid-template-columns: repeat(4,1fr); }
  .lp-lists-grid  { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-top: 44px; }
  .lp-feat-grid   { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 12px; margin-top: 44px; }
  .pricing-grid   { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 60px; }
  .payg-grid      { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .docs-grid      { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
  .about-stats    { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 72px; }
  .about-values   { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
  .contact-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: start; }
  .ft-grid        { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 44px; }
  .ft-bottom      { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 22px; }

  @media(max-width:900px) {
    .lp-stats-grid  { grid-template-columns: repeat(2,1fr) !important; }
    .lp-lists-grid  { grid-template-columns: repeat(2,1fr) !important; }
    .lp-float-icon  { display: none !important; }
    .pricing-grid   { grid-template-columns: 1fr !important; }
    .payg-grid      { grid-template-columns: 1fr !important; }
    .docs-grid      { grid-template-columns: 1fr !important; }
    .about-stats    { grid-template-columns: repeat(2,1fr) !important; }
    .about-values   { grid-template-columns: 1fr !important; }
    .contact-grid   { grid-template-columns: 1fr !important; gap: 32px !important; }
    .ft-grid        { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
  }
  @media(max-width:600px) {
    .lp-stats-grid  { grid-template-columns: repeat(2,1fr) !important; }
    .lp-lists-grid  { grid-template-columns: repeat(2,1fr) !important; }
    .lp-feat-grid   { grid-template-columns: 1fr !important; }
    .ft-grid        { grid-template-columns: 1fr !important; }
  }
`;

// ══ NAV ══════════════════════════════════════════════════════════════
function Nav({ scrollY = 0 }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { label: "Product",  path: "/" },
    { label: "Pricing",  path: "/pricing" },
    { label: "API Docs", path: "/api-docs" },
    { label: "About",    path: "/about" },
    { label: "Contact",  path: "/contact" },
  ];
  const active = path => location.pathname === path;

  return (
    <>
      <nav className="lp-nav-el" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: scrollY > 40 ? "11px 32px" : "15px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrollY > 40 ? "rgba(2,10,20,0.96)" : "transparent",
        backdropFilter: scrollY > 40 ? "blur(24px)" : "none",
        borderBottom: scrollY > 40 ? "1px solid rgba(0,212,255,0.08)" : "none",
        transition: "all 0.3s",

        
      }}>
        {/* Brand */}
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
          <img src={LogoIcon} alt="Blacklist API Logo" style={{ width: 70, height: 60, objectFit: "contain" }} />
          <span style={{ fontSize: "1.0rem", fontWeight: 600, letterSpacing: "-0.4px", background: "linear-gradient(135deg,#f0f9ff 30%,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Risklens
          </span>
        </div>

        {/* Desktop links */}
        <div className="lp-links">
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)} style={{
              padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active(l.path) ? "rgba(0,212,255,0.1)" : "transparent",
              color: active(l.path) ? "#00d4ff" : "#6a8fa8",
              fontSize: "0.83rem", fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={e => { if (!active(l.path)) e.currentTarget.style.color = "#c4dde8"; }}
              onMouseLeave={e => { if (!active(l.path)) e.currentTarget.style.color = "#6a8fa8"; }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="lp-ctas">
          <button onClick={() => navigate("/login")} style={{
            padding: "8px 18px", borderRadius: 8, fontSize: "0.83rem", fontWeight: 600,
            cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
            color: "#6a8fa8", fontFamily: "inherit", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#00d4ff"; e.currentTarget.style.color = "#00d4ff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#6a8fa8"; }}>
            Sign In
          </button>
          <button onClick={() => navigate("/contact")} style={{
            padding: "8px 18px", borderRadius: 8, fontSize: "0.83rem", fontWeight: 700,
            cursor: "pointer", background: "linear-gradient(135deg,#00d4ff,#7c3aed)",
            border: "none", color: "#020c18", fontFamily: "inherit",
            boxShadow: "0 4px 18px rgba(0,212,255,0.28)", transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            Get API Key →
          </button>
        </div>

        {/* Hamburger */}
        <button className="lp-burger" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
  <div className="lp-drawer" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>

    {/* Top bar */}
    <div style={{
      width: "100%", padding: "14px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid rgba(0,212,255,0.08)",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src={LogoIcon} alt="logo" style={{ width: 26, height: 26, objectFit: "contain" }} />
        <span style={{ fontSize: "0.9rem", fontWeight: 800, background: "linear-gradient(135deg,#f0f9ff,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Risklens
        </span>
      </div>
      <button onClick={() => setOpen(false)} style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, width: 38, height: 38, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#94b4c8", transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ef4444"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94b4c8"; }}>
        <X size={16} />
      </button>
    </div>

    {/* Links */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, width: "100%", padding: "0 24px" }}>
      {links.map(l => (
        <button key={l.path} onClick={() => { navigate(l.path); setOpen(false); }}
          style={{
            background: active(l.path) ? "rgba(0,212,255,0.08)" : "none",
            border: "none", width: "100%", maxWidth: 300,
            fontSize: "1.1rem", fontWeight: 600,
            padding: "13px 0", textAlign: "center",
            borderRadius: 10, cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.2s",
            color: active(l.path) ? "#00d4ff" : "#94b4c8",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,255,0.07)"; e.currentTarget.style.color = "#00d4ff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = active(l.path) ? "rgba(0,212,255,0.08)" : "none"; e.currentTarget.style.color = active(l.path) ? "#00d4ff" : "#94b4c8"; }}>
          {l.label}
        </button>
      ))}
    </div>

    {/* Auth */}
    <div style={{ width: "100%", padding: "16px 24px 32px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => { navigate("/login"); setOpen(false); }} style={{
        padding: "13px", borderRadius: 10, fontWeight: 600, fontSize: "0.92rem",
        cursor: "pointer", background: "transparent",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#94b4c8", fontFamily: "inherit", transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)"; e.currentTarget.style.color = "#00d4ff"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94b4c8"; }}>
        Sign In
      </button>
      <button onClick={() => { navigate("/contact"); setOpen(false); }} style={{
        padding: "13px", borderRadius: 10, fontWeight: 700, fontSize: "0.92rem",
        cursor: "pointer", background: "linear-gradient(135deg,#00d4ff,#7c3aed)",
        border: "none", color: "#020c18", fontFamily: "inherit",
        boxShadow: "0 4px 20px rgba(0,212,255,0.3)",
      }}>
        Get API Key →
      </button>
    </div>

  </div>
)}
    </>
  );
}

// ══ PAGE BG ═══════════════════════════════════════════════════════════
function PageBG({ children, scrollY }) {
  return (
    <div style={{ background: "#071828", minHeight: "100vh", color: "#f0f9ff", fontFamily: "'Inter',system-ui,sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <style>{G}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(0,212,255,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.045) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "fixed", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,160,255,0.18) 0%,transparent 65%)", top: -350, left: -250, zIndex: 0, pointerEvents: "none", filter: "blur(80px)", transform: `translateY(${(scrollY||0)*0.06}px)` }} />
      <div style={{ position: "fixed", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(140,0,255,0.15) 0%,transparent 65%)", bottom: -200, right: -200, zIndex: 0, pointerEvents: "none", filter: "blur(80px)" }} />
      <Nav scrollY={scrollY} />
      {children}
      <Footer />
    </div>
  );
}

// ══ FOOTER ═══════════════════════════════════════════════════════════
function Footer() {
  const navigate = useNavigate();
  const cols = [
    { title: "Product", links: [["Features","/"],["Pricing","/pricing"],["API Docs","/api-docs"],["Changelog","/"]] },
    { title: "Company", links: [["About","/about"],["Contact","/contact"],["Careers","/contact"],["Blog","/"]] },
    { title: "Legal",   links: [["Privacy","/"],[  "Terms","/"],[  "Security","/"],[  "GDPR","/"]] },
  ];
  return (
    <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(0,212,255,0.1)", background: "rgba(2,10,20,0.85)", backdropFilter: "blur(20px)", padding: "44px 24px 24px" }}>
      <style>{`
        .ft-top {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1fr;
          gap: 36px;
          margin-bottom: 36px;
        }
        .ft-links-row {
          display: contents;
        }
        .ft-bottom {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
          border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;
        }
        @media(max-width: 768px) {
          .ft-top {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          .ft-brand-col {
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .ft-links-mobile {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
          }
          .ft-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
          .ft-dash-btn {
            width: 100%;
            text-align: center;
            padding: 11px !important;
            justify-content: center;
          }
        }
        @media(max-width: 480px) {
          .ft-links-mobile {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="ft-top">
          {/* Brand */}
          <div className="ft-brand-col">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img src={LogoIcon} alt="logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
              <span style={{ fontWeight: 800, fontSize: "1rem", background: "linear-gradient(135deg,#f0f9ff,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Risklens</span>
            </div>
            <p style={{ fontSize: "0.81rem", color: "#3a6070", lineHeight: 1.7, maxWidth: 240 }}>
              The global standard for real-time sanctions screening and AML compliance.
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              {["SOC2","ISO27001","GDPR"].map(b => (
                <span key={b} style={{ padding: "3px 8px", borderRadius: 5, background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.15)", fontSize: "0.62rem", fontWeight: 700, color: "#00d4ff", fontFamily: "monospace" }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Links — desktop: separate cols, mobile: grid row */}
          <div className="ft-links-mobile" style={{ display: "contents" }}>
            {cols.map(col => (
              <div key={col.title}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#3a6070", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>{col.title}</div>
                {col.links.map(([label, path]) => (
                  <div key={label} onClick={() => navigate(path)}
                    style={{ fontSize: "0.82rem", color: "#4a7a96", marginBottom: 9, cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#00d4ff"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4a7a96"}>
                    {label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="ft-bottom">
          <span style={{ fontSize: "0.74rem", color: "#2a4050" }}>© 2026 Risklens API. All rights reserved.</span>
          <span style={{ fontFamily: "monospace", fontSize: "0.64rem", color: "#2a4050" }}>AML · Sanctions · PEP · KYC</span>
          <button className="ft-dash-btn" onClick={() => navigate("/login")}
            style={{ padding: "7px 16px", borderRadius: 8, background: "none", border: "1px solid rgba(0,212,255,0.15)", color: "#4a7a96", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.35)"; e.currentTarget.style.color = "#00d4ff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.15)"; e.currentTarget.style.color = "#4a7a96"; }}>
            Dashboard →
          </button>
        </div>
      </div>
    </footer>
  );
}

// ══ DATA ══════════════════════════════════════════════════════════════
const FEATURES = [
  { Icon: Zap,            title: "Real-Time Screening",   desc: "Sub-second sanctions screening against 7+ global lists using Elasticsearch.", color: "#00d4ff" },
  { Icon: Globe2,         title: "Global Sanctions Lists", desc: "OFAC, UN, EU, UK, Interpol, World Bank — synchronized and indexed.", color: "#8b5cf6" },
  { Icon: Brain,          title: "Smart Name Matching",   desc: "Arabic & English with phonetic matching, Google Translate & fuzzy search.", color: "#f59e0b" },
  { Icon: User,           title: "PEP Database",          desc: "Politically Exposed Persons via Wikidata with real-time enrichment.", color: "#10b981" },
  { Icon: ArrowLeftRight, title: "Transfer Screening",    desc: "Screen financial transfers — sender, receiver, amount — instantly.", color: "#ef4444" },
  { Icon: Bell,           title: "Webhooks & Alerts",     desc: "Instant notifications with HMAC signing and automatic retry logic.", color: "#f97316" },
  { Icon: Building2,      title: "Multi-Tenant",          desc: "Enterprise architecture with role-based access and API key management.", color: "#00d4ff" },
  { Icon: BarChart3,      title: "Monitoring & Audit",    desc: "Full audit trail, live dashboard, and automated system health alerts.", color: "#8b5cf6" },
];

const LISTS = [
  { name:"OFAC",       flag:<img src="https://flagcdn.com/w40/us.png" alt="US" style={{width:36,height:24,borderRadius:4,objectFit:"cover"}}/>, desc:"US Treasury",         color:"#ef4444" },
  { name:"UN",         flag:<img src="https://flagcdn.com/w40/un.png" alt="UN" style={{width:36,height:24,borderRadius:4,objectFit:"cover"}}/>, desc:"United Nations",      color:"#3b82f6" },
  { name:"EU",         flag:<img src="https://flagcdn.com/w40/eu.png" alt="EU" style={{width:36,height:24,borderRadius:4,objectFit:"cover"}}/>, desc:"European Union",      color:"#f59e0b" },
  { name:"UK",         flag:<img src="https://flagcdn.com/w40/gb.png" alt="GB" style={{width:36,height:24,borderRadius:4,objectFit:"cover"}}/>, desc:"HM Treasury",         color:"#8b5cf6" },
  { name:"Interpol",   flag:<img src="https://flagcdn.com/w40/fr.png" alt="FR" style={{width:36,height:24,borderRadius:4,objectFit:"cover"}}/>, desc:"International Police",color:"#ef4444" },
  { name:"World Bank", Icon:Scale,     desc:"Debarment List", color:"#10b981" },
  { name:"PEP",        Icon:UserCheck, desc:"Wikidata PEP",   color:"#a78bfa" },
  { name:"LOCAL",      Icon:Database,  desc:"Custom List",    color:"#00d4ff" },
];

// ══ ANIMATED BG ═══════════════════════════════════════════════════════
function AnimatedBG() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const onR = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", onR);

    const CITIES = [
      { name:"New York",  lat:40.7,  lon:-74.0, color:"#00d4ff" },
      { name:"London",    lat:51.5,  lon:-0.1,  color:"#a78bfa" },
      { name:"Dubai",     lat:25.2,  lon:55.3,  color:"#f59e0b" },
      { name:"Singapore", lat:1.3,   lon:103.8, color:"#10b981" },
      { name:"Tokyo",     lat:35.7,  lon:139.7, color:"#f97316" },
      { name:"Zurich",    lat:47.4,  lon:8.5,   color:"#00d4ff" },
      { name:"HongKong",  lat:22.3,  lon:114.2, color:"#ef4444" },
      { name:"Frankfurt", lat:50.1,  lon:8.7,   color:"#a78bfa" },
      { name:"Shanghai",  lat:31.2,  lon:121.5, color:"#10b981" },
      { name:"Riyadh",    lat:24.7,  lon:46.7,  color:"#f59e0b" },
    ];
    const TRANSFERS = [
      { from:0, to:1, amount:"$2.4M", risk:"LOW",  color:"#10b981", speed:0.0022 },
      { from:2, to:3, amount:"$850K", risk:"HIGH", color:"#ef4444", speed:0.0018 },
      { from:1, to:5, amount:"$1.2M", risk:"LOW",  color:"#10b981", speed:0.0025 },
      { from:3, to:4, amount:"$340K", risk:"MED",  color:"#f59e0b", speed:0.002  },
      { from:6, to:0, amount:"$5.1M", risk:"CRIT", color:"#ef4444", speed:0.0015 },
      { from:7, to:2, amount:"$920K", risk:"LOW",  color:"#10b981", speed:0.0028 },
      { from:8, to:9, amount:"$1.8M", risk:"MED",  color:"#f59e0b", speed:0.0019 },
      { from:0, to:9, amount:"$3.3M", risk:"HIGH", color:"#ef4444", speed:0.0021 },
    ];
    const particles = TRANSFERS.map((t, i) => ({ ...t, progress: i / TRANSFERS.length }));
    let rot = [20, -20, 0], projection = null, pathGen = null, countries = null, borders = null, graticule = null, raf;

    const getR = () => Math.min(W, H) * (W < 768 ? 0.42 : 0.38);

    const loadWorld = async () => {
      let attempts = 0;
      while ((!window.d3 || !window.topojson) && attempts < 50) {
        await new Promise(r => setTimeout(r, 100)); attempts++;
      }
      if (!window.d3 || !window.topojson) return startFallback();
      try {
        const world = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json());
        const d3 = window.d3, topojson = window.topojson;
        countries = topojson.feature(world, world.objects.countries);
        borders   = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
        graticule = d3.geoGraticule()();
        projection = d3.geoOrthographic().scale(getR()).translate([W/2, H/2]).rotate(rot).clipAngle(90);
        pathGen = d3.geoPath(projection, ctx);
        start();
      } catch(e) { startFallback(); }
    };

    const isVisible = (lon, lat) => {
      if (!projection) return false;
      const r = projection.rotate();
      const norm = ((lon - (-r[0]) + 180) % 360 + 360) % 360 - 180;
      return Math.abs(norm) < 90;
    };

    const geoToXY = (lat, lon) => {
      if (!projection) return { x:0, y:0, vis:false };
      const pt = projection([lon, lat]);
      return pt ? { x:pt[0], y:pt[1], vis:isVisible(lon,lat) } : { x:0, y:0, vis:false };
    };

    const arcPoints = (fromC, toC, steps=80) => {
      if (!window.d3 || !projection) return [];
      const interp = window.d3.geoInterpolate([fromC.lon,fromC.lat],[toC.lon,toC.lat]);
      return Array.from({length:steps+1},(_,i)=>{
        const [lon,lat]=interp(i/steps);
        const pt=projection([lon,lat]);
        return pt ? {x:pt[0],y:pt[1],vis:isVisible(lon,lat)} : null;
      });
    };

    const drawGlobe = () => {
      if (!pathGen||!countries) return;
      const curR = getR();
      projection.scale(curR).translate([W/2,H/2]);
      const ocean = ctx.createRadialGradient(W/2-curR*0.25,H/2-curR*0.25,0,W/2,H/2,curR);
      ocean.addColorStop(0,"#0d3a5c"); ocean.addColorStop(0.6,"#071e38"); ocean.addColorStop(1,"#030e1e");
      ctx.beginPath(); pathGen({type:"Sphere"}); ctx.fillStyle=ocean; ctx.fill();
      ctx.beginPath(); pathGen(countries); ctx.fillStyle="rgba(0,180,120,0.14)"; ctx.fill();
      ctx.beginPath(); pathGen(borders); ctx.strokeStyle="rgba(0,212,255,0.25)"; ctx.lineWidth=0.5; ctx.stroke();
      ctx.beginPath(); pathGen(graticule); ctx.strokeStyle="rgba(0,212,255,0.06)"; ctx.lineWidth=0.35; ctx.stroke();
      ctx.beginPath(); pathGen({type:"Sphere"}); ctx.strokeStyle="rgba(0,212,255,0.35)"; ctx.lineWidth=1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(W/2,H/2,curR+6,0,Math.PI*2); ctx.strokeStyle="rgba(0,212,255,0.08)"; ctx.lineWidth=10; ctx.stroke();
    };

    const drawTransfers = () => {
      particles.forEach(tr => {
        const from=CITIES[tr.from], to=CITIES[tr.to];
        const pts=arcPoints(from,to,80);
        if(!pts.length) return;
        ctx.beginPath(); let drawing=false;
        pts.forEach(p=>{if(!p||!p.vis){drawing=false;return;} drawing?ctx.lineTo(p.x,p.y):(ctx.moveTo(p.x,p.y),drawing=true);});
        ctx.strokeStyle=tr.color+"33"; ctx.lineWidth=1; ctx.stroke();
        const idx=Math.min(Math.floor((tr.progress%1)*pts.length),pts.length-1);
        const pt=pts[idx];
        if(pt&&pt.vis){
          const grd=ctx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,12);
          grd.addColorStop(0,tr.color+"aa"); grd.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(pt.x,pt.y,12,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
          ctx.beginPath(); ctx.arc(pt.x,pt.y,3.5,0,Math.PI*2); ctx.fillStyle=tr.color; ctx.fill();
          ctx.beginPath(); ctx.arc(pt.x,pt.y,1.5,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
          const t=tr.progress%1;
          if(t>0.3&&t<0.7&&W>480){
            ctx.font="bold 9px monospace"; ctx.fillStyle=tr.color; ctx.textAlign="center";
            ctx.fillText(tr.amount,pt.x,pt.y-14);
          }
        }
        tr.progress+=tr.speed;
      });
    };

    const drawCities = () => {
      const now=Date.now(), showLabel=W>600;
      CITIES.forEach((city,i)=>{
        const p=geoToXY(city.lat,city.lon);
        if(!p.vis) return;
        const pulse=((now/900)+i*0.45)%1;
        ctx.beginPath(); ctx.arc(p.x,p.y,5+pulse*12,0,Math.PI*2);
        ctx.strokeStyle=city.color+Math.floor((1-pulse)*70).toString(16).padStart(2,"0");
        ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fillStyle=city.color+"cc"; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,1.8,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
        if(showLabel){
          ctx.font="9px monospace"; ctx.fillStyle=city.color; ctx.textAlign="center";
          ctx.fillText(city.name,p.x,p.y-12);
        }
      });
    };

    const tick = () => {
      ctx.clearRect(0,0,W,H);
      rot[0]+=0.1;
      if(projection) projection.rotate(rot);
      drawGlobe(); drawTransfers(); drawCities();
      raf=requestAnimationFrame(tick);
    };

    const start = () => { raf=requestAnimationFrame(tick); };

    const startFallback = () => {
      const NODES=Array.from({length:24},()=>({
        x:Math.random()*W, y:Math.random()*H,
        vx:(Math.random()-0.5)*0.35, vy:(Math.random()-0.5)*0.35,
        r:Math.random()*2+1.5,
        color:["#00d4ff","#8b5cf6","#10b981","#f59e0b","#ef4444"][Math.floor(Math.random()*5)],
        p:Math.random()*Math.PI*2,
      }));
      const ft=()=>{
        ctx.clearRect(0,0,W,H);
        NODES.forEach(n=>{n.x+=n.vx;n.y+=n.vy;n.p+=0.02;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1;});
        for(let i=0;i<NODES.length;i++) for(let j=i+1;j<NODES.length;j++){
          const dx=NODES[i].x-NODES[j].x,dy=NODES[i].y-NODES[j].y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<190){ctx.beginPath();ctx.moveTo(NODES[i].x,NODES[i].y);ctx.lineTo(NODES[j].x,NODES[j].y);ctx.strokeStyle=`rgba(0,212,255,${(1-d/190)*0.1})`;ctx.lineWidth=0.6;ctx.stroke();}
        }
        NODES.forEach(n=>{
          const p=Math.sin(n.p)*0.5+0.5;
          const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*5);
          g.addColorStop(0,n.color+"1a");g.addColorStop(1,"transparent");
          ctx.beginPath();ctx.arc(n.x,n.y,n.r*5,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
          ctx.beginPath();ctx.arc(n.x,n.y,n.r*(0.8+p*0.4),0,Math.PI*2);ctx.fillStyle=n.color+"bb";ctx.fill();
        });
        raf=requestAnimationFrame(ft);
      };ft();
    };

    loadWorld();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",onR); };
  },[]);

  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:0.85,width:"100%",height:"100%"}}/>;
}

// ══ HOME PAGE ═════════════════════════════════════════════════════════
export function HomePage() {
  const navigate=useNavigate();
  const [scrollY,setScrollY]=useState(0);
  const [visible,setVisible]=useState({});
  const refs=useRef({});
  useEffect(()=>{const fn=()=>setScrollY(window.scrollY);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  useEffect(()=>{
    const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setVisible(v=>({...v,[e.target.id]:true}));}),{threshold:0.1});
    Object.values(refs.current).forEach(el=>el&&obs.observe(el));
    return()=>obs.disconnect();
  },[]);
  const r=id=>el=>{refs.current[id]=el;};
  const rv=id=>`lp-rv${visible[id]?" lp-in":""}`;
  const STATS=[
    {value:"7+",   label:"Sanctions Lists",  color:"#00d4ff"},
    {value:"500K+",label:"Screened Entities",color:"#8b5cf6"},
    {value:"<300ms",label:"Response Time",    color:"#10b981"},
    {value:"99.9%",label:"Uptime SLA",       color:"#f59e0b"},
  ];

  return (
    <PageBG scrollY={scrollY}>
      <AnimatedBG/>

      {/* Floating icons — desktop only */}
      {[
        {Icon:Shield,       x:"7%", y:"22%",s:26,c:"#00d4ff",d:0},
        {Icon:Lock,         x:"87%",y:"16%",s:20,c:"#8b5cf6",d:0.8},
        {Icon:AlertTriangle,x:"5%", y:"68%",s:22,c:"#f59e0b",d:1.5},
        {Icon:FileSearch,   x:"91%",y:"62%",s:24,c:"#10b981",d:0.4},
        {Icon:Globe2,       x:"14%",y:"44%",s:18,c:"#a78bfa",d:1.2},
        {Icon:Database,     x:"79%",y:"38%",s:20,c:"#00d4ff",d:2},
        {Icon:UserCheck,    x:"19%",y:"83%",s:22,c:"#ef4444",d:0.6},
        {Icon:Scale,        x:"74%",y:"78%",s:18,c:"#f97316",d:1.8},
      ].map(({Icon,x,y,s,c,d},i)=>(
        <div key={i} className="lp-float-icon" style={{position:"fixed",left:x,top:y,animation:`lpFloat ${3+i*0.4}s ease-in-out infinite`,animationDelay:`${d}s`,opacity:0.07,filter:`drop-shadow(0 0 8px ${c})`,zIndex:0,pointerEvents:"none"}}>
          <Icon size={s} color={c} strokeWidth={1.5}/>
        </div>
      ))}

      {/* Hero */}
<section style={{
  position:"relative", zIndex:1, minHeight:"100vh",
  display:"flex", flexDirection:"column",
  alignItems:"center", justifyContent:"center",
  textAlign:"center", padding:"120px 24px 80px",
  gap:0,
}}>

  {/* Badge — Live Status */}
  <div style={{
    display:"inline-flex", alignItems:"center", gap:8,
    padding:"6px 18px", borderRadius:100,
    background:"rgba(0,212,255,0.07)",
    border:"1px solid rgba(0,212,255,0.2)",
    fontSize:"0.68rem", color:"#00d4ff",
    fontFamily:"monospace", marginBottom:28,
    animation:"lpFu 0.6s ease both",
  }}>
    <div style={{width:7,height:7,borderRadius:"50%",background:"#00d4ff",
      boxShadow:"0 0 10px #00d4ff",animation:"lpPd 2s infinite"}}/>
    AML · Sanctions Screening · PEP Detection
  </div>

  {/* Main Title */}
  <h1 style={{margin:"0 0 20px",animation:"lpFu 0.9s 0.1s ease both"}}>
    <span style={{
      display:"block",
      background:"linear-gradient(90deg,#00d4ff 0%,#7c3aed 50%,#00d4ff 100%)",
      backgroundSize:"200%",
      WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
      animation:"lpGs 5s linear infinite",
      fontSize:"clamp(3rem,8vw,6.5rem)",
      fontWeight:900, letterSpacing:"-4px", lineHeight:0.95,
      marginBottom:14,
    }}>Risk Lens</span>

    <span style={{
      display:"block", color:"#f0f9ff",
      fontSize:"clamp(0.6rem,2.2vw,1.45rem)",
      fontWeight:500, letterSpacing:"0.3px",
      lineHeight:1.3, opacity:0.88,
    }}>
      Sanctions & AML Intelligence Platform
    </span>
  </h1>

  {/* Tagline */}
  <div style={{
    display:"flex", alignItems:"center", justifyContent:"center",
    gap:16, marginBottom:28,
    animation:"lpFu 0.9s 0.2s ease both",
  }}>
    {["Real-Time","AI-Powered","FATF Compliant"].map((t,i) => (
      <span key={i} style={{
        display:"flex", alignItems:"center", gap:i>0?16:0,
      }}>
        {i>0 && <span style={{color:"rgba(0,212,255,0.3)",fontSize:"0.7rem"}}>·</span>}
        <span style={{
          fontSize:"0.7rem", fontWeight:700,
          color:"rgba(0,212,255,0.65)",
          letterSpacing:"3px", textTransform:"uppercase",
          fontFamily:"monospace",
        }}>{t}</span>
      </span>
    ))}
  </div>

  {/* Description */}
  <p style={{
    fontSize:"clamp(0.88rem,1.6vw,1.05rem)",
    color:"#4a7a96", maxWidth:500, lineHeight:1.8,
    marginBottom:44, padding:"0 8px",
    animation:"lpFu 0.9s 0.25s ease both",
  }}>
    Real-time AML compliance powered by 7+ global sanctions lists,
    AI-powered Arabic & English name matching, and instant risk scoring
    — built for financial institutions.
  </p>
        <div style={{display:"flex",gap:12,alignItems:"center",justifyContent:"center",flexWrap:"wrap",marginBottom:60,animation:"lpFu 0.9s 0.35s ease both"}}>
          <button onClick={()=>navigate("/contact")} style={{padding:"13px 34px",borderRadius:10,fontSize:"0.92rem",fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#020c18",fontFamily:"inherit",boxShadow:"0 6px 26px rgba(0,212,255,0.3)",display:"flex",alignItems:"center",gap:8,transition:"all 0.25s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            <Key size={15}/> Get API Access
          </button>
          <button onClick={()=>navigate("/api-docs")} style={{padding:"13px 34px",borderRadius:10,fontSize:"0.92rem",fontWeight:600,cursor:"pointer",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",color:"#94b4c8",fontFamily:"inherit",transition:"all 0.25s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,212,255,0.35)";e.currentTarget.style.color="#00d4ff";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="#94b4c8";}}>
            View API Docs ↓
          </button>
        </div>
        {/* Stats */}
        <div className="lp-stats-grid" style={{width:"100%",maxWidth:860,border:"1px solid rgba(0,212,255,0.1)",borderRadius:16,overflow:"hidden",animation:"lpFu 0.9s 0.45s ease both",backdropFilter:"blur(10px)"}}>
          {STATS.map(s=>(
            <div key={s.label} style={{background:"rgba(5,15,28,0.85)",padding:"22px 14px",textAlign:"center",borderRight:"1px solid rgba(0,212,255,0.08)",transition:"background 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,212,255,0.06)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(5,15,28,0.85)"}>
              <div style={{fontSize:"clamp(1.3rem,4vw,2.1rem)",fontWeight:800,marginBottom:5,fontFamily:"monospace",color:s.color}}>{s.value}</div>
              <div style={{fontSize:"clamp(0.58rem,1.2vw,0.68rem)",color:"#3a6070",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.8px"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="feat" style={{position:"relative",zIndex:1,padding:"72px 0"}}>
        <div style={{maxWidth:1180,margin:"0 auto",padding:"0 20px"}}>
          <div id="fh" ref={r("fh")} className={rv("fh")}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:6,background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",fontFamily:"monospace",fontSize:"0.66rem",fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"1.1px",marginBottom:14}}>✦ Features</div>
            <h2 style={{fontSize:"clamp(1.7rem,4vw,3.1rem)",fontWeight:800,letterSpacing:"-1px",lineHeight:1.08,marginBottom:12}}>Everything you need for<br/><span style={{color:"#00d4ff"}}>AML Compliance</span></h2>
            <p style={{fontSize:"0.92rem",color:"#4a7a96",maxWidth:500,lineHeight:1.75}}>A complete API-first platform — real-time screening, case management, audit trails, and multi-tenant access.</p>
          </div>
          <div className="lp-feat-grid">
            {FEATURES.map((f,i)=>(
              <div key={f.title} id={`f${i}`} ref={r(`f${i}`)} className={rv(`f${i}`)}
                style={{background:"rgba(5,15,28,0.8)",border:"1px solid rgba(0,212,255,0.08)",borderRadius:16,padding:"22px 18px",transition:"all 0.3s",position:"relative",overflow:"hidden",backdropFilter:"blur(8px)",transitionDelay:`${(i%4)*0.07}s`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.borderColor="rgba(0,212,255,0.18)";e.currentTarget.querySelector(".feat-line").style.transform="scaleX(1)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="rgba(0,212,255,0.08)";e.currentTarget.querySelector(".feat-line").style.transform="scaleX(0)";}}>
                <div className="feat-line" style={{position:"absolute",top:0,left:0,right:0,height:1,background:f.color,transform:"scaleX(0)",transformOrigin:"left",transition:"transform 0.35s ease"}}/>
                <div style={{width:42,height:42,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,border:"1px solid rgba(255,255,255,0.06)",background:`${f.color}14`}}>
                  <f.Icon size={19} color={f.color} strokeWidth={1.8}/>
                </div>
                <div style={{fontSize:"0.95rem",fontWeight:700,marginBottom:8,color:"#f0f9ff"}}>{f.title}</div>
                <div style={{fontSize:"0.8rem",color:"#4a7a96",lineHeight:1.65}}>{f.desc}</div>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:13,fontSize:"0.66rem",fontWeight:600,fontFamily:"monospace",color:f.color}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:f.color}}/>Active
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sanctions Lists */}
      <section style={{position:"relative",zIndex:1,padding:"72px 0",background:"rgba(0,40,80,0.06)",borderTop:"1px solid rgba(0,212,255,0.07)",borderBottom:"1px solid rgba(0,212,255,0.07)"}}>
        <div style={{maxWidth:1180,margin:"0 auto",padding:"0 20px"}}>
          <div id="lh" ref={r("lh")} className={rv("lh")} style={{textAlign:"center"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:6,background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",fontFamily:"monospace",fontSize:"0.66rem",fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"1.1px",margin:"0 auto 14px"}}>✦ Data Sources</div>
            <h2 style={{fontSize:"clamp(1.7rem,4vw,3.1rem)",fontWeight:800,letterSpacing:"-1px",marginBottom:12}}>8 Integrated Sanctions Lists</h2>
            <p style={{fontSize:"0.92rem",color:"#4a7a96",maxWidth:500,lineHeight:1.75,margin:"0 auto"}}>All major international databases synchronized and indexed for real-time lookups.</p>
          </div>
          <div className="lp-lists-grid">
            {LISTS.map((l,i)=>{const LI=l.Icon;return(
              <div key={l.name} id={`l${i}`} ref={r(`l${i}`)} className={rv(`l${i}`)}
                style={{background:"rgba(5,15,28,0.8)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px 12px",textAlign:"center",transition:"all 0.25s",transitionDelay:`${i*0.06}s`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="rgba(0,212,255,0.15)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";}}>
                <div style={{height:34,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:9,color:l.color,filter:`drop-shadow(0 0 6px ${l.color}44)`}}>
                  {l.flag?l.flag:<LI size={26} strokeWidth={1.6}/>}
                </div>
                <div style={{fontSize:"0.74rem",fontWeight:700,marginBottom:3,fontFamily:"monospace",color:l.color}}>{l.name}</div>
                <div style={{fontSize:"0.66rem",color:"#3a6070"}}>{l.desc}</div>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{position:"relative",zIndex:1,padding:"60px 0 90px"}}>
        <div style={{maxWidth:880,margin:"0 auto",padding:"0 20px"}}>
          <div id="cta" ref={r("cta")} className={rv("cta")}
            style={{background:"rgba(5,15,28,0.92)",backdropFilter:"blur(16px)",border:"1px solid rgba(0,212,255,0.12)",borderRadius:24,padding:"56px 28px",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 50% 110%,rgba(0,212,255,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <h2 style={{fontSize:"clamp(1.7rem,5vw,3.8rem)",fontWeight:800,letterSpacing:"-1.5px",lineHeight:1.05,marginBottom:16}}>
                Start screening in<br/>
                <span style={{background:"linear-gradient(90deg,#00d4ff,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>minutes, not months</span>
              </h2>
              <p style={{fontSize:"0.96rem",color:"#4a7a96",marginBottom:38,lineHeight:1.75,maxWidth:480,margin:"0 auto 38px"}}>
                Get your API key today and integrate real-time sanctions screening into your system in minutes.
              </p>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>navigate("/contact")} style={{padding:"13px 40px",borderRadius:10,fontSize:"0.95rem",fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#020c18",fontFamily:"inherit",boxShadow:"0 6px 26px rgba(0,212,255,0.3)",display:"flex",alignItems:"center",gap:8,transition:"all 0.25s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <Key size={15}/> Request API Key
                </button>
                <button onClick={()=>navigate("/pricing")} style={{padding:"13px 34px",borderRadius:10,fontSize:"0.95rem",fontWeight:600,cursor:"pointer",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",color:"#94b4c8",fontFamily:"inherit",transition:"all 0.25s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,212,255,0.35)";e.currentTarget.style.color="#00d4ff";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="#94b4c8";}}>
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageBG>
  );
}

// ══ PRICING PAGE ══════════════════════════════════════════════════════
export function PricingPage() {
  const navigate=useNavigate();
  const [scrollY,setScrollY]=useState(0);
  useEffect(()=>{const fn=()=>setScrollY(window.scrollY);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  const plans=[
    {name:"Starter",      price:"$299",   period:"/mo",desc:"Perfect for startups and small compliance teams.",                   color:"#00d4ff",popular:false,features:["10,000 API calls/month","OFAC + UN + EU lists","Basic name matching","REST API access","Email support","99.9% SLA"]},
    {name:"Professional", price:"$899",   period:"/mo",desc:"For growing fintechs with high screening volume.",                  color:"#7c3aed",popular:true, features:["100,000 API calls/month","All 8 sanctions lists","Smart name matching + Arabic","PEP database access","Webhook notifications","Transfer screening","Priority support","Advanced analytics"]},
    {name:"Enterprise",   price:"Custom", period:"",   desc:"Unlimited screening for large financial institutions.",              color:"#10b981",popular:false,features:["Unlimited API calls","All features included","Custom list integration","Dedicated infrastructure","SLA 99.99%","24/7 phone support","Custom integrations","Audit & compliance reports","On-premise option"]},
  ];
  return (
    <PageBG scrollY={scrollY}>
      <div style={{position:"relative",zIndex:1,padding:"120px 20px 90px",maxWidth:1180,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:6,background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",fontFamily:"monospace",fontSize:"0.66rem",fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"1.1px",marginBottom:14}}>✦ Pricing</div>
          <h1 style={{fontSize:"clamp(1.9rem,5vw,4rem)",fontWeight:800,letterSpacing:"-1.5px",marginBottom:14,lineHeight:1.05}}>
            Simple, transparent<br/><span style={{background:"linear-gradient(90deg,#00d4ff,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>API pricing</span>
          </h1>
          <p style={{fontSize:"0.97rem",color:"#4a7a96",maxWidth:500,margin:"0 auto",lineHeight:1.75}}>Pay only for what you use. No hidden fees. Cancel anytime.</p>
        </div>
        <div className="pricing-grid">
          {plans.map(p=>(
            <div key={p.name} style={{background:"rgba(5,15,28,0.9)",backdropFilter:"blur(12px)",border:`1px solid ${p.popular?"rgba(124,58,237,0.4)":"rgba(255,255,255,0.07)"}`,borderRadius:20,padding:"32px 24px",position:"relative",transition:"transform 0.25s",boxShadow:p.popular?"0 0 40px rgba(124,58,237,0.15)":"none"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-6px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              {p.popular&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",padding:"4px 16px",borderRadius:100,background:"linear-gradient(135deg,#7c3aed,#00d4ff)",fontSize:"0.68rem",fontWeight:700,color:"#f0f9ff",fontFamily:"monospace",whiteSpace:"nowrap"}}>⭐ MOST POPULAR</div>}
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${p.color},transparent)`,borderRadius:"20px 20px 0 0"}}/>
              <div style={{fontSize:"0.8rem",fontWeight:700,color:p.color,fontFamily:"monospace",marginBottom:7,textTransform:"uppercase",letterSpacing:"1px"}}>{p.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:9}}>
                <span style={{fontSize:"2.5rem",fontWeight:800,color:"#f0f9ff",letterSpacing:"-1px"}}>{p.price}</span>
                <span style={{fontSize:"0.88rem",color:"#4a7a96"}}>{p.period}</span>
              </div>
              <p style={{fontSize:"0.82rem",color:"#4a7a96",marginBottom:22,lineHeight:1.6}}>{p.desc}</p>
              <button onClick={()=>navigate("/contact")} style={{width:"100%",padding:"11px",borderRadius:10,fontWeight:700,fontSize:"0.87rem",cursor:"pointer",border:"none",fontFamily:"inherit",background:p.popular?"linear-gradient(135deg,#7c3aed,#00d4ff)":"rgba(255,255,255,0.05)",color:p.popular?"#f0f9ff":p.color,marginBottom:22,transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                {p.name==="Enterprise"?"Contact Sales →":"Get Started →"}
              </button>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:20}}>
                {p.features.map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}>
                    <CheckCircle size={13} color={p.color} strokeWidth={2}/>
                    <span style={{fontSize:"0.8rem",color:"#94b4c8"}}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(5,15,28,0.8)",border:"1px solid rgba(0,212,255,0.1)",borderRadius:20,padding:"32px 24px",backdropFilter:"blur(12px)"}}>
          <h3 style={{fontSize:"1.35rem",fontWeight:800,marginBottom:7}}>Pay-as-you-go overage</h3>
          <p style={{color:"#4a7a96",marginBottom:24,fontSize:"0.87rem"}}>Exceed your plan? We charge per API call with no surprises.</p>
          <div className="payg-grid">
            {[{tier:"1–100K calls",price:"$0.003 / call",color:"#00d4ff"},{tier:"100K–1M calls",price:"$0.002 / call",color:"#8b5cf6"},{tier:"1M+ calls",price:"$0.001 / call",color:"#10b981"}].map(t=>(
              <div key={t.tier} style={{background:"rgba(3,12,24,0.8)",border:`1px solid ${t.color}22`,borderRadius:12,padding:"18px 20px",textAlign:"center"}}>
                <div style={{fontSize:"0.7rem",color:"#4a7a96",fontFamily:"monospace",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.8px"}}>{t.tier}</div>
                <div style={{fontSize:"1.35rem",fontWeight:800,color:t.color,fontFamily:"monospace"}}>{t.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageBG>
  );
}

// ══ API DOCS PAGE ═════════════════════════════════════════════════════
export function ApiDocsPage() {
  const [scrollY,setScrollY]=useState(0);
  const [active,setActive]=useState("screen");
  const [showSidebar,setShowSidebar]=useState(false);
  useEffect(()=>{const fn=()=>setScrollY(window.scrollY);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);

  const endpoints=[
    {id:"screen",  method:"POST",path:"/v1/screen",          desc:"Screen a person or entity against 7+ sanctions lists"},
    {id:"transfer",method:"POST",path:"/v1/transfer/screen", desc:"Screen a full financial transfer with FATF country risk"},
    {id:"search",  method:"GET", path:"/v1/search",          desc:"Direct search across all sanctions databases"},
    {id:"lists",   method:"GET", path:"/v1/lists",           desc:"Retrieve metadata for all active sanctions lists"},
    {id:"webhooks",method:"POST",path:"/v1/webhooks",        desc:"Register webhook for real-time HIGH/CRITICAL alerts"},
  ];

  const examples={
    screen:{
      req:`POST /api/v1/screen
Authorization: Bearer ak_live_xxxxxxxxxxxx
Content-Type: application/json

{
  "name":      "Maher Al-Assad",
  "nameAr":    "ماهر الأسد",
  "country":   "SY",
  "threshold": 0.75
}`,
      res:`{
  "id":           1234,
  "riskLevel":    "CRITICAL",
  "riskPoints":   150.0,
  "notes":        "Auto BLOCKED — Immediate action required",
  "matches": [
    {
      "matchedName": "Maher AL-ASSAD",
      "source":      "OFAC | EU | UK | PEP",
      "matchScore":  100.0,
      "riskPoints":  150.0,
      "isPep":       true,
      "wikidataId":  "Q6737407"
    }
  ],
  "createdAt":    "2026-05-08T00:39:38Z",
  "processingMs": 23
}`,
    },
    transfer:{
      req:`POST /api/v1/transfer/screen
Authorization: Bearer ak_live_xxxxxxxxxxxx
Content-Type: application/json

{
  "senderName":    "Ahmad Ali",
  "senderNameAr":  "أحمد علي",
  "receiverName":  "Mohammed Hassan",
  "receiverNameAr":"محمد حسن",
  "amount":        50000,
  "currency":      "USD",
  "country":       "IR"
}`,
      res:`{
  "reference":    "SCR-20260508-00081",
  "action":       "BLOCK",
  "riskLevel":    "CRITICAL",
  "riskPoints":   200,
  "reason":       "Sender matched 1 sanction record(s). Total risk points: 200.",
  "matches": [
    {
      "party":       "SENDER",
      "matchedName": "Ahmad Ali Al-Rashid",
      "source":      "OFAC",
      "score":       94.4
    },
    {
      "party":       "SENDER",
      "matchedName": "Country Risk: IR [CRITICAL]",
      "source":      "FATF",
      "score":       100.0
    }
  ],
  "processingMs": 45
}`,
    },
    search:{
      req:`GET /api/v1/search?q=Bashar+Al-Assad&threshold=0.80&page=0&size=10
Authorization: Bearer ak_live_xxxxxxxxxxxx`,
      res:`[
  {
    "id":             "uuid-xxx",
    "name":           "Bashar AL-ASSAD",
    "source":         "OFAC | EU | UN | UK | PEP",
    "score":          100.0,
    "nameSimilarity": 100.0,
    "wikidataId":     "Q41108"
  }
]`,
    },
    lists:{
      req:`GET /api/v1/lists
Authorization: Bearer ak_live_xxxxxxxxxxxx`,
      res:`[
  { "source": "OFAC",       "count": 15420, "lastSync": "2026-05-08" },
  { "source": "UN",         "count": 8310,  "lastSync": "2026-05-07" },
  { "source": "EU",         "count": 11280, "lastSync": "2026-05-08" },
  { "source": "UK",         "count": 9870,  "lastSync": "2026-05-08" },
  { "source": "INTERPOL",   "count": 6540,  "lastSync": "2026-05-06" },
  { "source": "WORLD_BANK", "count": 3210,  "lastSync": "2026-05-01" },
  { "source": "PEP",        "count": 982400,"lastSync": "2026-05-07" }
]`,
    },
    webhooks:{
      req:`POST /api/v1/webhooks
Authorization: Bearer ak_live_xxxxxxxxxxxx
Content-Type: application/json

{
  "url":    "https://your-system.com/webhook",
  "events": ["screening.critical","screening.high","transfer.high_risk"],
  "secret": "your_webhook_secret"
}`,
      res:`// Webhook Payload (POST to your URL)
{
  "event":       "screening.critical",
  "personName":  "Bashar Al-Assad",
  "riskLevel":   "CRITICAL",
  "screeningId": 1234,
  "timestamp":   "2026-05-08T00:39:38Z"
}

// Verify signature
X-Signature: sha256=hmac_sha256(secret, payload)`,
    },
  };

  const activeEx = examples[active] || examples.screen;

  const preStyle = {
    padding:"18px 20px", fontSize:"0.76rem", color:"#94b4c8",
    fontFamily:"'JetBrains Mono',monospace", lineHeight:1.75,
    margin:0, overflowX:"auto", whiteSpace:"pre-wrap", wordBreak:"break-word",
  };

  const METHOD_COLOR = {
    POST:{ bg:"rgba(0,212,255,0.12)", color:"#00d4ff" },
    GET: { bg:"rgba(16,185,129,0.12)",color:"#10b981" },
  };

  return (
    <PageBG scrollY={scrollY}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        .api-layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
        .api-sidebar-toggle { display: none !important; }
        .api-ep:hover { background: rgba(0,212,255,0.06) !important; border-color: rgba(0,212,255,0.15) !important; }
        @media(max-width:900px) {
          .api-layout { grid-template-columns: 1fr !important; }
          .api-sidebar { display: none !important; }
          .api-sidebar.open { display: block !important; }
          .api-sidebar-toggle { display: flex !important; }
        }
      `}</style>

      <div style={{position:"relative",zIndex:1,padding:"100px 0 90px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px"}}>

          {/* ── Header ── */}
          <div style={{marginBottom:48}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",
              borderRadius:6,background:"rgba(124,58,237,0.12)",
              border:"1px solid rgba(124,58,237,0.25)",fontFamily:"monospace",
              fontSize:"0.66rem",fontWeight:700,color:"#a78bfa",
              textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16}}>
              ✦ API Reference v1
            </div>

            <h1 style={{fontSize:"clamp(2rem,5vw,3.6rem)",fontWeight:800,
              letterSpacing:"-1.5px",marginBottom:14,lineHeight:1.05}}>
              Simple, Fast &<br/>
              <span style={{background:"linear-gradient(90deg,#00d4ff,#7c3aed)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                Reliable REST API
              </span>
            </h1>

            <p style={{fontSize:"0.95rem",color:"#4a7a96",maxWidth:520,
              lineHeight:1.8,marginBottom:24}}>
              Integrate real-time sanctions screening into your platform in minutes.
              Supports Arabic & English name matching, FATF country risk,
              PEP detection, and instant Webhook alerts.
            </p>

            {/* Meta badges */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[
                {label:"Base URL",  val:"api.risklens.io/v1", c:"#00d4ff"},
                {label:"Auth",      val:"Bearer Token",        c:"#8b5cf6"},
                {label:"Format",    val:"JSON",                c:"#10b981"},
                {label:"Latency",   val:"< 50ms",              c:"#f59e0b"},
                {label:"Uptime",    val:"99.9% SLA",           c:"#ef4444"},
              ].map(i=>(
                <div key={i.label} style={{padding:"8px 14px",borderRadius:9,
                  background:"rgba(5,15,28,0.85)",
                  border:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:"0.58rem",color:"#3a6070",fontFamily:"monospace",
                    textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>{i.label}</div>
                  <div style={{fontSize:"0.78rem",fontWeight:700,color:i.c,
                    fontFamily:"monospace"}}>{i.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mobile Toggle ── */}
          <button className="api-sidebar-toggle"
            onClick={()=>setShowSidebar(!showSidebar)}
            style={{width:"100%",padding:"11px 16px",borderRadius:10,marginBottom:12,
              background:"rgba(5,15,28,0.85)",border:"1px solid rgba(0,212,255,0.2)",
              color:"#00d4ff",fontFamily:"monospace",fontSize:"0.8rem",fontWeight:700,
              cursor:"pointer",alignItems:"center",justifyContent:"space-between"}}>
            <span>ENDPOINTS</span>
            <span style={{fontSize:"0.7rem",color:"#4a7a96"}}>
              {active} {showSidebar?"▲":"▼"}
            </span>
          </button>

          <div className="api-layout">

            {/* ── Sidebar ── */}
            <div className={`api-sidebar${showSidebar?" open":""}`}
              style={{background:"rgba(5,15,28,0.85)",
                border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16,padding:16,backdropFilter:"blur(8px)",
                height:"fit-content",position:"sticky",top:90}}>

              <div style={{fontSize:"0.62rem",fontWeight:700,color:"#3a6070",
                textTransform:"uppercase",letterSpacing:"1.2px",marginBottom:12}}>
                Endpoints
              </div>

              {endpoints.map(ep=>{
                const mc = METHOD_COLOR[ep.method];
                const isActive = active===ep.id;
                return (
                  <div key={ep.id} className="api-ep"
                    onClick={()=>{setActive(ep.id);setShowSidebar(false);}}
                    style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",
                      marginBottom:6,transition:"all 0.2s",
                      background:isActive?"rgba(0,212,255,0.07)":"transparent",
                      border:isActive?"1px solid rgba(0,212,255,0.2)":"1px solid transparent"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <span style={{fontSize:"0.58rem",fontFamily:"monospace",fontWeight:700,
                        padding:"2px 6px",borderRadius:4,
                        background:mc.bg,color:mc.color,flexShrink:0}}>
                        {ep.method}
                      </span>
                      <span style={{fontSize:"0.68rem",fontFamily:"monospace",
                        color:isActive?"#00d4ff":"#4a7a96",wordBreak:"break-all"}}>
                        {ep.path}
                      </span>
                    </div>
                    <div style={{fontSize:"0.66rem",color:"#3a6070",lineHeight:1.45}}>
                      {ep.desc}
                    </div>
                  </div>
                );
              })}

              {/* Auth note */}
              <div style={{marginTop:16,padding:"12px",borderRadius:10,
                background:"rgba(124,58,237,0.08)",
                border:"1px solid rgba(124,58,237,0.2)"}}>
                <div style={{fontSize:"0.62rem",fontWeight:700,color:"#a78bfa",
                  marginBottom:6,textTransform:"uppercase",letterSpacing:"1px"}}>
                  Authentication
                </div>
                <div style={{fontSize:"0.68rem",fontFamily:"monospace",
                  color:"#6a7a9a",lineHeight:1.6}}>
                  Authorization:<br/>
                  <span style={{color:"#a78bfa"}}>Bearer ak_live_xxx</span>
                </div>
              </div>

              {/* Error codes */}
              <div style={{marginTop:10,padding:"12px",borderRadius:10,
                background:"rgba(5,15,28,0.6)",
                border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:"0.62rem",fontWeight:700,color:"#3a6070",
                  marginBottom:8,textTransform:"uppercase",letterSpacing:"1px"}}>
                  HTTP Status
                </div>
                {[
                  ["200","Success",     "#10b981"],
                  ["400","Bad Request", "#f59e0b"],
                  ["401","Unauthorized","#ef4444"],
                  ["403","Rate Limited","#ef4444"],
                  ["500","Server Error","#6a7a9a"],
                ].map(([code,label,color])=>(
                  <div key={code} style={{display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:"0.66rem",fontFamily:"monospace",
                      fontWeight:700,color}}>{code}</span>
                    <span style={{fontSize:"0.64rem",color:"#3a6070"}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Code Panels ── */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>

              {/* Request */}
              <div style={{background:"rgba(3,10,22,0.97)",
                border:"1px solid rgba(0,212,255,0.12)",borderRadius:16,overflow:"hidden"}}>
                <div style={{padding:"11px 18px",borderBottom:"1px solid rgba(255,255,255,0.05)",
                  display:"flex",alignItems:"center",gap:8}}>
                  <Terminal size={12} color="#00d4ff"/>
                  <span style={{fontSize:"0.68rem",fontWeight:700,color:"#3a6070",
                    fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"1px"}}>
                    Request
                  </span>
                  <span style={{marginLeft:"auto",padding:"2px 8px",borderRadius:5,
                    background:METHOD_COLOR[endpoints.find(e=>e.id===active)?.method||"POST"].bg,
                    fontSize:"0.62rem",fontWeight:700,
                    color:METHOD_COLOR[endpoints.find(e=>e.id===active)?.method||"POST"].color,
                    fontFamily:"monospace"}}>
                    {endpoints.find(e=>e.id===active)?.method} {endpoints.find(e=>e.id===active)?.path}
                  </span>
                </div>
                <pre style={preStyle}>{activeEx.req}</pre>
              </div>

              {/* Response */}
              <div style={{background:"rgba(3,10,22,0.97)",
                border:"1px solid rgba(16,185,129,0.12)",borderRadius:16,overflow:"hidden"}}>
                <div style={{padding:"11px 18px",borderBottom:"1px solid rgba(255,255,255,0.05)",
                  display:"flex",alignItems:"center",gap:8}}>
                  <Activity size={12} color="#10b981"/>
                  <span style={{fontSize:"0.68rem",fontWeight:700,color:"#3a6070",
                    fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"1px"}}>
                    Response
                  </span>
                  <span style={{marginLeft:"auto",padding:"2px 8px",borderRadius:5,
                    background:"rgba(16,185,129,0.12)",fontSize:"0.62rem",fontWeight:700,
                    color:"#10b981",fontFamily:"monospace"}}>200 OK</span>
                </div>
                <pre style={preStyle}>{activeEx.res}</pre>
              </div>

              {/* Quick Start */}
              <div style={{background:"rgba(5,15,28,0.85)",
                border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16,padding:"22px",backdropFilter:"blur(8px)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                  <Code2 size={15} color="#8b5cf6"/>
                  <h3 style={{fontSize:"0.95rem",fontWeight:700,margin:0}}>
                    Quick Start — JavaScript
                  </h3>
                </div>
                <pre style={{...preStyle,background:"rgba(3,10,22,0.9)",
                  padding:"16px 18px",borderRadius:12,lineHeight:1.85,fontSize:"0.75rem"}}>{
`import RiskLens from '@risklens/client';

const client = new RiskLens({
  apiKey: 'ak_live_xxxxxxxxxxxx',
  baseUrl: 'https://api.risklens.io/v1',
});

// Screen a person
const result = await client.screen({
  name:      'Maher Al-Assad',
  nameAr:    'ماهر الأسد',
  country:   'SY',
  threshold: 0.75,
});

console.log(result.riskLevel);   // "CRITICAL"
console.log(result.riskPoints);  // 150.0
console.log(result.matches[0].source); // "OFAC | EU | UK | PEP"

// Screen a transfer
const transfer = await client.transfer.screen({
  senderName:   'Ahmad Ali',
  receiverName: 'Mohammed Hassan',
  amount:       50000,
  currency:     'USD',
  country:      'IR',
});

console.log(transfer.action);    // "BLOCK"
console.log(transfer.reference); // "SCR-20260508-00081"`}
                </pre>

                <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
                  {[
                    {lang:"Python",   color:"#3b82f6"},
                    {lang:"Java",     color:"#f59e0b"},
                    {lang:"PHP",      color:"#8b5cf6"},
                    {lang:"cURL",     color:"#10b981"},
                  ].map(l=>(
                    <div key={l.lang} style={{padding:"5px 14px",borderRadius:7,
                      background:"rgba(5,15,28,0.8)",
                      border:`1px solid ${l.color}22`,
                      fontSize:"0.7rem",fontWeight:600,color:`${l.color}99`,
                      fontFamily:"monospace",cursor:"pointer"}}>
                      {l.lang}
                    </div>
                  ))}
                  <span style={{fontSize:"0.68rem",color:"#3a6070",
                    alignSelf:"center",marginLeft:4}}>
                    — coming soon
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageBG>
  );
}
// ══ ABOUT PAGE ════════════════════════════════════════════════════════
export function AboutPage() {
  const [scrollY,setScrollY]=useState(0);
  useEffect(()=>{const fn=()=>setScrollY(window.scrollY);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  const milestones=[
    {year:"2021",title:"Founded",         desc:"Started as an internal compliance tool for a regional bank."},
    {year:"2022",title:"API Launch",      desc:"Opened the API to external developers with OFAC + UN support."},
    {year:"2023",title:"PEP & Interpol",  desc:"Added Wikidata PEP database and Interpol Red Notice integration."},
    {year:"2024",title:"Arabic NLP",      desc:"Built proprietary Arabic name matching with phonetic algorithms."},
    {year:"2025",title:"World Bank",      desc:"Added World Bank debarment list and transfer screening module."},
    {year:"2026",title:"Enterprise Scale",desc:"500K+ entities screened monthly across 20+ financial institutions."},
  ];
  const values=[
    {Icon:Shield,   title:"Security First",  desc:"Every API call is encrypted, audited, and compliant with international standards.", color:"#00d4ff"},
    {Icon:Cpu,      title:"API-First Design", desc:"Built by developers, for developers. Clean REST API with comprehensive docs.",      color:"#8b5cf6"},
    {Icon:Globe2,   title:"Global Coverage",  desc:"We track every major international sanctions list in real-time, 24/7.",            color:"#10b981"},
    {Icon:Activity, title:"Always Accurate",  desc:"Daily sync with all data sources ensures you always screen against current data.", color:"#f59e0b"},
  ];
  return (
    <PageBG scrollY={scrollY}>
      <div style={{position:"relative",zIndex:1,padding:"110px 20px 90px",maxWidth:1180,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:72}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:6,background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",fontFamily:"monospace",fontSize:"0.66rem",fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"1.1px",marginBottom:14}}>✦ About</div>
          <h1 style={{fontSize:"clamp(1.9rem,5vw,4rem)",fontWeight:800,letterSpacing:"-1.5px",marginBottom:16,lineHeight:1.05}}>
            Built to protect the<br/><span style={{background:"linear-gradient(90deg,#00d4ff,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>global financial system</span>
          </h1>
          <p style={{fontSize:"0.97rem",color:"#4a7a96",maxWidth:600,margin:"0 auto",lineHeight:1.8}}>
            Risklens API was born from a simple frustration: existing compliance tools were slow, expensive, and built for lawyers — not engineers. We built the API-first alternative.
          </p>
        </div>
        <div className="about-stats">
          {[{v:"500K+",l:"API Calls/Month",c:"#00d4ff"},{v:"8",l:"Sanctions Lists",c:"#8b5cf6"},{v:"20+",l:"Financial Clients",c:"#10b981"},{v:"<300ms",l:"Avg Response",c:"#f59e0b"}].map(s=>(
            <div key={s.l} style={{background:"rgba(5,15,28,0.8)",border:`1px solid ${s.c}18`,borderRadius:16,padding:"24px 16px",textAlign:"center",backdropFilter:"blur(8px)"}}>
              <div style={{fontSize:"clamp(1.6rem,4vw,2.4rem)",fontWeight:800,color:s.c,fontFamily:"monospace",marginBottom:7}}>{s.v}</div>
              <div style={{fontSize:"0.7rem",color:"#3a6070",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px"}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:72}}>
          <h2 style={{fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:800,letterSpacing:"-0.5px",marginBottom:32}}>Our principles</h2>
          <div className="about-values">
            {values.map(v=>(
              <div key={v.title} style={{background:"rgba(5,15,28,0.8)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"24px 20px",backdropFilter:"blur(8px)",display:"flex",gap:15,transition:"transform 0.25s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                <div style={{width:40,height:40,borderRadius:11,background:`${v.color}14`,border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <v.Icon size={18} color={v.color} strokeWidth={1.8}/>
                </div>
                <div>
                  <div style={{fontSize:"0.95rem",fontWeight:700,marginBottom:6,color:"#f0f9ff"}}>{v.title}</div>
                  <div style={{fontSize:"0.81rem",color:"#4a7a96",lineHeight:1.65}}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 style={{fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:800,letterSpacing:"-0.5px",marginBottom:40}}>Our journey</h2>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:70,top:0,bottom:0,width:1,background:"rgba(0,212,255,0.15)"}}/>
            {milestones.map((m,i)=>(
              <div key={m.year} style={{display:"flex",gap:20,marginBottom:28,alignItems:"flex-start"}}>
                <div style={{width:70,textAlign:"right",flexShrink:0}}>
                  <span style={{fontFamily:"monospace",fontSize:"0.78rem",fontWeight:700,color:"#00d4ff"}}>{m.year}</span>
                </div>
                <div style={{width:11,height:11,borderRadius:"50%",background:"#00d4ff",boxShadow:"0 0 12px rgba(0,212,255,0.5)",flexShrink:0,marginTop:4,position:"relative",zIndex:1}}/>
                <div style={{background:"rgba(5,15,28,0.8)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"13px 16px",flex:1,backdropFilter:"blur(8px)"}}>
                  <div style={{fontSize:"0.92rem",fontWeight:700,marginBottom:4,color:"#f0f9ff"}}>{m.title}</div>
                  <div style={{fontSize:"0.79rem",color:"#4a7a96",lineHeight:1.6}}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageBG>
  );
}

// ══ CONTACT PAGE ══════════════════════════════════════════════════════
export function ContactPage() {
  const [scrollY,setScrollY]=useState(0);
  const [form,setForm]=useState({name:"",email:"",company:"",message:"",type:"demo"});
  const [sent,setSent]=useState(false);
  useEffect(()=>{const fn=()=>setScrollY(window.scrollY);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  const handleSubmit=e=>{e.preventDefault();setSent(true);};
  return (
    <PageBG scrollY={scrollY}>
      <div style={{position:"relative",zIndex:1,padding:"110px 20px 90px",maxWidth:1100,margin:"0 auto"}}>
        <div className="contact-grid">
          {/* Left info */}
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:6,background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",fontFamily:"monospace",fontSize:"0.66rem",fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"1.1px",marginBottom:14}}>✦ Contact</div>
            <h1 style={{fontSize:"clamp(1.9rem,4vw,3.5rem)",fontWeight:800,letterSpacing:"-1.5px",marginBottom:16,lineHeight:1.05}}>
              Let's get you<br/><span style={{background:"linear-gradient(90deg,#00d4ff,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>screening fast</span>
            </h1>
            <p style={{fontSize:"0.95rem",color:"#4a7a96",lineHeight:1.78,marginBottom:32}}>
              Request a live demo, get your API key, or ask our team anything. We respond within 24 hours.
            </p>
            {[{Icon:Mail,label:"Email",val:"api@blacklist.io",c:"#00d4ff"},{Icon:Phone,label:"Phone",val:"+1 (888) BLK-LIST",c:"#8b5cf6"},{Icon:Globe2,label:"Headquarters",val:"Dubai, UAE · London, UK",c:"#10b981"}].map(c=>(
              <div key={c.label} style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"12px 14px",background:"rgba(5,15,28,0.7)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,backdropFilter:"blur(8px)"}}>
                <div style={{width:35,height:35,borderRadius:9,background:`${c.c}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <c.Icon size={16} color={c.c} strokeWidth={1.8}/>
                </div>
                <div>
                  <div style={{fontSize:"0.66rem",color:"#3a6070",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:2}}>{c.label}</div>
                  <div style={{fontSize:"0.84rem",fontWeight:600,color:"#94b4c8"}}>{c.val}</div>
                </div>
              </div>
            ))}
            <div style={{marginTop:24,padding:"16px 20px",background:"rgba(5,15,28,0.7)",border:"1px solid rgba(0,212,255,0.1)",borderRadius:14,backdropFilter:"blur(8px)"}}>
              <div style={{fontSize:"0.66rem",color:"#3a6070",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:"1px",marginBottom:11}}>Compliance Certifications</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {["SOC 2 Type II","ISO 27001","GDPR","PCI DSS","FATF Compliant","AML Ready"].map(b=>(
                  <span key={b} style={{padding:"4px 8px",borderRadius:6,background:"rgba(0,212,255,0.07)",border:"1px solid rgba(0,212,255,0.15)",fontSize:"0.65rem",fontWeight:700,color:"#00d4ff",fontFamily:"monospace"}}>{b}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right form */}
          <div style={{background:"rgba(5,15,28,0.92)",border:"1px solid rgba(0,212,255,0.12)",borderRadius:20,padding:"28px 24px",backdropFilter:"blur(16px)"}}>
            {sent?(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <CheckCircle size={48} color="#10b981" style={{marginBottom:16}}/>
                <h3 style={{fontSize:"1.35rem",fontWeight:800,marginBottom:10}}>Message Sent!</h3>
                <p style={{color:"#4a7a96",lineHeight:1.7}}>We'll get back to you within 24 hours with your API key or demo booking.</p>
              </div>
            ):(
              <form onSubmit={handleSubmit}>
                <h3 style={{fontSize:"1.15rem",fontWeight:800,marginBottom:5}}>Request API Access</h3>
                <p style={{fontSize:"0.81rem",color:"#4a7a96",marginBottom:20}}>Fill in your details and we'll set you up.</p>
                <div style={{display:"flex",gap:7,marginBottom:20}}>
                  {["demo","api_key","enterprise"].map(t=>(
                    <button key={t} type="button" onClick={()=>setForm(f=>({...f,type:t}))} style={{flex:1,padding:"9px 4px",borderRadius:8,fontWeight:600,fontSize:"0.73rem",cursor:"pointer",border:`1px solid ${form.type===t?"rgba(0,212,255,0.4)":"rgba(255,255,255,0.08)"}`,background:form.type===t?"rgba(0,212,255,0.1)":"transparent",color:form.type===t?"#00d4ff":"#6a8fa8",fontFamily:"inherit",transition:"all 0.2s"}}>
                      {t==="demo"?"Live Demo":t==="api_key"?"API Key":"Enterprise"}
                    </button>
                  ))}
                </div>
                {[{k:"name",l:"Full Name",p:"John Smith",type:"text"},{k:"email",l:"Work Email",p:"john@company.com",type:"email"},{k:"company",l:"Company",p:"Acme Bank",type:"text"}].map(f=>(
                  <div key={f.k} style={{marginBottom:13}}>
                    <label style={{fontSize:"0.7rem",fontWeight:700,color:"#3a6070",textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>{f.l}</label>
                    <input type={f.type} placeholder={f.p} value={form[f.k]} onChange={e=>setForm(v=>({...v,[f.k]:e.target.value}))} required
                      style={{width:"100%",padding:"10px 12px",background:"rgba(3,10,22,0.8)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#f0f9ff",fontSize:"0.85rem",fontFamily:"inherit",outline:"none",transition:"border-color 0.2s"}}
                      onFocus={e=>e.target.style.borderColor="rgba(0,212,255,0.4)"}
                      onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
                  </div>
                ))}
                <div style={{marginBottom:20}}>
                  <label style={{fontSize:"0.7rem",fontWeight:700,color:"#3a6070",textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Message</label>
                  <textarea placeholder="Tell us about your use case..." value={form.message} onChange={e=>setForm(v=>({...v,message:e.target.value}))} rows={4}
                    style={{width:"100%",padding:"10px 12px",background:"rgba(3,10,22,0.8)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#f0f9ff",fontSize:"0.85rem",fontFamily:"inherit",outline:"none",resize:"vertical",transition:"border-color 0.2s"}}
                    onFocus={e=>e.target.style.borderColor="rgba(0,212,255,0.4)"}
                    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
                </div>
                <button type="submit" style={{width:"100%",padding:"12px",borderRadius:10,fontWeight:700,fontSize:"0.92rem",cursor:"pointer",background:"linear-gradient(135deg,#00d4ff,#7c3aed)",border:"none",color:"#020c18",fontFamily:"inherit",boxShadow:"0 6px 22px rgba(0,212,255,0.28)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.25s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <Key size={14}/> {form.type==="enterprise"?"Contact Sales":"Send Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageBG>
  );
}

export default HomePage;