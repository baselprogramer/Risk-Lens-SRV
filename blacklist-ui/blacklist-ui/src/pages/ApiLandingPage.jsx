import React from 'react';

export default function ApiWelcomePage() {
  const apiMeta = {
    title: "Production API Gateway",
    version: "v1.4.0",
    status: "Operational",
    description: "Welcome to our core system backend services. This subdomain is reserved for application data processing and programmatic access.",
    mainSiteUrl: "https://risk-lens.net", 
    docsUrl: "https://risk-lens.net/api-docs"  
  };

  const theme = {
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    textMuted: '#888',
    accentColor: '#646cff',
    accentGlow: 'rgba(100, 108, 255, 0.15)',
    cardBg: '#16161a', // Richer, modern dark slate
    bodyBg: '#0e0e11'   // Deep black-gray contrast
  };

  const btnBaseStyle = {
    flex: 1,
    textAlign: 'center',
    padding: '0.8em 1.6em',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.95em',
    textDecoration: 'none',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // Modern ease curve
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: theme.bodyBg,
      color: 'rgba(255, 255, 255, 0.92)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
      lineHeight: '1.5',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Injecting CSS Keyframes smoothly via React for custom animations */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.1); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeInDown 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* Background Ambient Mesh Gradient */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        backgroundColor: 'rgba(100, 108, 255, 0.08)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        animation: 'pulseGlow 8s ease-in-out infinite'
      }} />

      {/* Container Card */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '540px',
        backgroundColor: theme.cardBg, 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '2.5em',
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        textAlign: 'center',
        backdropFilter: 'blur(8px)'
      }}>
        
        {/* Modern Corner Border Accent Light */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #646cff, transparent)'
        }} />

        {/* Header Block */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '28px',
          gap: '14px'
        }}>
          {/* Neon Glow Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(100, 108, 255, 0.07)',
            border: '1px solid rgba(100, 108, 255, 0.25)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: theme.accentColor,
            boxShadow: '0 0 15px rgba(100, 108, 255, 0.1)'
          }}>
            <span style={{ 
              height: '6px', 
              width: '6px', 
              borderRadius: '50%', 
              backgroundColor: theme.accentColor,
              animation: 'dotPulse 2s infinite ease-in-out'
            }} />
            {apiMeta.status}
          </div>

          <div>
            <h1 style={{ 
              fontSize: '2.2rem', 
              lineHeight: '1.2', 
              margin: '4px 0 0 0', 
              color: '#ffffff', 
              fontWeight: '800',
              letterSpacing: '-0.03em'
            }}>
              {apiMeta.title}
            </h1>
            <p style={{ fontSize: '11px', fontFamily: theme.fontMono, color: theme.textMuted, marginTop: '8px', margin: 0, letterSpacing: '0.1em' }}>
              REVISION // <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{apiMeta.version}</span>
            </p>
          </div>
        </div>

        {/* Info Paragraph */}
        <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '14px', lineHeight: '1.6', maxWidth: '460px', margin: '0 auto 28px auto' }}>
          {apiMeta.description}
        </p>

        {/* Code Snippet Box (Polished Terminal Aesthetic) */}
        <div style={{
          backgroundColor: '#0a0a0c',
          borderRadius: '10px',
          padding: '18px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          fontFamily: theme.fontMono,
          fontSize: '12.5px',
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'left',
          margin: '0 auto 32px auto',
          overflowX: 'auto',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.5 }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308', opacity: 0.5 }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.5 }} />
          </div>
          <pre style={{ marginTop: '0', marginBottom: 0, color: '#a5b4fc', whiteSpace: 'pre-wrap' }}>
{`{
  "status": "online",
  "gateway": "operational",
  "secure": true
}`}
          </pre>
        </div>

        {/* Action Controls with Micro-Interactions */}
        <div style={{ display: 'flex', gap: '14px', flexDirection: 'column' }}>
          <a 
            href={apiMeta.mainSiteUrl}
            style={{ 
              ...btnBaseStyle, 
              backgroundColor: theme.accentColor, 
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(100, 108, 255, 0.25)' 
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#535bf2';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(100, 108, 255, 0.35)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = theme.accentColor;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(100, 108, 255, 0.25)';
            }}
          >
            Return to Dashboard
          </a>
          
          <a 
            href={apiMeta.docsUrl}
            style={{ 
              ...btnBaseStyle, 
              backgroundColor: 'transparent', 
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)' 
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = theme.accentColor;
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.backgroundColor = 'rgba(100, 108, 255, 0.03)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Read API Documentation
          </a>
        </div>

      </div>

      {/* Footer Meta */}
      <p style={{
        fontSize: '11px',
        color: theme.textMuted,
        fontFamily: theme.fontMono,
        marginTop: '32px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase'
      }}>
        SECURE GATEWAY INTERCONNECT • © 2026
      </p>

    </div>
  );
}