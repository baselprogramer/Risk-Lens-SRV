import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../config/api";
import { Shield, User, Lock, AlertTriangle, LogIn, ChevronRight } from "lucide-react";
import LogoIcon from "../assets/logo.svg";

const API_URL = ENDPOINTS.LOGIN;

/* ─── Animated canvas background ─────────────────────────── */
function ScanCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(0,180,220,0.032)";
      ctx.lineWidth = 0.5;
      const step = 48;
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      const scanY = ((t * 0.35) % (H + 60)) - 30;
      const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      grad.addColorStop(0,   "rgba(0,195,235,0)");
      grad.addColorStop(0.5, "rgba(0,195,235,0.055)");
      grad.addColorStop(1,   "rgba(0,195,235,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 40, W, 80);

      t++;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error("Invalid username or password");
      const data = await response.json();

      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("role",     data.role);
      localStorage.setItem("username", data.username);
      localStorage.setItem("tenantId", data.tenantId || "");

      if (["SUPER_ADMIN", "COMPANY_ADMIN", "SUBSCRIBER"].includes(data.role)) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp        { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn        { from{opacity:0} to{opacity:1} }
        @keyframes spin          { to{transform:rotate(360deg)} }
        @keyframes shimmer       { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes borderPulse   { 0%,100%{border-color:rgba(0,195,235,0.22)} 50%{border-color:rgba(0,195,235,0.5)} }
        @keyframes dotBlink      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.65)} }
        @keyframes floatBadge    {
          0%,100%{transform:translateY(0px) rotate(var(--r,0deg))}
          50%{transform:translateY(-7px) rotate(var(--r,0deg))}
        }
        @keyframes logoRingPulse {
          0%,100%{opacity:0.35;transform:scale(1)}
          50%{opacity:0.7;transform:scale(1.04)}
        }

        .aml-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #04070f;
          font-family: 'IBM Plex Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }
        .aml-page::before {
          content:'';
          position:absolute;
          width:800px; height:800px;
          background:radial-gradient(circle, rgba(0,160,210,0.065) 0%, transparent 62%);
          top:-180px; left:-180px;
          pointer-events:none;
        }
        .aml-page::after {
          content:'';
          position:absolute;
          width:550px; height:550px;
          background:radial-gradient(circle, rgba(0,50,110,0.08) 0%, transparent 65%);
          bottom:-120px; right:-80px;
          pointer-events:none;
        }

        .aml-orbit { position:absolute; inset:0; pointer-events:none; }
        .aml-orbit-badge {
          position:absolute;
          padding:4px 10px;
          background:rgba(0,180,220,0.04);
          border:1px solid rgba(0,180,220,0.1);
          border-radius:3px;
          font-family:'IBM Plex Mono',monospace;
          font-size:9px; font-weight:600;
          color:rgba(0,195,235,0.25); letter-spacing:0.12em;
          animation: floatBadge 5s ease-in-out infinite;
        }

        /* ── CARD ── */
        .aml-split {
          position:relative; z-index:1;
          display:flex; width:100%; max-width:900px;
          border-radius:16px; overflow:hidden;
          border:1px solid rgba(0,195,235,0.1);
          box-shadow: 0 0 0 1px rgba(0,195,235,0.03), 0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.035);
          animation: fadeIn 0.7s ease both;
        }

        /* ── LEFT ── */
        .aml-brand {
          width:360px; flex-shrink:0;
          background: linear-gradient(155deg, #061220 0%, #040b16 60%, #040914 100%);
          border-right:1px solid rgba(0,195,235,0.07);
          display:flex; flex-direction:column;
          padding:36px; position:relative; overflow:hidden;
          min-height:540px;
        }

        .brand-logo-wrap { display:flex; align-items:center; margin-bottom:44px; animation: fadeUp 0.5s 0.1s both; }
       .logo-img-frame {
          position:relative;
          width:70px;
          height:50px;
          flex-shrink:0;
          display:flex;
          align-items:center;
          justify-content:center;
        }
      
        .logo-img-box {
          width:70px;
          height:50px;
          background: linear-gradient(135deg, rgba(0,195,235,0.1) 0%, rgba(0,120,180,0.06) 100%);
          border:1px solid rgba(0,195,235,0.28);
          border-radius:50%;          /* ← دائرة/عدسة */
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
          overflow:hidden;
          flex-shrink:0;
        }
       
       
        .logo-img-box img {
          width:75px;
          height:65px;
          object-fit:contain;
          filter:brightness(1.15) drop-shadow(0 0 6px rgba(0,195,235,0.4));
          position:relative;
          z-index:1;
        }
        .logo-divider { width:1px; height:30px; background:rgba(0,195,235,0.14); margin:0 14px; flex-shrink:0; }
        .logo-text-block { display:flex; flex-direction:column; }
        .logo-name { font-family:'Space Grotesk',sans-serif; font-size:17px; font-weight:700; color:#d0e5f5; letter-spacing:-0.2px; line-height:1.1; }
        .logo-name span { color:rgba(0,195,235,0.9); }
        .logo-tag { font-family:'IBM Plex Mono',monospace; font-size:8px; font-weight:500; color:rgba(0,195,235,0.38); letter-spacing:0.2em; text-transform:uppercase; margin-top:5px; line-height:1; }

        .brand-hero { flex:1; display:flex; flex-direction:column; justify-content:center; animation: fadeUp 0.5s 0.18s both; }
        .brand-kicker { font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,195,235,0.5); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .brand-kicker::before { content:''; display:inline-block; width:18px; height:1px; background:rgba(0,195,235,0.35); }
        .brand-headline { font-family:'Space Grotesk',sans-serif; font-size:28px; font-weight:700; color:#cfe0f2; line-height:1.18; letter-spacing:-0.5px; margin-bottom:16px; }
        .brand-headline em { font-style:normal; color:rgba(0,195,235,0.9); }
        .brand-body { font-size:12.5px; color:rgba(125,160,200,0.52); line-height:1.8; max-width:248px; margin-bottom:28px; font-weight:300; }

        .stat-strip { display:flex; border:1px solid rgba(0,195,235,0.08); border-radius:8px; overflow:hidden; margin-bottom:22px; }
        .stat-cell { flex:1; padding:12px 10px; text-align:center; border-right:1px solid rgba(0,195,235,0.07); }
        .stat-cell:last-child { border-right:none; }
        .stat-num { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:700; color:#bcd6f0; line-height:1; margin-bottom:3px; }
        .stat-lbl { font-size:8.5px; color:rgba(100,140,185,0.45); letter-spacing:0.1em; text-transform:uppercase; font-weight:500; }

        .cert-row { display:flex; flex-wrap:wrap; gap:5px; animation: fadeUp 0.5s 0.28s both; }
        .cert-pill { padding:3px 9px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:3px; font-family:'IBM Plex Mono',monospace; font-size:8.5px; font-weight:500; color:rgba(140,170,205,0.38); letter-spacing:0.07em; }

        /* ── RIGHT ── */
        .aml-form-panel {
          flex:1; background:#060c16;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:44px 48px; position:relative;
        }
        .form-accent-line { position:absolute; top:0; left:18%; right:18%; height:1px; background:linear-gradient(90deg, transparent, rgba(0,195,235,0.65), rgba(0,140,190,0.4), transparent); }
        .form-inner { width:100%; max-width:320px; }

        .form-head { margin-bottom:30px; animation: fadeUp 0.45s 0.15s both; }
        .form-eyebrow { font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,195,235,0.5); margin-bottom:10px; display:flex; align-items:center; gap:7px; }
        .eyebrow-dot { width:5px; height:5px; border-radius:50%; background:rgba(0,195,235,0.8); animation:dotBlink 2.5s ease-in-out infinite; flex-shrink:0; }
        .form-title { font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:700; color:#ddeaf8; letter-spacing:-0.4px; line-height:1.2; margin-bottom:4px; }
        .form-sub { font-size:12px; color:rgba(110,150,190,0.52); font-weight:300; }

        .field-group { margin-bottom:18px; animation: fadeUp 0.45s both; }
        .field-group:nth-child(1) { animation-delay:0.2s }
        .field-group:nth-child(2) { animation-delay:0.25s }
        .field-label { display:block; font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:600; color:rgba(120,158,200,0.55); letter-spacing:0.16em; text-transform:uppercase; margin-bottom:7px; }
        .field-wrap { position:relative; }
        .field-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:rgba(0,195,235,0.28); pointer-events:none; display:flex; align-items:center; }
        .field-input { width:100%; height:46px; background:rgba(255,255,255,0.025); border:1px solid rgba(0,195,235,0.12); border-radius:8px; font-family:'IBM Plex Sans',sans-serif; font-size:13.5px; color:#cce0f2; padding:0 15px 0 42px; outline:none; transition:border-color 0.2s, background 0.2s, box-shadow 0.2s; }
        .field-input::placeholder { color:rgba(80,118,165,0.36); font-weight:300; }
        .field-input:focus { border-color:rgba(0,195,235,0.42); background:rgba(0,195,235,0.032); box-shadow:0 0 0 3px rgba(0,195,235,0.06); }
        .field-input:disabled { opacity:0.5; cursor:not-allowed; }

        .form-error { background:rgba(220,60,60,0.07); border:1px solid rgba(220,60,60,0.2); border-radius:8px; padding:10px 13px; margin-bottom:18px; display:flex; align-items:center; gap:8px; font-size:12.5px; color:#f87171; font-weight:500; animation:fadeUp 0.3s both; }

        .btn-submit { width:100%; height:48px; background:linear-gradient(135deg, rgba(0,195,235,0.09) 0%, rgba(0,145,195,0.07) 100%); border:1px solid rgba(0,195,235,0.26); border-radius:8px; font-family:'Space Grotesk',sans-serif; font-size:13.5px; font-weight:600; color:#9dd8f0; letter-spacing:0.04em; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.22s; position:relative; overflow:hidden; animation: fadeUp 0.45s 0.3s both, borderPulse 3s ease-in-out infinite; }
        .btn-submit::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(0,195,235,0.07), transparent); background-size:200% 100%; animation:shimmer 3.5s infinite; }
        .btn-submit:hover:not(:disabled) { background:linear-gradient(135deg, rgba(0,195,235,0.16) 0%, rgba(0,155,205,0.12) 100%); border-color:rgba(0,195,235,0.5); color:#beeeff; box-shadow:0 0 28px rgba(0,195,235,0.1), 0 4px 16px rgba(0,0,0,0.3); transform:translateY(-1px); }
        .btn-submit:active:not(:disabled) { transform:translateY(0); }
        .btn-submit:disabled { opacity:0.45; cursor:not-allowed; }

        .spinner { width:15px; height:15px; border:2px solid rgba(0,195,235,0.18); border-top-color:rgba(0,195,235,0.8); border-radius:50%; animation:spin 0.75s linear infinite; flex-shrink:0; }

        .form-footer { margin-top:22px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.045); display:flex; align-items:center; justify-content:center; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:rgba(70,100,140,0.52); letter-spacing:0.05em; animation: fadeUp 0.45s 0.35s both; }
        .footer-dot { width:3px; height:3px; border-radius:50%; background:rgba(0,195,235,0.28); display:inline-block; }

        /* mobile logo hidden by default */
        .mobile-logo { display:none; }

        /* ═══════════════════════════════════════
           RESPONSIVE
        ═══════════════════════════════════════ */

        /* Tablet landscape 900–1100px */
        @media (max-width: 1100px) {
          .aml-split { max-width:820px; }
          .aml-brand { width:300px; padding:28px 24px; }
          .brand-headline { font-size:24px; }
          .brand-body { font-size:12px; max-width:210px; }
        }

        /* Tablet portrait 600–900px: stack vertically, compact brand bar */
        @media (max-width: 900px) {
          .aml-page { padding:16px; align-items:center; }
          .aml-split { flex-direction:column; max-width:500px; border-radius:14px; }
          .aml-brand {
            width:100%; min-height:auto;
            padding:24px 28px 20px;
            border-right:none;
            border-bottom:1px solid rgba(0,195,235,0.07);
          }
          .brand-hero { display:none; }
          .cert-row   { display:none; }
          .brand-logo-wrap { margin-bottom:0; }
          .aml-form-panel { padding:32px 32px 36px; }
          .aml-orbit { display:none; }
        }

        /* Mobile 0–600px: full screen form, mini logo on top */
        @media (max-width: 600px) {
          .aml-page {
            padding:0;
            align-items:stretch;
            min-height:100dvh;
          }
          .aml-split {
            flex-direction:column;
            max-width:100%; width:100%;
            border-radius:0; border:none; box-shadow:none;
            min-height:100dvh;
          }
          .aml-brand { display:none; }
          .aml-form-panel {
            flex:1; padding:0;
            justify-content:flex-start;
            align-items:stretch;
          }
          .form-accent-line { left:0; right:0; height:2px; }
          .form-inner {
            max-width:100%;
            padding:36px 24px 32px;
            display:flex; flex-direction:column;
            min-height:100dvh;
          }
          .mobile-logo {
            display:flex !important;
            align-items:center;
            margin-bottom:32px;
          }
          .form-head { margin-bottom:24px; }
          .form-title { font-size:22px; }
          .form-sub { font-size:11.5px; }
          /* prevent iOS zoom on input focus */
          .field-input { height:50px; font-size:16px; }
          .btn-submit  { height:52px; font-size:14px; }
          .form-footer { margin-top:auto; padding-top:24px; padding-bottom:8px; }
        }

        /* Small mobile < 390px */
        @media (max-width: 390px) {
          .form-inner { padding:28px 20px 28px; }
          .form-title { font-size:20px; }
          .logo-name  { font-size:15px; }
          .logo-tag   { font-size:7.5px; }
        }

        /* Very small < 320px */
        @media (max-width: 320px) {
          .form-inner { padding:24px 16px 24px; }
          .logo-divider { margin:0 10px; }
        }
      `}</style>

      <div className="aml-page">
        <ScanCanvas />

        <div className="aml-orbit" aria-hidden="true">
          {[
            { label:"OFAC SDN", top:"11%",  left:"5%",    delay:"0s",   r:"-3deg" },
            { label:"UN SC",    top:"21%",  right:"4%",   delay:"1.3s", r:"2deg"  },
            { label:"EU LIST",  top:"69%",  left:"3%",    delay:"0.8s", r:"-2deg" },
            { label:"HMT",      top:"79%",  right:"5%",   delay:"2s",   r:"3deg"  },
            { label:"PEP",      top:"46%",  left:"1.5%",  delay:"2.5s", r:"-4deg" },
            { label:"FATF",     top:"54%",  right:"2.5%", delay:"0.5s", r:"1deg"  },
          ].map(({ label, top, left, right, delay, r }) => (
            <div key={label} className="aml-orbit-badge"
              style={{ top, left, right, animationDelay:delay, "--r":r }}>
              {label}
            </div>
          ))}
        </div>

        <div className="aml-split" role="main">

          {/* ── Brand Panel ── */}
          <div className="aml-brand" aria-hidden="true">
            <ScanCanvas />
            <div className="brand-logo-wrap">
              <div className="logo-img-frame">
             
                <div className="logo-img-box">
                  <img src={LogoIcon} alt="RiskLens" />
                </div>
              </div>
              <div className="logo-divider" />
              <div className="logo-text-block">
                <div className="logo-name">Risk<span>Lens</span></div>
                <div className="logo-tag">AML · Sanctions · Compliance</div>
              </div>
            </div>

            <div className="brand-hero">
              <div className="brand-kicker">Real-time intelligence</div>
              <h1 className="brand-headline">
                Global Sanctions<br />
                &amp; <em>AML</em><br />
                Screening
              </h1>
              <p className="brand-body">
                Instant matching across 200+ international watchlists,
                PEP databases, adverse media, and blacklist registries
                for compliance teams that demand precision.
              </p>
              <div className="stat-strip">
                <div className="stat-cell"><div className="stat-num">200+</div><div className="stat-lbl">Watchlists</div></div>
                <div className="stat-cell"><div className="stat-num">&lt;300ms</div><div className="stat-lbl">Response</div></div>
                <div className="stat-cell"><div className="stat-num">99.9%</div><div className="stat-lbl">Uptime</div></div>
              </div>
            </div>

            <div className="cert-row">
              {["ISO 27001","SOC 2","GDPR","FATF"].map(c => (
                <span key={c} className="cert-pill">{c}</span>
              ))}
            </div>
          </div>

          {/* ── Form Panel ── */}
          <div className="aml-form-panel">
            <div className="form-accent-line" aria-hidden="true" />

            <div className="form-inner">

              {/* mini logo — mobile only */}
              <div className="mobile-logo" aria-hidden="true">
                <div className="logo-img-frame">
               
                  <div className="logo-img-box">
                    <img src={LogoIcon} alt="RiskLens" />
                  </div>
                </div>
                <div className="logo-divider" />
                <div className="logo-text-block">
                  <div className="logo-name">Risk<span>Lens</span></div>
                  <div className="logo-tag">AML · Sanctions · Compliance</div>
                </div>
              </div>

              <div className="form-head">
                <div className="form-eyebrow">
                  <span className="eyebrow-dot" aria-hidden="true" />
                  Authorized Access Only
                </div>
                <h2 className="form-title">Secure Sign In</h2>
                <p className="form-sub">International &amp; Domestic Sanctions Portal</p>
              </div>

              <form onSubmit={handleLogin} noValidate>
                <div className="field-group">
                  <label className="field-label" htmlFor="aml-username">Username</label>
                  <div className="field-wrap">
                    <span className="field-icon"><User size={15} /></span>
                    <input
                      id="aml-username" className="field-input" type="text"
                      autoComplete="username" placeholder="Enter your username"
                      value={username} onChange={e => setUsername(e.target.value)}
                      required disabled={loading}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="aml-password">Password</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Lock size={15} /></span>
                    <input
                      id="aml-password" className="field-input" type="password"
                      autoComplete="current-password" placeholder="Enter your password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      required disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="form-error" role="alert">
                    <AlertTriangle size={14} />
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-submit" disabled={loading} aria-busy={loading}>
                  {loading ? (
                    <><span className="spinner" aria-hidden="true" /> Authenticating…</>
                  ) : (
                    <><LogIn size={15} aria-hidden="true" /> Sign In to Portal <ChevronRight size={13} aria-hidden="true" style={{opacity:0.45}} /></>
                  )}
                </button>
              </form>

              <div className="form-footer">
                <Shield size={10} aria-hidden="true" />
                256-bit TLS
                <span className="footer-dot" />
                MFA enforced
                <span className="footer-dot" />
                v1.0
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}