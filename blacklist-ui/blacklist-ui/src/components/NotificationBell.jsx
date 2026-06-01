// src/components/NotificationBell.jsx
import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, X, Briefcase, ArrowRight, Scale, UserCheck } from "lucide-react";

const C = {
  bg: "#060912", s1: "#0d1321", s2: "#111c2e", border: "#1a2d4a",
  cyan: "#00d4ff", purple: "#8b5cf6", green: "#10b981",
  orange: "#f59e0b", red: "#ef4444", text: "#e2e8f0", text2: "#7a8fa8",
};

// ── Toast Component ────────────────────────────────────────────────
export function NotificationToast({ notification, onDismiss }) {
  const typeConfig = {
    STATUS_UPDATE: { color: C.cyan,   icon: <Briefcase size={14}/>, label: "Case Update"   },
    DECISION:      { color: C.orange, icon: <Scale size={14}/>,     label: "Decision Made" },
    ASSIGNED:      { color: C.purple, icon: <UserCheck size={14}/>, label: "Assigned to You"},
  };
  const cfg = typeConfig[notification.type] || typeConfig.STATUS_UPDATE;

  return (
    <div style={{
      background: C.s1,
      border: `1px solid ${cfg.color}40`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12,
      padding: "12px 14px",
      marginBottom: 8,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.color}10`,
      animation: "slideInRight .3s ease",
      maxWidth: 340,
      fontFamily: "'IBM Plex Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* glow bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,${cfg.color},transparent)` }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          color: cfg.color,
        }}>
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {cfg.label}
            </span>
            <button onClick={() => onDismiss(notification.id)} style={{
              background: "none", border: "none", color: C.text2, cursor: "pointer",
              padding: 0, display: "flex", lineHeight: 1,
            }}>
              <X size={12}/>
            </button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2, lineHeight: 1.4 }}>
            {notification.reference}
            {notification.subjectName && (
              <span style={{ fontWeight: 400, color: C.text2 }}> — {notification.subjectName}</span>
            )}
          </div>

          <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.4 }}>
            {notification.message}
          </div>

          {notification.decidedBy && (
            <div style={{ fontSize: 10, color: C.text2, marginTop: 4, opacity: 0.7 }}>
              بواسطة {notification.decidedBy}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toast Container (Fixed bottom-right) ──────────────────────────
export function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column-reverse",
    }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
      {toasts.slice(0, 5).map(n => (
        <NotificationToast key={n.id} notification={n} onDismiss={onDismiss}/>
      ))}
    </div>
  );
}

// ── Notification Bell + Dropdown ──────────────────────────────────
export function NotificationBell({ notifications, unreadCount, connected, onMarkAllRead, onDismiss }) {
  const [open, setOpen]     = useState(false);
  const dropdownRef         = useRef(null);

  // أغلق الـ dropdown لما يضغط خارجه
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeConfig = {
    STATUS_UPDATE: { color: C.cyan,   icon: <Briefcase size={12}/> },
    DECISION:      { color: C.orange, icon: <Scale size={12}/> },
    ASSIGNED:      { color: C.purple, icon: <UserCheck size={12}/> },
  };

 const formatTime = (ts) => {
    try {
      // أضف Z لو ما موجود عشان المتصفح يعرف إنه UTC
      const normalized = ts.endsWith("Z") ? ts : ts + "Z";
      const d = new Date(normalized);
      const diff = Date.now() - d.getTime();
      if (diff < 60000)    return "الآن";
      if (diff < 3600000)  return `${Math.floor(diff / 60000)}د`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}س`;
      return d.toLocaleDateString("ar");
    } catch { return ""; }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(p => !p); if (open) onMarkAllRead(); }}
        style={{
          position: "relative", background: C.s2,
          border: `1px solid ${unreadCount > 0 ? C.cyan + "50" : C.border}`,
          borderRadius: 10, padding: "8px 10px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s",
          boxShadow: unreadCount > 0 ? `0 0 12px ${C.cyan}20` : "none",
        }}
        title="الإشعارات"
      >
        <Bell size={16} color={unreadCount > 0 ? C.cyan : C.text2}/>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div style={{
            position: "absolute", top: -5, right: -5,
            background: C.red, color: "white",
            borderRadius: "50%", width: 17, height: 17,
            fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${C.bg}`,
            animation: "pulse 2s infinite",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}

        {/* Connection dot */}
        <div style={{
          position: "absolute", bottom: 3, right: 3,
          width: 5, height: 5, borderRadius: "50%",
          background: connected ? C.green : "#3a5a7a",
          transition: "background .5s",
        }}/>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, background: C.s1,
          border: `1px solid ${C.border}`, borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          zIndex: 9000, overflow: "hidden",
          animation: "fadeUp .2s ease",
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 14px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: C.s2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Bell size={13} color={C.cyan}/>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>الإشعارات</span>
              {unreadCount > 0 && (
                <span style={{
                  padding: "1px 6px", borderRadius: 5, fontSize: 10,
                  background: "rgba(0,212,255,0.15)", color: C.cyan,
                  fontWeight: 700, border: `1px solid ${C.cyan}30`,
                }}>{unreadCount} جديد</span>
              )}
            </div>
            {notifications.length > 0 && (
              <button onClick={onMarkAllRead} style={{
                background: "none", border: "none", color: C.text2, cursor: "pointer",
                fontSize: 10, display: "flex", alignItems: "center", gap: 3,
              }}>
                <CheckCheck size={11}/> تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <Bell size={28} color="#3a5a7a" style={{ opacity: .4, marginBottom: 8 }}/>
                <div style={{ fontSize: 12, color: C.text2 }}>لا يوجد إشعارات</div>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = typeConfig[n.type] || typeConfig.STATUS_UPDATE;
                return (
                  <div key={n.id} style={{
                    padding: "10px 14px",
                    borderBottom: `1px solid ${C.s2}`,
                    background: n.read ? "transparent" : `${cfg.color}06`,
                    display: "flex", alignItems: "flex-start", gap: 9,
                    transition: "background .15s",
                  }}>
                    {/* icon */}
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: cfg.color, marginTop: 1,
                    }}>
                      {cfg.icon}
                    </div>

                    {/* content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, marginBottom: 1 }}>
                        {n.reference}
                        {!n.read && <span style={{
                          display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                          background: cfg.color, marginRight: 5, verticalAlign: "middle",
                        }}/>}
                      </div>
                      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4, marginBottom: 2 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 10, color: C.text2 }}>
                        {formatTime(n.timestamp)}
                        {n.decidedBy && ` · ${n.decidedBy}`}
                      </div>
                    </div>

                    {/* dismiss */}
                    <button onClick={() => onDismiss(n.id)} style={{
                      background: "none", border: "none", color: "#3a5a7a", cursor: "pointer",
                      padding: 0, flexShrink: 0, display: "flex",
                    }}>
                      <X size={11}/>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 14px", borderTop: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: connected ? C.green : "#3a5a7a",
            }}/>
            <span style={{ fontSize: 10, color: C.text2 }}>
              {connected ? "متصل — الإشعارات فورية" : "غير متصل — جاري إعادة الاتصال..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}