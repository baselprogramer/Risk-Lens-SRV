import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../config/api";
import { Shield, User, Lock, AlertTriangle, LogIn, ChevronRight } from "lucide-react";
import LogoIcon from "../assets/logo.svg";

const API_URL = ENDPOINTS.LOGIN;

/* ─── Animated scan-line canvas background ─────────────────────────── */
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

      /* subtle hex grid */
      ctx.strokeStyle = "rgba(0,180,220,0.04)";
      ctx.lineWidth = 0.5;
      const hex = 52;
      for (let row = -1; row < H / (hex * 0.86) + 2; row++) {
        for (let col = -1; col < W / hex + 2; col++) {
          const x = col * hex + (row % 2 === 0 ? 0 : hex / 2);
          const y = row * hex * 0.86;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = x + (hex / 2 - 2) * Math.cos(angle);
            const py = y + (hex / 2 - 2) * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      /* moving scan line */
      const scanY = ((t * 0.4) % (H + 40)) - 20;
      const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      grad.addColorStop(0,   "rgba(0,195,235,0)");
      grad.addColorStop(0.5, "rgba(0,195,235,0.06)");
      grad.addColorStop(1,   "rgba(0,195,235,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 30, W, 60);

      t++;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />;
}

/* ─── Floating compliance badges ───────────────────────────────────── */
const BADGES = ["OFAC", "UN", "EU", "HMT", "FATF", "PEP"];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

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
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes borderPulse { 0%,100%{border-color:rgba(0,195,235,0.25)} 50%{border-color:rgba(0,195,235,0.55)} }
        @keyframes floatBadge {
          0%,100%{transform:translateY(0px) rotate(var(--r,0deg))}
          50%{transform:translateY(-8px) rotate(var(--r,0deg))}
        }

        .aml-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05080f;
          font-family: 'IBM Plex Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* deep atmosphere glows */
        .aml-page::before {
          content:'';
          position:absolute;
          width:900px; height:900px;
          background:radial-gradient(circle, rgba(0,180,220,0.055) 0%, transparent 60%);
          top:-200px; left:-200px;
          pointer-events:none;
        }
        .aml-page::after {
          content:'';
          position:absolute;
          width:600px; height:600px;
          background:radial-gradient(circle, rgba(10,60,100,0.08) 0%, transparent 65%);
          bottom:-150px; right:-100px;
          pointer-events:none;
        }

        /* floating list badges */
        .aml-orbit {
          position:absolute;
          inset:0;
          pointer-events:none;
        }
        .aml-orbit-badge {
          position:absolute;
          padding:5px 11px;
          background:rgba(0,180,220,0.05);
          border:1px solid rgba(0,180,220,0.12);
          border-radius:4px;
          font-family:'IBM Plex Sans',sans-serif;
          font-size:10px;
          font-weight:600;
          color:rgba(0,195,235,0.35);
          letter-spacing:0.1em;
          animation: floatBadge 5s ease-in-out infinite;
        }

        /* split layout */
        .aml-split {
          position:relative;
          z-index:1;
          display:flex;
          width:100%;
          max-width:920px;
          min-height:560px;
          border-radius:20px;
          overflow:hidden;
          border:1px solid rgba(0,195,235,0.12);
          box-shadow:
            0 0 0 1px rgba(0,195,235,0.04),
            0 40px 100px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeIn 0.6s ease forwards;
        }

        /* left brand panel */
        .aml-brand {
          width:380px;
          flex-shrink:0;
          background: linear-gradient(160deg, #07111e 0%, #050c18 100%);
          border-right:1px solid rgba(0,195,235,0.08);
          display:flex;
          flex-direction:column;
          padding:44px 40px;
          position:relative;
          overflow:hidden;
        }

        .brand-logo-wrap {
          display:flex;
          align-items:center;
          gap:14px;
          margin-bottom:52px;
          animation: fadeUp 0.5s 0.1s both;
        }
        .brand-logo-box {
          width:42px; height:42px;
          background:rgba(0,195,235,0.07);
          border:1px solid rgba(0,195,235,0.2);
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        }
        .brand-logo-box img { width:28px; height:28px; object-fit:contain; filter:brightness(1.1); }
        .brand-wordmark {
          font-family:'Syne',sans-serif;
          font-size:15px;
          font-weight:600;
          color:#c8ddf0;
          letter-spacing:0.04em;
          line-height:1.8;
        }
        .brand-wordmark span {
          display:block;
          font-size:10px;
          font-weight:500;
          color:rgba(0,195,235,0.55);
          letter-spacing:0.12em;
          text-transform:uppercase;
          margin-top:2px;
        }

        .brand-hero {
          flex:1;
          display:flex;
          flex-direction:column;
          justify-content:center;
          animation: fadeUp 0.5s 0.2s both;
        }
        .brand-kicker {
          font-family:'IBM Plex Sans',sans-serif;
          font-size:10px;
          font-weight:600;
          letter-spacing:0.18em;
          text-transform:uppercase;
          color:rgba(0,195,235,0.6);
          margin-bottom:18px;
          display:flex;
          align-items:center;
          gap:8px;
        }
        .brand-kicker::before {
          content:'';
          display:inline-block;
          width:20px;
          height:1px;
          background:rgba(0,195,235,0.4);
        }
        .brand-headline {
          font-family:'Syne',sans-serif;
          font-size:32px;
          font-weight:600;
          color:#d8eaf8;
          line-height:1.15;
          letter-spacing:-0.5px;
          margin-bottom:20px;
        }
        .brand-headline em {
          font-style:normal;
          color:rgba(0,195,235,0.85);
        }
        .brand-body {
          font-size:13px;
          color:rgba(150,180,210,0.6);
          line-height:1.75;
          max-width:260px;
          margin-bottom:36px;
        }

        /* stat strip */
        .stat-strip {
          display:flex;
          gap:0;
          border:1px solid rgba(0,195,235,0.1);
          border-radius:10px;
          overflow:hidden;
          margin-bottom:28px;
        }
        .stat-cell {
          flex:1;
          padding:14px 12px;
          text-align:center;
          border-right:1px solid rgba(0,195,235,0.08);
        }
        .stat-cell:last-child { border-right:none; }
        .stat-num {
          font-family:'Syne',sans-serif;
          font-size:18px;
          font-weight:800;
          color:#c8ddf0;
          line-height:1;
          margin-bottom:4px;
        }
        .stat-lbl {
          font-size:9.5px;
          color:rgba(120,160,200,0.5);
          letter-spacing:0.08em;
          text-transform:uppercase;
          font-weight:500;
        }

        /* cert pills */
        .cert-row {
          display:flex;
          flex-wrap:wrap;
          gap:6px;
          animation: fadeUp 0.5s 0.3s both;
        }
        .cert-pill {
          padding:4px 10px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:4px;
          font-family:'IBM Plex Sans',sans-serif;
          font-size:9.5px;
          font-weight:500;
          color:rgba(160,185,215,0.5);
          letter-spacing:0.06em;
        }

        /* right form panel */
        .aml-form-panel {
          flex:1;
          background:#080d18;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:48px 52px;
          position:relative;
        }

        /* accent line top of form */
        .form-accent-line {
          position:absolute;
          top:0; left:15%; right:15%;
          height:2px;
          background:linear-gradient(90deg, transparent, rgba(0,195,235,0.6), rgba(0,130,180,0.4), transparent);
          border-radius:0 0 3px 3px;
        }

        .form-inner {
          width:100%;
          max-width:340px;
        }

        .form-head {
          margin-bottom:36px;
          animation: fadeUp 0.45s 0.15s both;
        }
        .form-eyebrow {
          font-family:'IBM Plex Sans',sans-serif;
          font-size:10px;
          font-weight:600;
          letter-spacing:0.15em;
          text-transform:uppercase;
          color:rgba(0,195,235,0.55);
          margin-bottom:10px;
          display:flex;
          align-items:center;
          gap:7px;
        }
        .eyebrow-dot {
          width:6px; height:6px;
          border-radius:50%;
          background:rgba(0,195,235,0.7);
          animation:pulse 2.5s infinite;
          flex-shrink:0;
        }
        .form-title {
          font-family:'Syne',sans-serif;
          font-size:26px;
          font-weight:800;
          color:#ddeaf8;
          letter-spacing:-0.4px;
          line-height:1.2;
          margin-bottom:6px;
        }
        .form-sub {
          font-size:13px;
          color:rgba(130,160,200,0.6);
          font-weight:300;
        }

        /* form fields */
        .field-group {
          margin-bottom:20px;
          animation: fadeUp 0.45s both;
        }
        .field-group:nth-child(1) { animation-delay:0.2s }
        .field-group:nth-child(2) { animation-delay:0.25s }

        .field-label {
          display:block;
          font-family:'IBM Plex Sans',sans-serif;
          font-size:10px;
          font-weight:600;
          color:rgba(140,170,210,0.65);
          letter-spacing:0.12em;
          text-transform:uppercase;
          margin-bottom:8px;
        }
        .field-wrap {
          position:relative;
        }
        .field-icon {
          position:absolute;
          left:14px;
          top:50%;
          transform:translateY(-50%);
          color:rgba(0,195,235,0.3);
          pointer-events:none;
          display:flex;
          align-items:center;
        }
        .field-input {
          width:100%;
          height:48px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(0,195,235,0.14);
          border-radius:10px;
          font-family:'IBM Plex Sans',sans-serif;
          font-size:14px;
          color:#cfe0f2;
          padding:0 16px 0 44px;
          outline:none;
          transition:border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color:rgba(100,135,175,0.4); font-weight:300; }
        .field-input:focus {
          border-color:rgba(0,195,235,0.45);
          background:rgba(0,195,235,0.04);
          box-shadow:0 0 0 3px rgba(0,195,235,0.07);
        }
        .field-input:disabled { opacity:0.5; cursor:not-allowed; }

        /* error */
        .form-error {
          background:rgba(220,60,60,0.07);
          border:1px solid rgba(220,60,60,0.22);
          border-radius:9px;
          padding:11px 14px;
          margin-bottom:20px;
          display:flex;
          align-items:center;
          gap:9px;
          font-size:13px;
          color:#f87171;
          font-weight:500;
          animation:fadeUp 0.3s both;
        }

        /* submit */
        .btn-submit {
          width:100%;
          height:50px;
          background:rgba(0,195,235,0.08);
          border:1px solid rgba(0,195,235,0.3);
          border-radius:10px;
          font-family:'Syne',sans-serif;
          font-size:14px;
          font-weight:700;
          color:#a8ddf0;
          letter-spacing:0.06em;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:9px;
          transition:all 0.22s;
          position:relative;
          overflow:hidden;
          animation: fadeUp 0.45s 0.3s both;
        }
        .btn-submit::before {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(90deg,transparent 0%,rgba(0,195,235,0.07) 50%,transparent 100%);
          background-size:200% 100%;
          animation:shimmer 3s infinite;
        }
        .btn-submit:hover:not(:disabled) {
          background:rgba(0,195,235,0.14);
          border-color:rgba(0,195,235,0.55);
          color:#c8f0ff;
          box-shadow:0 0 24px rgba(0,195,235,0.12);
          transform:translateY(-1px);
        }
        .btn-submit:active:not(:disabled) { transform:translateY(0); }
        .btn-submit:disabled {
          opacity:0.45;
          cursor:not-allowed;
          animation:none;
        }

        /* spinner */
        .spinner {
          width:16px; height:16px;
          border:2px solid rgba(0,195,235,0.2);
          border-top-color:rgba(0,195,235,0.8);
          border-radius:50%;
          animation:spin 0.75s linear infinite;
          flex-shrink:0;
        }

        /* footer */
        .form-footer {
          margin-top:28px;
          padding-top:20px;
          border-top:1px solid rgba(255,255,255,0.05);
          display:flex;
          align-items:center;
          justify-content:center;
          gap:7px;
          font-family:'IBM Plex Sans',sans-serif;
          font-size:10.5px;
          color:rgba(80,110,150,0.6);
          letter-spacing:0.04em;
          animation: fadeUp 0.45s 0.35s both;
        }

        /* responsive */
        @media (max-width: 700px) {
          .aml-brand { display:none; }
          .aml-form-panel { padding:40px 28px; }
        }
      `}</style>

      <div className="aml-page">
        <ScanCanvas />

        {/* floating watchlist badge labels */}
        <div className="aml-orbit" aria-hidden="true">
          {[
            { label:"OFAC SDN", top:"12%", left:"6%",  delay:"0s",   r:"-3deg" },
            { label:"UN SC",    top:"22%", right:"5%", delay:"1.2s", r:"2deg"  },
            { label:"EU List",  top:"70%", left:"4%",  delay:"0.7s", r:"-2deg" },
            { label:"HMT",      top:"80%", right:"6%", delay:"1.8s", r:"3deg"  },
            { label:"PEP",      top:"48%", left:"2%",  delay:"2.2s", r:"-4deg" },
            { label:"FATF",     top:"55%", right:"3%", delay:"0.4s", r:"1deg"  },
          ].map(({ label, top, left, right, delay, r }) => (
            <div key={label} className="aml-orbit-badge"
              style={{ top, left, right, animationDelay:delay, "--r":r }} >
              {label}
            </div>
          ))}
        </div>

        <div className="aml-split" role="main">

          {/* ── Brand panel ── */}
          <div className="aml-brand" aria-hidden="true">
            <ScanCanvas />

            <div className="brand-logo-wrap">
              <div className="brand-logo-box">
                <img src={LogoIcon} alt="Logo" />
              </div>
              <div className="brand-wordmark">
                Risk & Compliance
                <span>Sanctions Screening API</span>
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
                <div className="stat-cell">
                  <div className="stat-num">200+</div>
                  <div className="stat-lbl">Watchlists</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-num">&lt;300ms</div>
                  <div className="stat-lbl">Response</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-num">99.9%</div>
                  <div className="stat-lbl">Uptime</div>
                </div>
              </div>
            </div>

            <div className="cert-row">
              {["ISO 27001","SOC 2","GDPR","FATF"].map(c => (
                <span key={c} className="cert-pill">{c}</span>
              ))}
            </div>
          </div>

          {/* ── Form panel ── */}
          <div className="aml-form-panel">
            <div className="form-accent-line" aria-hidden="true" />

            <div className="form-inner">
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
                      id="aml-username"
                      className="field-input"
                      type="text"
                      autoComplete="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="aml-password">Password</label>
                  <div className="field-wrap">
                    <span className="field-icon"><Lock size={15} /></span>
                    <input
                      id="aml-password"
                      className="field-input"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="form-error" role="alert">
                    <AlertTriangle size={14} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <><span className="spinner" aria-hidden="true" /> Authenticating…</>
                  ) : (
                    <><LogIn size={16} aria-hidden="true" /> Sign In to Portal <ChevronRight size={14} aria-hidden="true" style={{opacity:0.5}} /></>
                  )}
                </button>
              </form>

              <div className="form-footer">
                <Shield size={11} aria-hidden="true" />
                256-bit TLS · MFA enforced · v1.0
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}