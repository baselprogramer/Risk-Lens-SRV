"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "./context/LangContext";
import { LoadingOverlay } from "./context/LoadingOverlay";

export default function ClientWrapper({ children }) {
  const { lang } = useLang();
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setIsChanging(true);
    const timer = setTimeout(() => setIsChanging(false), 800);
    return () => clearTimeout(timer);
  }, [lang]);

  return (
    <>
      {isChanging && <LoadingOverlay />}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={lang}
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -5 }}
          transition={{ duration: 0.2, ease: "circOut" }}
          style={{ opacity: isChanging ? 0 : 1 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}