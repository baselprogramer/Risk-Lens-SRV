import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../config/api";
import { Shield, User, Lock, AlertTriangle, LogIn, Radar } from "lucide-react";
import LogoIcon from "../assets/logo.svg";


const API_URL = ENDPOINTS.LOGIN;

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

      localStorage.setItem("jwtToken",  data.token);
      localStorage.setItem("role",      data.role);
      localStorage.setItem("username",  data.username);
      localStorage.setItem("tenantId",  data.tenantId || "");

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

  const S = {
    page: {
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#060912",
      padding: "20px", position: "relative", overflow: "hidden",
      fontFamily: "'IBM Plex Sans', sans-serif",
    },
    grid: {
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: "linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)",
      backgroundSize: "50px 50px",
    },
    glow1: { position:"absolute", width:"500px", height:"500px", pointerEvents:"none",
      background:"radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
      top:"-100px", left:"-100px" },
    glow2: { position:"absolute", width:"400px", height:"400px", pointerEvents:"none",
      background:"radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
      bottom:"-80px", right:"-80px" },
    card: {
      position:"relative", zIndex:1, width:"100%", maxWidth:"420px",
      background:"#0d1321", borderRadius:"20px", border:"1px solid #1a2d4a",
      padding:"40px 36px",
      boxShadow:"0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05)",
    },
    topBar: {
      position:"absolute", top:0, left:"20%", right:"20%", height:"2px",
      background:"linear-gradient(90deg, transparent, #00d4ff, #8b5cf6, transparent)",
      borderRadius:"0 0 4px 4px",
    },
    logoWrap: { textAlign:"center", marginBottom:"32px" },
    logoIcon: {
      width:"72px", height:"72px",
      background:"linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(139,92,246,0.15) 100%)",
      border:"1px solid rgba(0,212,255,0.25)", borderRadius:"18px",
      display:"flex", alignItems:"center", justifyContent:"center",
      margin:"0 auto 18px", boxShadow:"0 8px 24px rgba(0,212,255,0.15)",
    },
    badge: {
      display:"inline-flex", alignItems:"center", gap:"6px",
      background:"rgba(0,212,255,0.07)", border:"1px solid rgba(0,212,255,0.2)",
      padding:"4px 14px", borderRadius:"20px", fontSize:"0.72rem",
      color:"#00d4ff", fontFamily:"'JetBrains Mono', monospace",
      letterSpacing:"0.5px", marginBottom:"14px",
    },
    title:    { margin:0, fontSize:"1.7rem", fontWeight:"700", color:"#e2e8f0", marginBottom:"6px", letterSpacing:"-0.3px" },
    subtitle: { margin:0, color:"#7a8fa8", fontSize:"0.85rem" },
    label:    { display:"block", marginBottom:"8px", fontWeight:"600", color:"#94a3b8", fontSize:"0.8rem", letterSpacing:"0.5px", textTransform:"uppercase" },
    inputWrap:{ position:"relative", marginBottom:"18px" },
    inputIcon:{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#3a5a7a" },
    input: {
      width:"100%", padding:"13px 16px 13px 44px",
      background:"#111c2e", border:"1px solid #1a2d4a", borderRadius:"10px",
      fontSize:"0.92rem", boxSizing:"border-box", color:"#e2e8f0",
      transition:"all 0.2s", outline:"none", fontFamily:"'IBM Plex Sans', sans-serif",
    },
    error: {
      background:"rgba(239,68,68,0.08)", color:"#ef4444",
      padding:"11px 14px", borderRadius:"9px", marginBottom:"18px",
      fontSize:"0.83rem", fontWeight:"500", border:"1px solid rgba(239,68,68,0.2)",
      display:"flex", alignItems:"center", gap:"8px",
    },
    btn: {
      width:"100%", background:"linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)",
      color:"#060912", padding:"14px", border:"none", borderRadius:"10px",
      fontSize:"0.95rem", fontWeight:"700", cursor:"pointer", transition:"all 0.25s",
      boxShadow:"0 6px 20px rgba(0,212,255,0.25)", letterSpacing:"0.3px",
      fontFamily:"'IBM Plex Sans', sans-serif", marginTop:"4px",
      display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
    },
    btnDisabled: { background:"#1a2d4a", color:"#7a8fa8", cursor:"not-allowed", boxShadow:"none" },
    footer: {
      marginTop:"28px", textAlign:"center", fontSize:"0.78rem", color:"#3a4f66",
      borderTop:"1px solid #1a2d4a", paddingTop:"20px",
      display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        .login-card { animation: fadeUp 0.5s ease forwards; }
        .login-input:focus {
          border-color: rgba(0,212,255,0.5) !important;
          box-shadow: 0 0 0 3px rgba(0,212,255,0.08) !important;
          background: #131e30 !important;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0,212,255,0.35) !important;
          filter: brightness(1.05);
        }
      `}</style>

      <div style={S.page}>
        <div style={S.grid}/>
        <div style={S.glow1}/>
        <div style={S.glow2}/>

        <div style={S.card} className="login-card">
          <div style={S.topBar}/>

          {/* Logo */}
          <div style={S.logoWrap}>
            <div >
              <img src={LogoIcon} alt="logo" style={{ width: 100, height: 100, objectFit: "contain" }} />
              
            </div>
            <div style={S.badge}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#00d4ff",
                display:"inline-block",animation:"pulse 2s infinite"}}/>
              Risk &amp; Compliance API · v1.0
            </div>
            <h2 style={S.title}>Authorized Access Only</h2>
            <p style={S.subtitle}>International &amp; Domestic Sanctions Screening</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={S.inputWrap}>
              <label style={S.label}>Username</label>
              <div style={{position:"relative"}}>
                <span style={S.inputIcon}><User size={15}/></span>
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  required disabled={loading}
                  placeholder="Enter your username"
                  className="login-input"
                  style={{...S.input, opacity:loading?0.6:1}}
                />
              </div>
            </div>

            <div style={{...S.inputWrap, marginBottom:"22px"}}>
              <label style={S.label}>Password</label>
              <div style={{position:"relative"}}>
                <span style={S.inputIcon}><Lock size={15}/></span>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required disabled={loading}
                  placeholder="Enter your password"
                  className="login-input"
                  style={{...S.input, opacity:loading?0.6:1}}
                />
              </div>
            </div>

            {error && (
              <div style={S.error}>
                <AlertTriangle size={14}/> {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="login-btn"
              style={loading ? {...S.btn, ...S.btnDisabled} : S.btn}
            >
              {loading ? (
                <>
                  <span style={{
                    display:"inline-block", width:"16px", height:"16px",
                    border:"2px solid rgba(255,255,255,0.2)",
                    borderTop:"2px solid #7a8fa8", borderRadius:"50%",
                    animation:"spin 0.8s linear infinite",
                  }}/>
                  Authenticating...
                </>
              ) : (
                <><LogIn size={16}/> Sign In</>
              )}
            </button>
          </form>

          <div style={S.footer}>
            <Shield size={11} color="#3a4f66"/>
            Sanctions Screening System · Secured &amp; Encrypted
          </div>
        </div>
      </div>
    </>
  );
}