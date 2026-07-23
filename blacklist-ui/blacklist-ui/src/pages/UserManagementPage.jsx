import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  Users, Plus, Trash2, RefreshCw, Shield, ShieldHalf, User, UserCheck,
  Key, Building2, GitBranch, ChevronDown, ChevronRight, X, AlertTriangle
} from "lucide-react";
import { API_V1 } from "../config/api";
import { isSuperAdmin, isCompanyAdmin } from "../services/authService";
import { useLang } from "../context/LangContext";
import { staticContent2 } from "../locales/content_2";

const token   = () => localStorage.getItem("jwtToken");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981", blue:"#60a5fa",
  red:"#ef4444", orange:"#f59e0b", amber:"#f59e0b", text:"#e2e8f0", text2:"#7a8fa8",
};

// ── الأدوار الستّة: لون + أيقونة + هل مربوط بفرع ──
const ROLE_META = {
  SUPER_ADMIN:        { color:"#f59e0b", Icon:Shield,     branchScoped:false },
  COMPANY_ADMIN:      { color:C.cyan,    Icon:Shield,     branchScoped:false },
  COMPLIANCE_MANAGER: { color:C.cyan,    Icon:ShieldHalf, branchScoped:false },
  COMPLIANCE_OFFICER: { color:C.blue,    Icon:UserCheck,  branchScoped:true  },
  BRANCH_MANAGER:     { color:C.purple,  Icon:GitBranch,  branchScoped:true  },
  TELLER:             { color:C.green,   Icon:User,       branchScoped:true  },
};
const roleMeta = (r) => ROLE_META[r] || { color:C.text2, Icon:User, branchScoped:false };

