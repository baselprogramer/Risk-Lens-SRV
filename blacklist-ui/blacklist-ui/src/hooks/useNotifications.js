// src/hooks/useNotifications.js
import { useState, useEffect, useRef, useCallback } from "react";
import { API_V1 } from "../config/api";

const authHeaders = () => ({
  "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`,
  "Accept": "application/json",
});

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [connected,     setConnected]     = useState(false);
  const timerRef    = useRef(null);
  const pollingRef  = useRef(false);
  const seenIds     = useRef(new Set()); // ✅ track IDs across renders

  const poll = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    const token = localStorage.getItem("jwtToken");
    if (!token) { pollingRef.current = false; return; }

    try {
      const res = await fetch(`${API_V1}/notifications/pending`, {
        headers: authHeaders(),
      });

      if (!res.ok) { setConnected(false); return; }
      setConnected(true);

      const pending = await res.json();
      if (!pending || pending.length === 0) return;

      // ✅ فلتر بالـ seenIds عشان ما يتكرر حتى لو البكند رجّعهم مرتين
      const newOnes = pending.filter(n => !seenIds.current.has(n.id));
      if (newOnes.length === 0) return;

      newOnes.forEach(n => seenIds.current.add(n.id));

      const mapped = newOnes.map(n => ({
        id:          n.id,
        caseId:      n.caseId,
        reference:   n.reference,
        subjectName: n.subjectName,
        newStatus:   n.newStatus,
        decision:    n.decision,
        type:        n.type || "STATUS_UPDATE",
        decidedBy:   n.decidedBy,
        message:     n.message,
        timestamp:   n.createdAt,
        read:        false,
      }));

      setNotifications(prev => [...mapped, ...prev].slice(0, 50));
      setUnreadCount(c => c + mapped.length);

    } catch (e) {
      setConnected(false);
      console.warn("Polling error:", e.message);
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif && !notif.read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== id);
    });
  }, []);

  return { notifications, unreadCount, connected, markAllRead, dismiss };
}