import { useState, useEffect } from "react";
import { User, Building2, Check, Plus, X } from "lucide-react";
import { useLang } from "../context/LangContext";
import { staticContent2 } from "../locales/content_2";

const EMPTY = {
  recordType: "PERSON",
  name: "", aliases: "", dateOfBirth: "",
  nationality: "", note: "",
  motherName: "", idNumber: "", issuingAuthority: "", additionalInfo: "",
  entityType: "", commercialRegNo: "",
};

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
  fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif",
  cursor: disabled ? "not-allowed" : "text",
});

const Field = ({ label, required, hint, children, half }) => (
  <div style={{ marginBottom: 16, flex: half ? "1 1 calc(50% - 7px)" : "1 1 100%", minWidth: 0 }}>
    <label style={{ display:"block", marginBottom:7, fontWeight:600,
      color:"#7a8fa8", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.5px" }}>
      {label}{required && <span style={{ color:"#ef4444", marginInlineStart:4 }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize:"0.71rem", color:"#3a5a7a", marginTop:5 }}>{hint}</div>}
  </div>
);

const LocalSanctionForm = ({ onSubmit, selected, onCancel, disabled }) => {
  const { lang } = useLang();
  const t = staticContent2.form?.[lang] || staticContent2.form?.en || {};
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(selected ? {
      recordType:       selected.recordType       || "PERSON",
      name:             selected.name             || "",
      aliases:          selected.aliases          || "",
      dateOfBirth:      selected.dateOfBirth      || "",
      nationality:      selected.nationality      || "",
      note:             selected.note             || "",
      motherName:       selected.motherName       || "",
      idNumber:         selected.idNumber         || "",
      issuingAuthority: selected.issuingAuthority || "",
      additionalInfo:   selected.additionalInfo   || "",
      entityType:       selected.entityType       || "",
      commercialRegNo:  selected.commercialRegNo  || "",
    } : EMPTY);
  }, [selected]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCancel = () => { setForm(EMPTY); onCancel?.(); };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      recordType:       form.recordType,
      name:             form.name.trim(),
      aliases:          form.aliases
                          ? JSON.stringify(form.aliases.split(";").map(a => a.trim()).filter(Boolean))
                          : null,
      dateOfBirth:      form.dateOfBirth      || null,
      nationality:      form.nationality      ? form.nationality.trim()      : null,
      note:             form.note             ? form.note.trim()             : null,
      motherName:       form.motherName       ? form.motherName.trim()       : null,
      idNumber:         form.idNumber         ? form.idNumber.trim()         : null,
      issuingAuthority: form.issuingAuthority ? form.issuingAuthority.trim() : null,
      additionalInfo:   form.additionalInfo   ? form.additionalInfo.trim()   : null,
      entityType:       form.entityType       ? form.entityType.trim()       : null,
      commercialRegNo:  form.commercialRegNo  ? form.commercialRegNo.trim()  : null,
    });
    if (!selected) setForm(EMPTY);
  };

  const isPerson = form.recordType === "PERSON";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');
        .ls-input:focus  { border-color: rgba(0,212,255,0.5) !important; box-shadow: 0 0 0 3px rgba(0,212,255,0.08) !important; }
        .ls-input:hover:not(:disabled) { border-color: rgba(0,212,255,0.25) !important; }
        .ls-submit:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); }
        .ls-cancel:hover:not(:disabled) { background: #1a2d4a !important; color: #e2e8f0 !important; }
        .ls-tab:hover:not(:disabled) { opacity: 0.85; }
      `}</style>

      <form onSubmit={handleSubmit}>

        {/* Record type toggle — only when adding */}
        {!selected && (
          <div style={{ display:"flex", gap:4, background:"#0a1020",
            border:"1px solid #1a2d4a", borderRadius:9, padding:3, marginBottom:18 }}>
            {[
              { val:"PERSON", label:t.person, Icon: User },
              { val:"ENTITY", label:t.entity, Icon: Building2 },
            ].map(({ val, label, Icon }) => (
              <button key={val} type="button" className="ls-tab"
                disabled={disabled}
                onClick={() => setForm(prev => ({ ...prev, recordType: val }))}
                style={{
                  flex:1, padding:"8px 0", borderRadius:7, border:"none",
                  fontSize:"0.78rem", fontWeight:700, cursor: disabled ? "not-allowed" : "pointer",
                  transition:"all .2s",
                  background: form.recordType === val ? "rgba(0,212,255,0.12)" : "transparent",
                  color:      form.recordType === val ? "#00d4ff"               : "#3a5a7a",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                  fontFamily:"'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif",
                }}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        )}

        {/* Name */}
        <Field label={isPerson ? t.fullName : t.companyName} required>
          <input className="ls-input" type="text" name="name"
            value={form.name} onChange={handle} required disabled={disabled}
            placeholder={isPerson ? t.namePlaceholderPerson : t.namePlaceholderEntity}
            style={inputBase(disabled)} />
        </Field>

        {/* ── PERSON ── */}
        {isPerson && (<>
          <Field label={t.aliases} hint={t.aliasesHint}>
            <input className="ls-input" type="text" name="aliases"
              value={form.aliases} onChange={handle} disabled={disabled}
              placeholder={t.aliasesPlaceholder}
              style={inputBase(disabled)} />
          </Field>

          <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
            <Field label={t.dateOfBirth} half>
              <input className="ls-input" type="date" name="dateOfBirth"
                value={form.dateOfBirth} onChange={handle} disabled={disabled}
                style={{ ...inputBase(disabled), colorScheme:"dark" }} />
            </Field>
            <Field label={t.nationality} half>
              <input className="ls-input" type="text" name="nationality"
                value={form.nationality} onChange={handle} disabled={disabled}
                placeholder={t.nationalityPlaceholder} style={inputBase(disabled)} />
            </Field>
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
            <Field label={t.motherName} half>
              <input className="ls-input" type="text" name="motherName"
                value={form.motherName} onChange={handle} disabled={disabled}
                placeholder={t.motherNamePlaceholder} style={inputBase(disabled)} />
            </Field>
            <Field label={t.idNumber} half>
              <input className="ls-input" type="text" name="idNumber"
                value={form.idNumber} onChange={handle} disabled={disabled}
                placeholder={t.idNumberPlaceholder} style={inputBase(disabled)} />
            </Field>
          </div>

          <Field label={t.issuingAuthority}>
            <input className="ls-input" type="text" name="issuingAuthority"
              value={form.issuingAuthority} onChange={handle} disabled={disabled}
              placeholder={t.issuingAuthorityPhPerson} style={inputBase(disabled)} />
          </Field>

          <Field label={t.additionalInfo}>
            <input className="ls-input" type="text" name="additionalInfo"
              value={form.additionalInfo} onChange={handle} disabled={disabled}
              placeholder={t.additionalInfoPlaceholder} style={inputBase(disabled)} />
          </Field>
        </>)}

        {/* ── ENTITY ── */}
        {!isPerson && (<>
          <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
            <Field label={t.entityType} half>
              <input className="ls-input" type="text" name="entityType"
                value={form.entityType} onChange={handle} disabled={disabled}
                placeholder={t.entityTypePlaceholder} style={inputBase(disabled)} />
            </Field>
            <Field label={t.commercialRegNo} half>
              <input className="ls-input" type="text" name="commercialRegNo"
                value={form.commercialRegNo} onChange={handle} disabled={disabled}
                placeholder={t.commercialRegNoPlaceholder} style={inputBase(disabled)} />
            </Field>
          </div>

          <Field label={t.issuingAuthority}>
            <input className="ls-input" type="text" name="issuingAuthority"
              value={form.issuingAuthority} onChange={handle} disabled={disabled}
              placeholder={t.issuingAuthorityPhEntity} style={inputBase(disabled)} />
          </Field>
        </>)}

        {/* Notes */}
        <Field label={t.note}>
          <textarea className="ls-input" name="note"
            value={form.note} onChange={handle} rows={3} disabled={disabled}
            placeholder={t.notePlaceholder}
            style={{ ...inputBase(disabled), resize:"vertical", lineHeight:1.6 }} />
        </Field>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <button type="submit" disabled={disabled} className="ls-submit"
            style={{
              background: disabled ? "#1a2d4a"
                : selected ? "linear-gradient(135deg,#10b981,#059669)"
                           : "linear-gradient(135deg,#00d4ff,#8b5cf6)",
              color: disabled ? "#3a5a7a" : "#060912",
              padding: "11px 24px", border: "none", borderRadius: 9,
              fontSize: "0.87rem", fontWeight: 700,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: disabled ? "none"
                : selected ? "0 4px 14px rgba(16,185,129,0.25)"
                           : "0 4px 14px rgba(0,212,255,0.22)",
              fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif",
              display:"flex", alignItems:"center", gap:6,
            }}>
            {/* lucide icons instead of ✓ / ➕ emoji — matches the rest of the app */}
            {selected ? <><Check size={14} strokeWidth={3}/> {t.submitUpdate}</>
                      : <><Plus  size={14} strokeWidth={3}/> {t.submitAdd}</>}
          </button>

          {selected && (
            <button type="button" onClick={handleCancel} disabled={disabled} className="ls-cancel"
              style={{
                background: "#111c2e", color: "#7a8fa8",
                padding: "11px 20px", border: "1px solid #1a2d4a",
                borderRadius: 9, fontSize: "0.87rem", fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontFamily: "'IBM Plex Sans', 'IBM Plex Sans Arabic', sans-serif",
                display:"flex", alignItems:"center", gap:6,
              }}>
              <X size={14} strokeWidth={3}/> {t.cancel}
            </button>
          )}
        </div>

      </form>
    </>
  );
};

export default LocalSanctionForm;