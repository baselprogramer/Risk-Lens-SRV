import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Users, Plus, Trash2, RefreshCw, Shield, User, Key, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { API_V1 } from "../config/api";
import { isSuperAdmin, isCompanyAdmin } from "../services/authService";

const token   = () => localStorage.getItem("jwtToken");
const headers = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${token()}` });

const C = {
  bg:"#060912", s1:"#0d1321", s2:"#111c2e", border:"#1a2d4a",
  cyan:"#00d4ff", purple:"#8b5cf6", green:"#10b981",
  red:"#ef4444", orange:"#f59e0b", text:"#e2e8f0", text2:"#7a8fa8",
};

const roleConfig = {
  SUPER_ADMIN:   { color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  label:"SUPER ADMIN"   },
  COMPANY_ADMIN: { color:C.cyan,    bg:"rgba(0,212,255,0.12)",   label:"COMPANY ADMIN" },
  SUBSCRIBER:    { color:C.green,   bg:"rgba(16,185,129,0.12)",  label:"SUBSCRIBER"    },
};

const getRoleIcon = (role, size=14) => {
  if (role === "SUPER_ADMIN")   return <Shield size={size} color="#f59e0b"/>;
  if (role === "COMPANY_ADMIN") return <Shield size={size} color={C.cyan}/>;
  return <User size={size} color={C.green}/>;
};

const getAvailableRoles = () => {
  if (isSuperAdmin())   return ["SUBSCRIBER", "COMPANY_ADMIN", "SUPER_ADMIN"];
  if (isCompanyAdmin()) return ["SUBSCRIBER"];
  return ["SUBSCRIBER"];
};

const inp = {
  width:"100%", padding:"9px 12px", background:C.s2,
  border:`1px solid ${C.border}`, borderRadius:8, color:C.text,
  fontSize:13, outline:"none", boxSizing:"border-box",
};

export default function UserManagementPage() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [newUser,    setNewUser]    = useState({ username:"", password:"", role:"SUBSCRIBER", tenantId:"" });
  const [newPass,    setNewPass]    = useState("");
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [tenants,    setTenants]    = useState([]);
  const [expanded,   setExpanded]   = useState({}); // للـ SUPER_ADMIN — expand company

  useEffect(() => {
    fetchUsers();
    if (isSuperAdmin()) fetchTenants();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_V1}/admin/users`, { headers: headers() });
      if (res.ok) setUsers(await res.json());
    } catch { showMsg("Failed to load users", false); }
    finally { setLoading(false); }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_V1}/super/tenants`, { headers: headers() });
      if (res.ok) setTenants(await res.json());
    } catch(e) { console.error(e); }
  };

  const showMsg = (text, ok=true) => { setMsg({text,ok}); setTimeout(()=>setMsg(null), 3000); };

  const handleCreate = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) return;

    // COMPANY_ADMIN يضيف مشتركين تحت tenantId الخاص فيه
    const tenantId = isSuperAdmin()
      ? (newUser.tenantId ? parseInt(newUser.tenantId) : null)
      : parseInt(localStorage.getItem("tenantId") || "0") || null;

    setSaving(true);
    try {
      const res = await fetch(`${API_V1}/auth/register`, {
        method:"POST", headers:headers(),
        body:JSON.stringify({ username:newUser.username, password:newUser.password,
          role:newUser.role, tenantId }),
      });
      const text = await res.text();
      if (!res.ok) { showMsg(text, false); return; }
      showMsg("User created ✅");
      setNewUser({ username:"", password:"", role:"SUBSCRIBER", tenantId:"" });
      setShowCreate(false);
      fetchUsers();
    } finally { setSaving(false); }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      const res = await fetch(`${API_V1}/admin/users/${user.id}/role`, {
        method:"PUT", headers:headers(), body:JSON.stringify({role:newRole}),
      });
      if (!res.ok) { showMsg("Failed", false); return; }
      showMsg(`${user.username} → ${newRole} ✅`);
      fetchUsers();
    } catch { showMsg("Error", false); }
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) { showMsg("Min 6 characters", false); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_V1}/admin/users/${resetModal.id}/password`, {
        method:"PUT", headers:headers(), body:JSON.stringify({newPassword:newPass}),
      });
      if (!res.ok) { showMsg("Failed", false); return; }
      showMsg("Password reset ✅");
      setResetModal(null); setNewPass("");
    } finally { setSaving(false); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete "${user.username}"?`)) return;
    try {
      const res = await fetch(`${API_V1}/admin/users/${user.id}`, { method:"DELETE", headers:headers() });
      if (!res.ok) { showMsg("Failed", false); return; }
      showMsg("User deleted ✅");
      fetchUsers();
    } catch { showMsg("Error", false); }
  };

  // ── SUPER_ADMIN: group users by tenant ──
  const groupByTenant = () => {
    const companyAdmins = users.filter(u => u.role === "COMPANY_ADMIN");
    const superAdmins   = users.filter(u => u.role === "SUPER_ADMIN");
    const noTenant      = users.filter(u => !u.tenantId && u.role === "SUBSCRIBER");

    const groups = tenants.map(t => ({
      tenant: t,
      admin:  companyAdmins.find(u => u.tenantId === t.id),
      subscribers: users.filter(u => u.tenantId === t.id && u.role === "SUBSCRIBER"),
    }));

    return { groups, superAdmins, noTenant };
  };

  const availableRoles = getAvailableRoles();

  // ── COMPANY_ADMIN view — only subscribers ──
  const mySubscribers = isCompanyAdmin()
    ? users.filter(u => u.role === "SUBSCRIBER")
    : [];

  return (
    <Layout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .um-btn:hover{filter:brightness(1.12);transform:translateY(-1px);}
        .um-del:hover{background:rgba(239,68,68,0.15)!important;color:#ef4444!important;}
        .um-row:hover{background:rgba(0,212,255,0.03)!important;}
        .um-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-top:14px;}
        .um-cards{display:none;}
        .um-table-header{display:grid;grid-template-columns:50px 1fr 160px 160px 100px;padding:10px 18px;border-bottom:1px solid #1a2d4a;font-size:10px;color:#7a8fa8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;}
        .um-table-row{display:grid;grid-template-columns:50px 1fr 160px 160px 100px;padding:12px 18px;border-bottom:1px solid #111c2e;align-items:center;transition:background .15s;}
        @media(max-width:768px){
          .um-table-header,.um-table-row{display:none!important;}
          .um-cards{display:block!important;}
        }
      `}</style>

      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",animation:"fadeUp .4s ease"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:36,background:`linear-gradient(180deg,${C.cyan},${C.purple})`,borderRadius:2}} />
            <div>
              <h2 style={{margin:0,fontSize:21,fontWeight:700,color:C.text}}>User Management</h2>
              <p style={{margin:0,fontSize:12,color:C.text2,marginTop:2}}>
                {isSuperAdmin() ? "All companies & users" : "Your team members"}
              </p>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="um-btn" onClick={fetchUsers} style={{
              background:C.s2,border:`1px solid ${C.border}`,color:C.text2,
              padding:"9px 12px",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
              <RefreshCw size={14}/>
            </button>
            <button className="um-btn" onClick={()=>setShowCreate(!showCreate)} style={{
              background:`linear-gradient(135deg,${C.cyan},${C.purple})`,
              border:"none",color:C.bg,padding:"9px 16px",borderRadius:9,
              cursor:"pointer",display:"flex",alignItems:"center",gap:6,
              fontSize:13,fontWeight:700,transition:"all .2s",
              boxShadow:`0 4px 16px rgba(0,212,255,0.22)`}}>
              <Plus size={14}/> New User
            </button>
          </div>
        </div>

        {/* Toast */}
        {msg&&(
          <div style={{marginBottom:14,padding:"11px 16px",borderRadius:10,
            background:msg.ok?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",
            border:`1px solid ${msg.ok?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,
            color:msg.ok?C.green:C.red,fontSize:13,fontWeight:600}}>
            {msg.text}
          </div>
        )}

        {/* Create Form */}
        {showCreate&&(
          <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,
            padding:"18px 20px",marginBottom:18,position:"relative",overflow:"hidden",animation:"fadeUp .3s ease"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
              <Plus size={14} color={C.cyan}/> Create New User
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:12}}>
              <div>
                <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Username *</label>
                <input value={newUser.username} onChange={e=>setNewUser({...newUser,username:e.target.value})} placeholder="username" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Password *</label>
                <input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} placeholder="min 6 chars" style={inp}/>
              </div>
              {isSuperAdmin()&&(
                <div>
                  <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px"}}>Role</label>
                  <select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})} style={{...inp,cursor:"pointer"}}>
                    {availableRoles.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
              {isSuperAdmin()&&(
                <div>
                  <label style={{fontSize:10,color:C.text2,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.4px",display:"flex",alignItems:"center",gap:5}}>
                    <Building2 size={10}/> Company
                  </label>
                  <select value={newUser.tenantId} onChange={e=>setNewUser({...newUser,tenantId:e.target.value})} style={{...inp,cursor:"pointer"}}>
                    <option value="">No Company (System)</option>
                    {tenants.map(t=><option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </div>
              )}
            </div>
            <button className="um-btn" onClick={handleCreate} disabled={saving} style={{
              background:`linear-gradient(135deg,${C.cyan},${C.purple})`,border:"none",color:C.bg,
              padding:"9px 24px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,
              display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}>
              <Plus size={13}/>{saving?"Creating...":"Create User"}
            </button>
          </div>
        )}

        {loading&&(
          <div style={{textAlign:"center",padding:"50px 0"}}>
            <div style={{width:28,height:28,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.cyan}`,
              borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block"}} />
          </div>
        )}

        {/* ══════════════════════════════════════════
            SUPER_ADMIN VIEW — grouped by company
        ══════════════════════════════════════════ */}
        {!loading && isSuperAdmin() && (() => {
          const { groups, superAdmins } = groupByTenant();
          return (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>

              {/* Super Admins */}
              {superAdmins.length > 0 && (
                <div style={{background:C.s1,border:"1px solid rgba(245,158,11,0.3)",borderRadius:14,overflow:"hidden"}}>
                  <div style={{height:2,background:"linear-gradient(90deg,#f59e0b,#8b5cf6)"}} />
                  <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:8,
                    background:"rgba(245,158,11,0.05)",borderBottom:`1px solid ${C.border}`}}>
                    <Shield size={14} color="#f59e0b"/>
                    <span style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>Super Admins</span>
                    <span style={{fontSize:11,color:C.text2,marginLeft:"auto"}}>{superAdmins.length} user{superAdmins.length>1?"s":""}</span>
                  </div>
                  {superAdmins.map((u,i) => <UserRow key={u.id} user={u} i={i} availableRoles={availableRoles}
                    onRoleChange={handleRoleChange} onReset={setResetModal} onDelete={handleDelete} setNewPass={setNewPass}/>)}
                </div>
              )}

              {/* Companies */}
              {groups.map(({ tenant, admin, subscribers }) => {
                const isOpen = expanded[tenant.id];
                const total  = (admin ? 1 : 0) + subscribers.length;
                return (
                  <div key={tenant.id} style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                    <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />

                    {/* Company Header */}
                    <div onClick={()=>setExpanded(p=>({...p,[tenant.id]:!p[tenant.id]}))}
                      style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10,
                        cursor:"pointer",background:"rgba(0,212,255,0.03)",borderBottom:`1px solid ${C.border}`,
                        transition:"background .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(0,212,255,0.06)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(0,212,255,0.03)"}>
                      <div style={{width:34,height:34,borderRadius:9,
                        background:`linear-gradient(135deg,${C.cyan}22,${C.purple}22)`,
                        border:`1px solid ${C.cyan}33`,display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:14,fontWeight:700,color:C.cyan}}>
                        {tenant.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.text}}>{tenant.name}</div>
                        <div style={{fontSize:10,color:C.text2,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>
                          {tenant.code} · {total} user{total!==1?"s":""}
                          {admin&&<span style={{color:C.cyan}}> · Admin: {admin.username}</span>}
                        </div>
                      </div>
                      {/* Subscriber count badge */}
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,
                          padding:"4px 10px",display:"flex",alignItems:"center",gap:5}}>
                          <User size={11} color={C.green}/>
                          <span style={{fontSize:11,fontWeight:700,color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>
                            {subscribers.length}
                          </span>
                          <span style={{fontSize:10,color:C.text2}}>subscribers</span>
                        </div>
                        {isOpen
                          ? <ChevronDown size={15} color={C.text2}/>
                          : <ChevronRight size={15} color={C.text2}/>}
                      </div>
                    </div>

                    {/* Expanded Users */}
                    {isOpen && (
                      <div style={{animation:"fadeUp .2s ease"}}>
                        {/* Company Admin */}
                        {admin && (
                          <div style={{background:"rgba(0,212,255,0.03)",borderBottom:`1px solid ${C.border}`}}>
                            <UserRow user={admin} i={0} availableRoles={availableRoles}
                              onRoleChange={handleRoleChange} onReset={setResetModal}
                              onDelete={handleDelete} setNewPass={setNewPass} compact/>
                          </div>
                        )}
                        {/* Subscribers */}
                        {subscribers.length === 0 ? (
                          <div style={{padding:"14px 20px",fontSize:12,color:C.text2,
                            display:"flex",alignItems:"center",gap:6}}>
                            <User size={12}/> No subscribers yet
                          </div>
                        ) : (
                          subscribers.map((u,i) => (
                            <UserRow key={u.id} user={u} i={i} availableRoles={availableRoles}
                              onRoleChange={handleRoleChange} onReset={setResetModal}
                              onDelete={handleDelete} setNewPass={setNewPass} indent/>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Stats */}
              <div className="um-stats">
                {[
                  {label:"Companies",    value:tenants.length,                                  color:C.cyan  },
                  {label:"Company Admin",value:users.filter(u=>u.role==="COMPANY_ADMIN").length, color:C.cyan  },
                  {label:"Subscribers",  value:users.filter(u=>u.role==="SUBSCRIBER").length,    color:C.green },
                  {label:"Total Users",  value:users.length,                                    color:C.purple},
                ].map(s=>(
                  <div key={s.label} style={{background:C.s1,border:`1px solid ${s.color}22`,borderRadius:11,padding:"12px 16px"}}>
                    <div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:5}}>{s.label}</div>
                    <div style={{fontSize:22,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════
            COMPANY_ADMIN VIEW — only subscribers
        ══════════════════════════════════════════ */}
        {!loading && isCompanyAdmin() && (
          <div>
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.purple})`}} />
              <div className="um-table-header">
                <span>#</span><span>Username</span><span>Role</span>
                <span>Actions</span><span></span>
              </div>
              {mySubscribers.length===0?(
                <div style={{padding:"40px 20px",textAlign:"center",color:C.text2,fontSize:13,
                  display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                  <Users size={32} color="#3a5a7a" style={{opacity:.4}}/>
                  No team members yet — create your first subscriber
                </div>
              ):(
                mySubscribers.map((u,i)=>(
                  <UserRow key={u.id} user={u} i={i} availableRoles={["SUBSCRIBER"]}
                    onRoleChange={handleRoleChange} onReset={setResetModal}
                    onDelete={handleDelete} setNewPass={setNewPass}/>
                ))
              )}
            </div>
            <div className="um-stats">
              {[
                {label:"Total",      value:mySubscribers.length, color:C.cyan },
                {label:"Active",     value:mySubscribers.length, color:C.green},
              ].map(s=>(
                <div key={s.label} style={{background:C.s1,border:`1px solid ${s.color}22`,borderRadius:11,padding:"12px 16px"}}>
                  <div style={{fontSize:10,color:C.text2,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:5}}>{s.label}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"16px"}}>
          <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,
            padding:"24px",width:"100%",maxWidth:360,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg,${C.orange},${C.purple})`}} />
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:5,display:"flex",alignItems:"center",gap:7}}>
              <Key size={14} color={C.orange}/> Reset Password
            </div>
            <div style={{fontSize:13,color:C.text2,marginBottom:16}}>
              User: <span style={{color:C.cyan,fontWeight:600}}>{resetModal.username}</span>
            </div>
            <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)}
              placeholder="New password (min 6 chars)"
              style={{width:"100%",padding:"10px 12px",background:C.s2,border:`1px solid ${C.border}`,
                borderRadius:9,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:14}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setResetModal(null)} style={{flex:1,padding:"10px",background:C.s2,
                border:`1px solid ${C.border}`,color:C.text2,borderRadius:9,cursor:"pointer",fontSize:13}}>Cancel</button>
              <button className="um-btn" onClick={handleResetPassword} disabled={saving} style={{
                flex:1,padding:"10px",background:`linear-gradient(135deg,${C.orange},${C.purple})`,
                border:"none",color:"white",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .2s"}}>
                {saving?"...":"Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── UserRow Component ─────────────────────────────────────────────────────────
function UserRow({ user, i, availableRoles, onRoleChange, onReset, onDelete, setNewPass, indent, compact }) {
  const rc = roleConfig[user.role] || roleConfig.SUBSCRIBER;
  return (
    <>
      {/* Desktop */}
      <div className="um-row um-table-row"
        style={{
          paddingLeft: indent ? 36 : compact ? 24 : 18,
          animation:`fadeUp .3s ease ${i*.04}s both`,
          background: compact ? "rgba(0,212,255,0.02)" : "transparent",
        }}>
        <span style={{fontSize:11,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>#{user.id}</span>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,borderRadius:7,background:rc.bg,border:`1px solid ${rc.color}44`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {getRoleIcon(user.role, 13)}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>{user.username}</div>
            {user.tenantId&&<div style={{fontSize:9,color:C.text2,fontFamily:"'JetBrains Mono',monospace"}}>tenant:{user.tenantId}</div>}
          </div>
        </div>
        <span style={{display:"inline-block",padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700,
          fontFamily:"'JetBrains Mono',monospace",background:rc.bg,color:rc.color,border:`1px solid ${rc.color}44`}}>
          {rc.label}
        </span>
        <div style={{display:"flex",gap:5}}>
          <button className="um-btn" title="Reset Password"
            onClick={()=>{onReset(user);setNewPass("");}}
            style={{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)",
              color:"#f59e0b",padding:"5px 8px",borderRadius:7,cursor:"pointer",display:"flex",transition:"all .2s"}}>
            <Key size={12}/>
          </button>
          <button className="um-btn um-del" title="Delete" onClick={()=>onDelete(user)}
            style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",
              color:"#ef4444",padding:"5px 8px",borderRadius:7,cursor:"pointer",display:"flex",transition:"all .2s"}}>
            <Trash2 size={12}/>
          </button>
        </div>
        <span/>
      </div>

      {/* Mobile Card */}
      <div className="um-cards" style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,
        paddingLeft: indent ? 28 : 16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:rc.bg,border:`1px solid ${rc.color}44`,
              display:"flex",alignItems:"center",justifyContent:"center"}}>{getRoleIcon(user.role)}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{user.username}</div>
              <div style={{fontSize:10,color:"#7a8fa8",fontFamily:"'JetBrains Mono',monospace"}}>#{user.id}</div>
            </div>
          </div>
          <span style={{padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700,
            fontFamily:"'JetBrains Mono',monospace",background:rc.bg,color:rc.color,border:`1px solid ${rc.color}44`}}>
            {rc.label}
          </span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{onReset(user);setNewPass("");}}
            style={{flex:1,padding:"7px",background:"rgba(245,158,11,0.12)",
              border:"1px solid rgba(245,158,11,0.25)",borderRadius:7,color:"#f59e0b",
              cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <Key size={12}/> Reset
          </button>
          <button onClick={()=>onDelete(user)}
            style={{padding:"7px 10px",background:"rgba(239,68,68,0.08)",
              border:"1px solid rgba(239,68,68,0.2)",borderRadius:7,color:"#ef4444",
              cursor:"pointer",display:"flex",alignItems:"center"}}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </>
  );
}