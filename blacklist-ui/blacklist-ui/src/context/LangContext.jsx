"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LangContext = createContext({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("site-lang");
    if (savedLang) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem("site-lang", newLang);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);