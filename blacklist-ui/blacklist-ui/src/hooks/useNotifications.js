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
  const reconnectTimer = useRef(null);
  const abortRef       = useRef(null);
  const mountedRef     = useRef(false);
  const connectRef     = useRef(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(`${API_V1}/notifications/pending`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const pending = await res.json();
      if (!pending || pending.length === 0) return;

      const mapped = pending.map(n => ({
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
        fromPending: true,
      }));

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newOnes = mapped.filter(n => !existingIds.has(n.id));
        if (newOnes.length === 0) return prev;
        setUnreadCount(c => c + newOnes.length);
        return [...newOnes, ...prev].slice(0, 50);
      });

      await fetch(`${API_V1}/notifications/pending/read-all`, {
        method: "PUT",
        headers: authHeaders(),
      });
    } catch (e) {
      console.warn("Failed to fetch pending notifications:", e.message);
    }
  }, []);

  // ✅ Extracted so it can be called from anywhere cleanly
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
         if (mountedRef.current && connectRef.current) {
        connectRef.current();
      }
    }, 500); // ✅ near-instant reconnect on clean cycle
  }, []); // connect added below via ref to avoid circular dep

  const connect = useCallback(async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !mountedRef.current) return;

    // Abort any existing connection
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_V1}/notifications/subscribe`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept":        "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn("SSE subscribe failed:", response.status);
        setConnected(false);
        if (mountedRef.current) scheduleReconnect();
        return;
      }

      setConnected(true);  // ← this is correct, already there

      fetchPending();

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let eventName = "";
      let eventData = "";

      while (mountedRef.current) {
        const { done, value } = await reader.read();

        // ✅ Stream ended (timeout cycle completed) — reconnect immediately
        if (done) {
          // Don't set false here — it's a clean cycle, reconnect silently
          if (mountedRef.current) scheduleReconnect();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          // ✅ Ignore heartbeat comment lines (": heartbeat")
          if (line.startsWith(":")) continue;

          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            eventData = line.slice(5).trim();
          } else if (line === "") {
            
            if (eventName === "case-notification" && eventData) {
              try {
                const data = JSON.parse(eventData);
                const notif = {
                  id:          Date.now() + Math.random(),
                  caseId:      data.caseId,
                  reference:   data.reference,
                  subjectName: data.subjectName,
                  newStatus:   data.newStatus,
                  decision:    data.decision,
                  type:        data.type,
                  decidedBy:   data.decidedBy,
                  message:     data.message,
                  timestamp:   data.timestamp || new Date().toISOString(),
                  read:        false,
                };
                setNotifications(prev => [notif, ...prev].slice(0, 50));
                setUnreadCount(prev => prev + 1);
              } catch (e) {
                console.warn("SSE parse error:", e);
              }
            }

            eventName = "";
            eventData = "";
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.warn("SSE error:", err.message);
      setConnected(false); // ✅ only goes grey on actual error
      if (mountedRef.current) scheduleReconnect();
}
  }, [fetchPending, scheduleReconnect]);

    useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPending();
    const timer = setTimeout(() => connect(), 500);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (abortRef.current)       abortRef.current.abort();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect, fetchPending]);

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