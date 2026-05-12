export default function SanctionDetails({ sanction }) {
  if (!sanction) return null;
  // لو في أكثر من source — عرضهم كلهم
  const sources = sanction.source
    ? sanction.source.split("|").map(s => s.trim())
    : [];

  // لو التفاصيل array (أكثر من source)
  if (Array.isArray(sanction.details)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sources.map((src, i) => (
          <div key={i}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00d4ff",
              marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>
              {src}
            </div>
            <SanctionDetails sanction={{ ...sanction.details[i], source: src }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { font-family: 'IBM Plex Sans', sans-serif; box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .sd-row:hover { background: rgba(0,212,255,0.04) !important; }
      `}</style>

      <div style={{ animation: "fadeUp .35s ease" }}>

        {/* ── NAME HEADER ── */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22,
          paddingBottom:18, borderBottom:"1px solid #1a2d4a" }}>
          <div style={{ width:4, height:36, background:"linear-gradient(180deg,#00d4ff,#8b5cf6)", borderRadius:4 }} />
          <div>
            <h2 style={{ margin:0, fontSize:"1.4rem", fontWeight:700, color:"#e2e8f0", letterSpacing:"-0.3px" }}>
              {sanction.name}
            </h2>
            <div style={{ display:"flex", gap:8, marginTop:7, flexWrap:"wrap" }}>
              {sanction.source && <Badge label={sanction.source} color="#00d4ff" />}
              {sanction.sdnType && <Badge label={sanction.sdnType} color="#8b5cf6" />}
              {sanction.ofacUid && (
                <span style={{ fontSize:"0.7rem", color:"#3a5a7a",
                  fontFamily:"'JetBrains Mono',monospace", alignSelf:"center" }}>
                  UID: {sanction.ofacUid}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTIONS ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Basic Info */}
          <Section title="Basic Information" icon="📋">
            <InfoTable>
              <InfoRow label="OFAC UID" value={sanction.ofacUid} mono />
              <InfoRow label="Source"   value={sanction.source}  />
              <InfoRow label="Type"     value={sanction.sdnType} />
            </InfoTable>
          </Section>

          {/* Programs */}
          {Array.isArray(sanction.program) && sanction.program.length > 0 && (
            <Section title="Programs" icon="🎯">
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", padding:"10px 14px" }}>
                {sanction.program.map((p, i) => (
                  <span key={i} style={{ padding:"4px 12px", borderRadius:6,
                    background:"rgba(245,158,11,0.1)", color:"#f59e0b",
                    border:"1px solid rgba(245,158,11,0.25)",
                    fontSize:"0.78rem", fontWeight:600,
                    fontFamily:"'JetBrains Mono',monospace" }}>
                    {p}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Date of Birth */}
          {Array.isArray(sanction.dateOfBirth) && sanction.dateOfBirth.length > 0 && (
            <Section title="Date of Birth" icon="📅">
              <InfoTable>
                {sanction.dateOfBirth.map((d, i) => (
                  <InfoRow key={i} label={`DOB ${i + 1}`} value={d.dateOfBirth} mono />
                ))}
              </InfoTable>
            </Section>
          )}

          {/* Nationality */}
          {Array.isArray(sanction.nationality) && sanction.nationality.length > 0 && (
            <Section title="Nationality" icon="🌍">
              <InfoTable>
                {sanction.nationality.map((n, i) => (
                  <InfoRow
                    key={i}
                    label={n.mainEntry ? "Primary" : `Nationality ${i + 1}`}
                    value={n.country}
                    highlight={n.mainEntry}
                  />
                ))}
              </InfoTable>
            </Section>
          )}

          {/* Aliases */}
          {Array.isArray(sanction.aliases) && sanction.aliases.length > 0 && (
            <Section title="Aliases" icon="👤">
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#0a1020" }}>
                      {["Name","Type","Category"].map(h => (
                        <th key={h} style={{ padding:"9px 14px", textAlign:"left",
                          fontSize:"0.65rem", fontWeight:700, color:"#3a5a7a",
                          letterSpacing:"0.8px", textTransform:"uppercase",
                          borderBottom:"1px solid #1a2d4a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sanction.aliases.map((a, i) => (
                      <tr key={i} className="sd-row" style={{ borderBottom:"1px solid #111c2e", transition:"background .15s" }}>
                        <td style={{ padding:"10px 14px", fontSize:"0.85rem", fontWeight:600, color:"#e2e8f0" }}>
                          {[a.firstName, a.lastName].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td style={{ padding:"10px 14px" }}>
                          {a.type ? (
                            <span style={{ padding:"2px 9px", borderRadius:5,
                              background:"rgba(139,92,246,0.1)", color:"#a78bfa",
                              border:"1px solid rgba(139,92,246,0.2)",
                              fontSize:"0.72rem", fontWeight:600,
                              fontFamily:"'JetBrains Mono',monospace" }}>
                              {a.type}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding:"10px 14px", fontSize:"0.82rem", color:"#7a8fa8" }}>
                          {a.category || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Addresses */}
          {Array.isArray(sanction.addresses) && sanction.addresses.length > 0 && (
            <Section title="Addresses" icon="📍">
              <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"10px 14px" }}>
                {sanction.addresses.map((a, i) => (
                  <div key={i} style={{ padding:"10px 14px", background:"#0a1020",
                    border:"1px solid #1a2d4a", borderRadius:9,
                    fontSize:"0.84rem", color:"#94a3b8", lineHeight:1.6 }}>
                    <span style={{ marginLeft:6, fontSize:"0.65rem", color:"#3a5a7a",
                      fontFamily:"'JetBrains Mono',monospace" }}>
                      #{i+1}
                    </span>{"  "}
                    {Object.entries(a)
                      .filter(([,v]) => v)
                      .map(([,v]) => v)
                      .join(", ")}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Identifiers */}
          {Array.isArray(sanction.ids) && sanction.ids.length > 0 && (
            <Section title="Identifiers" icon="🪪">
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#0a1020" }}>
                      {["ID Type","ID Number"].map(h => (
                        <th key={h} style={{ padding:"9px 14px", textAlign:"left",
                          fontSize:"0.65rem", fontWeight:700, color:"#3a5a7a",
                          letterSpacing:"0.8px", textTransform:"uppercase",
                          borderBottom:"1px solid #1a2d4a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sanction.ids.map((id, i) => (
                      <tr key={i} className="sd-row" style={{ borderBottom:"1px solid #111c2e", transition:"background .15s" }}>
                        <td style={{ padding:"10px 14px", fontSize:"0.83rem", color:"#94a3b8" }}>
                          {id.idType || "—"}
                        </td>
                        <td style={{ padding:"10px 14px", fontSize:"0.83rem", color:"#e2e8f0",
                          fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>
                          {id.idNumber || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════ */

function Section({ title, icon, children }) {
  return (
    <div style={{ background:"#0d1321", border:"1px solid #1a2d4a",
      borderRadius:12, overflow:"hidden" }}>
      {/* Section header */}
      <div style={{ padding:"11px 16px", borderBottom:"1px solid #1a2d4a",
        display:"flex", alignItems:"center", gap:8,
        background:"rgba(0,212,255,0.03)" }}>
        <span style={{ fontSize:"0.95rem" }}>{icon}</span>
        <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#7a8fa8",
          textTransform:"uppercase", letterSpacing:"0.6px" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function InfoTable({ children }) {
  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <tbody>{children}</tbody>
    </table>
  );
}

function InfoRow({ label, value, mono, highlight }) {
  return (
    <tr className="sd-row" style={{ borderBottom:"1px solid #111c2e", transition:"background .15s" }}>
      <td style={{ padding:"10px 16px", fontSize:"0.75rem", fontWeight:700,
        color:"#3a5a7a", textTransform:"uppercase", letterSpacing:"0.5px",
        width:180, whiteSpace:"nowrap" }}>
        {label}
      </td>
      <td style={{ padding:"10px 16px",
        fontSize: mono ? "0.82rem" : "0.86rem",
        fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit",
        color: highlight ? "#00d4ff" : "#e2e8f0",
        fontWeight: highlight ? 600 : 400,
      }}>
        {value ?? <span style={{ color:"#3a5a7a" }}>—</span>}
      </td>
    </tr>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ padding:"3px 10px", borderRadius:6, fontSize:"0.72rem", fontWeight:700,
      background:`${color}12`, color, border:`1px solid ${color}28`,
      fontFamily:"'JetBrains Mono',monospace" }}>
      {label}
    </span>
  );
}