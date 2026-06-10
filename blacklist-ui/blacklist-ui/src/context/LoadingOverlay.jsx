"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

export const LoadingOverlay = ({ visible = true }) => {
  const globeRef = useRef(null);
  const scanRef = useRef(null);

  useEffect(() => {
    let frame;
    let angle = 0;
    let scanY = -50;
    let scanDir = 1;

    const tick = () => {
      angle = (angle + 0.3) % 360;
      scanY += scanDir * 0.6;
      if (scanY > 50 || scanY < -50) scanDir *= -1;

      if (globeRef.current) {
        globeRef.current.style.transform = `rotate(${angle}deg)`;
        globeRef.current.style.transformOrigin = "60px 60px";
      }
      if (scanRef.current) {
        scanRef.current.style.transform = `translateY(${scanY}px)`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#020c1a",
            overflow: "hidden",
          }}
        >
          {/* Grid background */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.5,
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 34px, rgba(0,212,255,0.04) 34px, rgba(0,212,255,0.04) 35px),
              repeating-linear-gradient(60deg, transparent, transparent 34px, rgba(0,212,255,0.04) 34px, rgba(0,212,255,0.04) 35px),
              repeating-linear-gradient(120deg, transparent, transparent 34px, rgba(0,212,255,0.04) 34px, rgba(0,212,255,0.04) 35px)
            `,
          }} />

          {/* Corner brackets */}
          {[
            { top: 24, left: 24, borderTop: "1.5px solid rgba(0,212,255,0.35)", borderLeft: "1.5px solid rgba(0,212,255,0.35)" },
            { top: 24, right: 24, borderTop: "1.5px solid rgba(0,212,255,0.35)", borderRight: "1.5px solid rgba(0,212,255,0.35)" },
            { bottom: 24, left: 24, borderBottom: "1.5px solid rgba(0,212,255,0.35)", borderLeft: "1.5px solid rgba(0,212,255,0.35)" },
            { bottom: 24, right: 24, borderBottom: "1.5px solid rgba(0,212,255,0.35)", borderRight: "1.5px solid rgba(0,212,255,0.35)" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 18, height: 18, ...s }} />
          ))}

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, position: "relative", zIndex: 2 }}
          >
            {/* Globe + shield ring */}
            <div style={{ position: "relative", width: 120, height: 120 }}>

              {/* Orbiting dots — rotated via CSS animation, offset with translateX */}
              {[
                { size: 8, color: "#00d4ff", dur: 3, r: 36, start: 0 },
                { size: 6, color: "#7c3aed", dur: 4.5, r: 44, start: 120 },
                { size: 5, color: "#00ffaa", dur: 2.2, r: 32, start: 240 },
              ].map((d, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 0,
                    height: 0,
                    animation: `orbit-${i} ${d.dur}s linear infinite`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: d.size,
                      height: d.size,
                      borderRadius: "50%",
                      backgroundColor: d.color,
                      boxShadow: `0 0 8px ${d.color}`,
                      transform: `translate(${d.r}px, -${d.size / 2}px)`,
                    }}
                  />
                  <style>{`
                    @keyframes orbit-${i} {
                      from { transform: rotate(${d.start}deg); }
                      to   { transform: rotate(${d.start + 360}deg); }
                    }
                  `}</style>
                </div>
              ))}

              {/* Globe SVG */}
              <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="gGrad" cx="38%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#0d2a4a" />
                    <stop offset="100%" stopColor="#020c1a" />
                  </radialGradient>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(0,212,255,0)" />
                    <stop offset="50%" stopColor="rgba(0,212,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(0,212,255,0)" />
                  </linearGradient>
                  <clipPath id="gClip"><circle cx="60" cy="60" r="50" /></clipPath>
                </defs>
                <circle cx="60" cy="60" r="50" fill="url(#gGrad)" stroke="rgba(0,212,255,0.35)" strokeWidth="1" />
                <g ref={globeRef} clipPath="url(#gClip)">
                  {[20, 35, 48, 58].map((rx, i) => (
                    <ellipse key={i} cx="60" cy="60" rx={rx} ry="50" fill="none"
                      stroke={`rgba(0,212,255,${0.18 - i * 0.03})`} strokeWidth="0.8" />
                  ))}
                  {[22, 40, 60, 80, 98].map((y, i) => (
                    <line key={i} x1="10" y1={y} x2="110" y2={y}
                      stroke={`rgba(0,212,255,${y === 60 ? 0.22 : y === 40 || y === 80 ? 0.13 : 0.07})`}
                      strokeWidth="0.8" />
                  ))}
                  <rect x="30" y="42" width="18" height="12" rx="2" fill="rgba(0,212,255,0.2)" stroke="rgba(0,212,255,0.4)" strokeWidth="0.5" />
                  <rect x="58" y="34" width="22" height="14" rx="2" fill="rgba(0,212,255,0.15)" stroke="rgba(0,212,255,0.35)" strokeWidth="0.5" />
                  <rect x="72" y="56" width="14" height="10" rx="2" fill="rgba(0,212,255,0.18)" stroke="rgba(0,212,255,0.3)" strokeWidth="0.5" />
                  <rect x="20" y="60" width="12" height="8" rx="2" fill="rgba(124,58,237,0.25)" stroke="rgba(124,58,237,0.5)" strokeWidth="0.5" />
                  <rect x="50" y="68" width="16" height="10" rx="2" fill="rgba(0,212,255,0.12)" stroke="rgba(0,212,255,0.25)" strokeWidth="0.5" />
                </g>
                <rect ref={scanRef} x="10" y="57" width="100" height="2"
                  fill="url(#scanGrad)" clipPath="url(#gClip)" opacity="0.8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,212,255,0.45)" strokeWidth="1.2" />
              </svg>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};