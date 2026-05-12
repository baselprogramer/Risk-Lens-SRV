import { useState, useEffect } from "react";

const EMPTY = {
  name: "", aliases: "", dateOfBirth: "",
  nationality: "", requestedBy: "", note: "",
};

/* shared input style */
const inputBase = (disabled) => ({
  width: "100%",
  padding: "11px 14px",
  background: disabled ? "#0a1020" : "#111c2e",
  border: "1px solid #1a2d4a",
  borderRadius: 9,
  fontSize: "0.87rem",
  boxSizing: "border-box",
  color: disabled ? "#3a5a7a" : "#e2e8f0",
  outline: "none",
  transition: "all 0.2s",
  fontFamily: "'IBM Plex Sans', sans-serif",
  cursor: disabled ? "not-allowed" : "text",
});

const Field = ({ label, required, hint, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display:"block", marginBottom:7, fontWeight:600,
      color:"#7a8fa8", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.5px" }}>
      {label}{required && <span style={{ color:"#ef4444", marginRight:4 }}> *</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize:"0.71rem", color:"#3a5a7a", marginTop:5 }}>{hint}</div>}
  </div>
);

const LocalSanctionForm = ({ onSubmit, selected, onCancel, disabled }) => {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(selected ? {
      name:        selected.name        || "",
      aliases:     selected.aliases     || "",
      dateOfBirth: selected.dateOfBirth || "",
      nationality: selected.nationality || "",
      requestedBy: selected.requestedBy || "",
      note:        selected.note        || "",
    } : EMPTY);
  }, [selected]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCancel = () => { setForm(EMPTY); onCancel?.(); };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name:        form.name.trim(),
      aliases: form.aliases? JSON.stringify( form.aliases.split(";").map(a => a.trim()).filter(Boolean)): null,
      dateOfBirth: form.dateOfBirth || null,
      nationality: form.nationality ? form.nationality.trim() : null,
      requestedBy: form.requestedBy ? form.requestedBy.trim() : null,
      note:        form.note        ? form.note.trim()        : null,
    });
    if (!selected) setForm(EMPTY);
  };

  const focusStyle  = { borderColor: "rgba(0,212,255,0.5)", boxShadow: "0 0 0 3px rgba(0,212,255,0.08)" };
  const blurStyle   = { borderColor: "#1a2d4a",             boxShadow: "none" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap');
        .ls-input:focus  { border-color: rgba(0,212,255,0.5) !important; box-shadow: 0 0 0 3px rgba(0,212,255,0.08) !important; }
        .ls-input:hover:not(:disabled) { border-color: rgba(0,212,255,0.25) !important; }
        .ls-submit:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); }
        .ls-cancel:hover:not(:disabled) { background: #1a2d4a !important; color: #e2e8f0 !important; }
      `}</style>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <Field label="Full Name" required>
          <input className="ls-input" type="text" name="name"
            value={form.name} onChange={handle} required disabled={disabled}
            placeholder="e.g. Ahmad Mohammed"
            style={inputBase(disabled)} />
        </Field>

        {/* Aliases */}
        <Field label="Aliases" hint="💡 Separate multiple aliases with semicolons (;)">
          <input className="ls-input" type="text" name="aliases"
            value={form.aliases} onChange={handle} disabled={disabled}
            placeholder="e.g. Abo Mohammad; Ahmad M."
            style={inputBase(disabled)} />
        </Field>

        {/* DOB + Nationality */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
          <Field label="Date of Birth">
            <input className="ls-input" type="date" name="dateOfBirth"
              value={form.dateOfBirth} onChange={handle} disabled={disabled}
              style={{
                ...inputBase(disabled),
                colorScheme: "dark",
              }} />
          </Field>
          <Field label="Nationality">
            <input className="ls-input" type="text" name="nationality"
              value={form.nationality} onChange={handle} disabled={disabled}
              placeholder="e.g. Syrian"
              style={inputBase(disabled)} />
          </Field>
        </div>

        {/* Requested By */}
        <Field label="Requested By">
          <input className="ls-input" type="text" name="requestedBy"
            value={form.requestedBy} onChange={handle} disabled={disabled}
            placeholder="e.g. Compliance Department"
            style={inputBase(disabled)} />
        </Field>

        {/* Note */}
        <Field label="Notes">
          <textarea className="ls-input" name="note"
            value={form.note} onChange={handle} rows={3} disabled={disabled}
            placeholder="Add any additional notes or remarks..."
            style={{ ...inputBase(disabled), resize:"vertical", lineHeight:1.6 }} />
        </Field>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <button type="submit" disabled={disabled} className="ls-submit"
            style={{
              background: disabled ? "#1a2d4a"
                : selected
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : "linear-gradient(135deg,#00d4ff,#8b5cf6)",
              color: disabled ? "#3a5a7a" : "#060912",
              padding: "11px 24px",
              border: "none", borderRadius: 9,
              fontSize: "0.87rem", fontWeight: 700,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: disabled ? "none"
                : selected
                  ? "0 4px 14px rgba(16,185,129,0.25)"
                  : "0 4px 14px rgba(0,212,255,0.22)",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
            {selected ? "✓ Update Sanction" : "➕ Add Sanction"}
          </button>

          {selected && (
            <button type="button" onClick={handleCancel} disabled={disabled}
              className="ls-cancel"
              style={{
                background: "#111c2e",
                color: "#7a8fa8",
                padding: "11px 20px",
                border: "1px solid #1a2d4a",
                borderRadius: 9, fontSize: "0.87rem", fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
              ✕ Cancel
            </button>
          )}
        </div>
      </form>
    </>
  );
};

export default LocalSanctionForm;