export default function UserManagementPage() {

  const {lang} = useLang()
  const t = staticContent2.userManagement?.[lang] || staticContent2.userManagement?.en || {};
  const isRtl = lang === "ar";

  const [users, setUsers]           = useState([]);
  const [branches, setBranches]     = useState([]);
  const [appointable, setAppointable] = useState([]);   // الأدوار اللي بقدر أنشئها
  const [tenants, setTenants]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [newPass, setNewPass]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState(null);
  const [expanded, setExpanded]     = useState({});

  const [form, setForm] = useState({ username:"", password:"", role:"", tenantId:"", branchId:"" });

  const superAdmin   = isSuperAdmin();
  const companyAdmin = isCompanyAdmin();

  useEffect(() => {
    fetchUsers();
    fetchAppointable();
    if (superAdmin) fetchTenants();
    else fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMsg = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_V1}/admin/users`, { headers: headers() });
      if (r.ok) setUsers(await r.json());
      else showMsg(t.msgLoadFailed, false);
    } catch { showMsg(t.msgLoadFailed, false); }
    finally { setLoading(false); }
  };

  const fetchAppointable = async () => {
    try {
      const r = await fetch(`${API_V1}/auth/appointable-roles`, { headers: headers() });
      if (r.ok) setAppointable(await r.json());
    } catch (e) { console.error(e); }
  };

  const fetchBranches = async () => {
    try {
      const r = await fetch(`${API_V1}/branches/active`, { headers: headers() });
      if (r.ok) setBranches(await r.json());
    } catch (e) { console.error(e); }
  };

  const fetchTenants = async () => {
    try {
      const r = await fetch(`${API_V1}/super/tenants`, { headers: headers() });
      if (r.ok) setTenants(await r.json());
    } catch (e) { console.error(e); }
  };

  const branchName = (id) => {
    const b = branches.find(x => x.id === id);
    return b ? (b.name + (b.code ? ` (${b.code})` : "")) : `#${id}`;
  };

  const needsBranch = form.role && roleMeta(form.role).branchScoped;

  const handleCreate = async () => {
    if (!form.username.trim() || !form.password.trim() || !form.role) return;
    if (superAdmin && !form.tenantId) { showMsg("Select a company", false); return; }
    if (needsBranch && !form.branchId) { showMsg(t.branchRequiredNote, false); return; }

    const body = {
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      // للـ SUPER: tenant من الاختيار. لغيرو: الـ backend بيفرضو من المنشئ (منبعت null)
      tenantId: superAdmin ? parseInt(form.tenantId) : null,
      branchId: needsBranch ? parseInt(form.branchId) : null,
    };

    setSaving(true);
    try {
      const r = await fetch(`${API_V1}/auth/register`, {
        method:"POST", headers: headers(), body: JSON.stringify(body),
      });
      const text = await r.text();
      if (!r.ok) { showMsg(text || t.msgFailed, false); return; }
      showMsg(t.msgUserCreated);
      setForm({ username:"", password:"", role:"", tenantId:"", branchId:"" });
      setShowCreate(false);
      fetchUsers();
    } catch { showMsg(t.msgError, false); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) { showMsg(t.msgMinChars, false); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API_V1}/admin/users/${resetModal.id}/password`, {
        method:"PUT", headers: headers(), body: JSON.stringify({ newPassword: newPass }),
      });
      if (!r.ok) { showMsg(t.msgFailed, false); return; }
      showMsg(t.msgPasswordReset);
      setResetModal(null); setNewPass("");
    } catch { showMsg(t.msgError, false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`${t.confirmDelete} "${user.username}"?`)) return;
    try {
      const r = await fetch(`${API_V1}/admin/users/${user.id}`, { method:"DELETE", headers: headers() });
      if (!r.ok) { showMsg(t.msgFailed, false); return; }
      showMsg(t.msgUserDeleted);
      fetchUsers();
    } catch { showMsg(t.msgError, false); }
  };

  // ══════════════ بناء الشجرة من appointedBy ══════════════
  const buildForest = (list) => {
    const byId = new Map(list.map(u => [u.id, u]));
    const children = new Map();
    const roots = [];
    for (const u of list) {
      const parent = u.appointedBy;
      if (parent != null && byId.has(parent)) {
        if (!children.has(parent)) children.set(parent, []);
        children.get(parent).push(u);
      } else {
        roots.push(u);
      }
    }
    return { children, roots };
  };

  const availableActions = { onReset:(u)=>{ setResetModal(u); setNewPass(""); }, onDelete:handleDelete };

  return (
    <Layout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .um-btn{cursor:pointer;transition:all .2s;font-family:'IBM Plex Sans',sans-serif;}
        .um-btn:hover{filter:brightness(1.12);}
        .um-btn:disabled{opacity:.5;cursor:not-allowed;filter:none;}
        .um-node:hover{background:rgba(0,212,255,0.04)!important;}
        .um-icon-btn{background:transparent;border:none;cursor:pointer;padding:5px;border-radius:6px;display:inline-flex;transition:all .2s;color:#7a8fa8;}
        .um-icon-btn:hover{background:rgba(0,212,255,0.08);}
        .um-input{width:100%;padding:9px 12px;background:#111c2e;border:1px solid #1a2d4a;border-radius:8px;color:#e2e8f0;font-size:13px;outline:none;box-sizing:border-box;transition:border .2s;font-family:'IBM Plex Sans',sans-serif;}
        .um-input:focus{border-color:rgba(0,212,255,.5);}
      `}</style>

      <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", animation:"fadeUp .4s ease" }} dir={isRtl ? "rtl" : "ltr"}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:4, height:36, background:`linear-gradient(180deg,${C.cyan},${C.purple})`, borderRadius:2 }} />
            <div>
              <h2 style={{ margin:0, fontSize:21, fontWeight:700, color:C.text }}>{t.pageTitle}</h2>
              <p style={{ margin:0, fontSize:12, color:C.text2, marginTop:2 }}>
                {superAdmin ? t.subtitleSuper : t.subtitleAdmin}
              </p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="um-btn" onClick={fetchUsers} title={t.refresh}
              style={{ background:C.s2, border:`1px solid ${C.border}`, color:C.text2, padding:"9px 12px", borderRadius:9, display:"flex", alignItems:"center" }}>
              <RefreshCw size={14}/>
            </button>
            <button className="um-btn" onClick={()=>setShowCreate(v=>!v)}
              style={{ background:`linear-gradient(135deg,${C.cyan},${C.purple})`, border:"none", color:C.bg, padding:"9px 16px", borderRadius:9, display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700 }}>
              <Plus size={14}/> {t.newUserBtn}
            </button>
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{ marginBottom:14, padding:"11px 16px", borderRadius:10,
            background: msg.ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border:`1px solid ${msg.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: msg.ok ? C.green : C.red, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:7 }}>
            {!msg.ok && <AlertTriangle size={14}/>}{msg.text}
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", marginBottom:18, position:"relative", overflow:"hidden", animation:"fadeUp .3s ease" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14, display:"flex", alignItems:"center", gap:7 }}>
              <Plus size={14} color={C.cyan}/> {t.createTitle}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:12 }}>
              <div>
                <label style={labelS}>{t.usernameLabel}</label>
                <input className="um-input" value={form.username} placeholder={t.usernamePlaceholder}
                  onChange={e=>setForm({ ...form, username:e.target.value })}/>
              </div>
              <div>
                <label style={labelS}>{t.passwordLabel}</label>
                <input className="um-input" type="password" value={form.password} placeholder={t.passwordPlaceholder}
                  onChange={e=>setForm({ ...form, password:e.target.value })}/>
              </div>

              {/* الدور — من appointable-roles */}
              <div>
                <label style={labelS}>{t.roleLabel}</label>
                <select className="um-input" style={{ cursor:"pointer" }} value={form.role}
                  onChange={e=>setForm({ ...form, role:e.target.value, branchId:"" })}>
                  <option value="">{t.selectRolePlaceholder}</option>
                  {appointable.map(r => <option key={r} value={r}>{t.roleLabels[r] || r}</option>)}
                </select>
              </div>

              {/* الشركة — SUPER فقط */}
              {superAdmin && (
                <div>
                  <label style={labelS}><Building2 size={10}/> {t.companyLabel}</label>
                  <select className="um-input" style={{ cursor:"pointer" }} value={form.tenantId}
                    onChange={e=>setForm({ ...form, tenantId:e.target.value })}>
                    <option value="">{t.noCompanyOption}</option>
                    {tenants.map(tn => <option key={tn.id} value={tn.id}>{tn.name} ({tn.code})</option>)}
                  </select>
                </div>
              )}

              {/* الفرع — للأدوار المربوطة بفرع فقط */}
              {needsBranch && (
                <div>
                  <label style={labelS}><GitBranch size={10}/> {t.branchLabel}</label>
                  <select className="um-input" style={{ cursor:"pointer" }} value={form.branchId}
                    onChange={e=>setForm({ ...form, branchId:e.target.value })}>
                    <option value="">{t.selectBranchPlaceholder}</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.code ? ` (${b.code})` : ""}</option>)}
                  </select>
                </div>
              )}
            </div>

            {needsBranch && branches.length === 0 && (
              <div style={{ marginBottom:12, fontSize:12, color:C.orange, display:"flex", alignItems:"center", gap:6 }}>
                <AlertTriangle size={13}/> {t.noBranchesHint}
              </div>
            )}

            <div style={{ display:"flex", gap:8 }}>
              <button className="um-btn" onClick={handleCreate} disabled={saving}
                style={{ background:`linear-gradient(135deg,${C.cyan},${C.purple})`, border:"none", color:C.bg, padding:"9px 24px", borderRadius:8, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                <Plus size={13}/>{saving ? t.creatingBtn : t.createBtn}
              </button>
              <button className="um-btn" onClick={()=>setShowCreate(false)}
                style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.text2, padding:"9px 18px", borderRadius:8, fontWeight:600, fontSize:13 }}>
                {t.cancelBtn}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:"center", padding:"50px 0" }}>
            <div style={{ width:28, height:28, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.cyan}`, borderRadius:"50%", animation:"spin 1s linear infinite", display:"inline-block" }} />
          </div>
        ) : superAdmin ? (
          <SuperAdminView users={users} tenants={tenants} expanded={expanded} setExpanded={setExpanded}
            t={t} isRtl={isRtl} actions={availableActions} branchName={branchName} buildForest={buildForest}/>
        ) : (
          <CompanyView users={users} t={t} isRtl={isRtl} actions={availableActions}
            branchName={branchName} buildForest={buildForest}/>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetModal && (
        <div onClick={()=>!saving && setResetModal(null)}
          style={{ position:"fixed", inset:0, background:"rgba(3,6,12,.72)", backdropFilter:"blur(3px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
          <div dir={isRtl ? "rtl" : "ltr"} onClick={e=>e.stopPropagation()}
            style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 22px", width:"100%", maxWidth:380, animation:"modalIn .22s ease both", boxShadow:"0 24px 60px rgba(0,0,0,.5)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, display:"flex", alignItems:"center", gap:7 }}>
                <Key size={14} color={C.orange}/> {t.resetPasswordTitle}
              </div>
              <button className="um-icon-btn" onClick={()=>setResetModal(null)}><X size={17}/></button>
            </div>
            <div style={{ fontSize:13, color:C.text2, marginBottom:14 }}>
              {t.userLabel} <span style={{ color:C.cyan, fontWeight:600 }}>{resetModal.username}</span>
            </div>
            <input className="um-input" type="password" value={newPass} placeholder={t.newPasswordPlaceholder}
              onChange={e=>setNewPass(e.target.value)} style={{ marginBottom:14 }} autoFocus/>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="um-btn" onClick={()=>setResetModal(null)}
                style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.text2, padding:"9px 16px", borderRadius:8, fontSize:13, fontWeight:600 }}>{t.cancelBtn}</button>
              <button className="um-btn" onClick={handleResetPassword} disabled={saving}
                style={{ background:`linear-gradient(135deg,${C.orange},${C.purple})`, border:"none", color:"#fff", padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:700 }}>
                {saving ? "…" : t.resetBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const labelS = { fontSize:10, color:C.text2, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.4px" };

// ══════════════ TreeNode — عقدة بالشجرة + أطفالها ══════════════
function TreeNode({ user, children, depth, t, isRtl, actions, branchName }) {
  const meta = roleMeta(user.role);
  const kids = children.get(user.id) || [];
  const Icon = meta.Icon;

  return (
    <div>
      <div className="um-node"
        style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, transition:"background .15s" }}>
        <div style={{ width:28, height:28, borderRadius:7, background:`${meta.color}1f`, border:`1px solid ${meta.color}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon size={14} color={meta.color}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.username}</div>
        </div>

        {user.branchId != null && (
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, color:"#8b5cf6", fontSize:11, background:"rgba(139,92,246,0.1)", border:"0.5px solid rgba(139,92,246,0.25)", padding:"2px 8px", borderRadius:6, whiteSpace:"nowrap" }}>
            <GitBranch size={11}/>{branchName(user.branchId)}
          </span>
        )}

        <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:meta.color, background:`${meta.color}14`, border:`1px solid ${meta.color}33`, padding:"2px 8px", borderRadius:5, whiteSpace:"nowrap" }}>
          {(t.roleLabels[user.role] || user.role)}
        </span>

        <span style={{ fontSize:10, color:C.text2, fontFamily:"'JetBrains Mono',monospace" }}>#{user.id}</span>

        <div style={{ display:"flex", gap:2 }}>
          <button className="um-icon-btn" title={t.resetTooltip} onClick={()=>actions.onReset(user)}
            onMouseEnter={e=>e.currentTarget.style.color="#f59e0b"} onMouseLeave={e=>e.currentTarget.style.color="#7a8fa8"}>
            <Key size={13}/>
          </button>
          <button className="um-icon-btn" title={t.deleteTooltip} onClick={()=>actions.onDelete(user)}
            onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#7a8fa8"}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>

      {kids.length > 0 && (
        <div style={{ marginInlineStart:13, borderInlineStart:`1.5px solid ${C.border}`, paddingInlineStart:14, marginTop:4 }}>
          {kids.map(k => (
            <div key={k.id} style={{ marginTop:6 }}>
              <TreeNode user={k} children={children} depth={depth+1} t={t} isRtl={isRtl} actions={actions} branchName={branchName}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════ COMPANY_ADMIN — شجرة شركتو ══════════════
function CompanyView({ users, t, isRtl, actions, branchName, buildForest }) {
  const { children, roots } = buildForest(users);

  if (users.length === 0) {
    return (
      <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, padding:"40px 20px", textAlign:"center", color:C.text2, fontSize:13, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
        <Users size={32} color="#3a5a7a" style={{ opacity:.4 }}/>{t.noTeamMembers}
      </div>
    );
  }

  return (
    <div style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
      <div style={{ height:2, background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />
      <div style={{ padding:"14px 16px" }}>
        {roots.map(r => (
          <div key={r.id} style={{ marginTop:6 }}>
            <TreeNode user={r} children={children} depth={0} t={t} isRtl={isRtl} actions={actions} branchName={branchName}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════ SUPER_ADMIN — شركات، كل وحدة شجرتها ══════════════
function SuperAdminView({ users, tenants, expanded, setExpanded, t, isRtl, actions, branchName, buildForest }) {
  const superAdmins = users.filter(u => u.role === "SUPER_ADMIN");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Super admins */}
      {superAdmins.length > 0 && (
        <div style={{ background:C.s1, border:"1px solid rgba(245,158,11,0.3)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ height:2, background:"linear-gradient(90deg,#f59e0b,#8b5cf6)" }} />
          <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:8, background:"rgba(245,158,11,0.05)", borderBottom:`1px solid ${C.border}` }}>
            <Shield size={14} color="#f59e0b"/>
            <span style={{ fontSize:13, fontWeight:700, color:"#f59e0b" }}>{t.roleLabels.SUPER_ADMIN}</span>
            <span style={{ marginInlineStart:"auto", fontSize:11, color:C.text2 }}>{superAdmins.length}</span>
          </div>
          <div style={{ padding:"8px 16px" }}>
            {superAdmins.map(u => (
              <div key={u.id} style={{ marginTop:4 }}>
                <TreeNode user={u} children={new Map()} depth={0} t={t} isRtl={isRtl} actions={actions} branchName={branchName}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* كل شركة → شجرتها */}
      {tenants.map(tn => {
        const tenantUsers = users.filter(u => u.tenantId === tn.id && u.role !== "SUPER_ADMIN");
        const { children, roots } = buildForest(tenantUsers);
        const isOpen = expanded[tn.id];
        return (
          <div key={tn.id} style={{ background:C.s1, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ height:2, background:`linear-gradient(90deg,${C.cyan},${C.purple})` }} />
            <div onClick={()=>setExpanded(p=>({ ...p, [tn.id]:!p[tn.id] }))}
              style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", background:"rgba(0,212,255,0.03)", borderBottom: isOpen ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.cyan}22,${C.purple}22)`, border:`1px solid ${C.cyan}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:C.cyan }}>
                {tn.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{tn.name}</div>
                <div style={{ fontSize:10, color:C.text2, fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                  {tn.code} · {tenantUsers.length} {t.companyWide === "company-wide" ? "users" : ""}
                </div>
              </div>
              {isOpen ? <ChevronDown size={15} color={C.text2}/> : <ChevronRight size={15} color={C.text2} style={{ transform: isRtl ? "rotate(180deg)" : "none" }}/>}
            </div>
            {isOpen && (
              <div style={{ padding:"12px 16px", animation:"fadeUp .2s ease" }}>
                {tenantUsers.length === 0 ? (
                  <div style={{ padding:"14px 6px", fontSize:12, color:C.text2, display:"flex", alignItems:"center", gap:6 }}>
                    <User size={12}/> {t.noUsers}
                  </div>
                ) : roots.map(r => (
                  <div key={r.id} style={{ marginTop:6 }}>
                    <TreeNode user={r} children={children} depth={0} t={t} isRtl={isRtl} actions={actions} branchName={branchName}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}