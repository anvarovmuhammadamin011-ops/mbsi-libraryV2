"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANG_COOKIE,
  getDict,
  normalizeLang,
  type Dictionary,
  type Lang,
} from "./dictionaries";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "uz",
  setLang: () => {},
  t: getDict("uz"),
});

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // If user changed language in another tab / localStorage differs, sync it.
  useEffect(() => {
    const saved = normalizeLang(
      typeof window !== "undefined"
        ? window.localStorage.getItem(LANG_COOKIE)
        : null
    );
    if (saved !== initialLang) {
      const stored = window.localStorage.getItem(LANG_COOKIE);
      if (stored) setLangState(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((l: Lang) => {
    const v = normalizeLang(l);
    setLangState(v);
    try {
      window.localStorage.setItem(LANG_COOKIE, v);
      document.cookie = `${LANG_COOKIE}=${v}; path=/; max-age=31536000`;
      document.documentElement.lang = v;
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: getDict(lang) }),
    [lang, setLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
