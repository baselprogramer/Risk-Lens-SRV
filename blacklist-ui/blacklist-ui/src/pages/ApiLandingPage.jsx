import React, { useEffect, useState } from 'react';

export default function ApiWelcomePage() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Triggers the smooth cascading entrance sequence immediately after mounting
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const apiMeta = {
    title: "Production API Gateway",
    version: "v1.4.0",
    status: "Operational",
    description: "Welcome to our core system backend services. This subdomain is reserved for application data processing and programmatic access.",
    mainSiteUrl: "https://risk-lens.net", 
    docsUrl: "https://risk-lens.net/api-docs"  
  };

  // Inline configuration shortcuts mapped cleanly to your global styles
  const textMuted = '#94b4c8';
  const cyanAccent = '#00d4ff';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#071828', // Mapped to your global body background
      color: '#f0f9ff', // Mapped to your global text color
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* Structural Card Container utilizing your global transitions */}
      <div 
        className={`lp-rv ${animate ? 'lp-in' : ''}`}
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'rgba(4, 12, 24, 0.65)',
          border: '1px solid rgba(148, 180, 200, 0.1)',
          borderRadius: '16px',
          padding: '2.5em',
          boxShadow: '0 25px 50px -12px rgba(2, 6, 12, 0.7)',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          textAlign: 'center',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        
        {/* Subtle cyan alignment line utilizing your pulsing glow decoration rule */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '140px',
          height: '2px',
          backgroundColor: cyanAccent,
          animation: 'lpPd 4s infinite ease-in-out'
        }} />

        {/* 1. Header Frame Sequence */}
        <div style={{
          opacity: animate ? 1 : 0,
          transform: animate ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '28px',
          gap: '14px'
        }}>
          {/* Status Tracker Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(0, 212, 255, 0.05)',
            border: `1px solid rgba(0, 212, 255, 0.2)`,
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: cyanAccent,
            boxShadow: '0 0 12px rgba(0, 212, 255, 0.1)'
          }}>
            <span style={{ 
              height: '6px', 
              width: '6px', 
              borderRadius: '50%', 
              backgroundColor: cyanAccent,
              boxShadow: `0 0 8px ${cyanAccent}`
            }} />
            {apiMeta.status}
          </div>

          <div>
            <h1 style={{ 
              fontSize: '2.2rem', 
              lineHeight: '1.1', 
              margin: '4px 0 0 0', 
              color: '#ffffff', 
              fontWeight: '800',
              letterSpacing: '-0.5px'
            }}>
              {apiMeta.title}
            </h1>
            <p style={{ fontSize: '11px', fontFamily: theme => theme.fontMono, color: textMuted, marginTop: '8px', margin: 0, letterSpacing: '1px' }}>
              REVISION // <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{apiMeta.version}</span>
            </p>
          </div>
        </div>

        {/* 2. Main Description Section Frame */}
        <p style={{ 
          opacity: animate ? 1 : 0,
          transform: animate ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.6s ease 0.28s, transform 0.6s ease 0.28s',
          color: '#94b4c8', 
          fontSize: '14px', 
          lineHeight: '1.6', 
          maxWidth: '460px', 
          margin: '0 auto 28px auto' 
        }}>
          {apiMeta.description}
        </p>

        {/* 3. Programmatic Mock Terminal Block Frame */}
        <div style={{
          opacity: animate ? 1 : 0,
          transform: animate ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s',
          backgroundColor: '#040c18',
          borderRadius: '10px',
          padding: '18px',
          border: '1px solid rgba(148, 180, 200, 0.1)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '12.5px',
          color: '#94b4c8',
          textAlign: 'left',
          margin: '0 auto 32px auto',
          overflowX: 'auto',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.4 }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308', opacity: 0.4 }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00d4ff', opacity: 0.4 }} />
          </div>
          <pre style={{ marginTop: '0', marginBottom: 0, color: '#e0f2fe', whiteSpace: 'pre-wrap' }}>
{`{
  "status": "online",
  "gateway": "operational",
  "secure": true
}`}
          </pre>
        </div>

        {/* 4. Interactive Navigation Control Group Frame */}
        <div style={{ 
          opacity: animate ? 1 : 0,
          transform: animate ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.6s ease 0.52s, transform 0.6s ease 0.52s',
          display: 'flex', 
          gap: '12px', 
          flexDirection: 'row' 
        }}>
          <a 
            href={apiMeta.mainSiteUrl}
            style={{ 
              flex: 1,
              textAlign: 'center',
              padding: '0.7em 1.4em',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95em',
              textDecoration: 'none',
              cursor: 'pointer',
              backgroundColor: cyanAccent,
              color: '#040c18',
              transition: 'all 0.25s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#00b8de';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 212, 255, 0.35)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = cyanAccent;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Return to Main Page
          </a>
          
          <a 
            href={apiMeta.docsUrl}
            style={{ 
              flex: 1,
              textAlign: 'center',
              padding: '0.7em 1.4em',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95em',
              textDecoration: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.25s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = cyanAccent;
              e.currentTarget.style.color = cyanAccent;
              e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.04)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Read API Docs
          </a>
        </div>

      </div>

      {/* 5. Small Legal Layout Footer Base Frame */}
      <p style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'none' : 'translateY(8px)',
        transition: 'opacity 0.6s ease 0.65s, transform 0.6s ease 0.65s',
        fontSize: '11px',
        color: '#475569',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        marginTop: '32px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase'
      }}>
        SECURE GATEWAY INTERCONNECT • © 2026
      </p>

    </div>
  );
}