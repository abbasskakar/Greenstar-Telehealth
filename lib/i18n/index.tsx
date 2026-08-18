"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export type Lang = "en" | "ur";

const dict = {
  welcome_back: { en: "Welcome back", ur: "خوش آمدید" },
  select_role: { en: "Select your role to continue", ur: "جاری رکھنے کے لیے اپنا کردار منتخب کریں" },
  provider: { en: "Provider", ur: "پرووائیڈر" },
  doctor: { en: "Doctor", ur: "ڈاکٹر" },
  admin: { en: "Admin", ur: "ایڈمن" },
  program: { en: "Program", ur: "پروگرام" },
  public: { en: "Public", ur: "عوام" },
  email: { en: "Email", ur: "ای میل" },
  password: { en: "Password", ur: "پاس ورڈ" },
  forgot: { en: "Forgot?", ur: "بھول گئے؟" },
  sign_in: { en: "Sign In", ur: "سائن ان" },
  signing_in: { en: "Signing in…", ur: "سائن ان ہو رہا ہے…" },
  cnic: { en: "CNIC Number", ur: "شناختی کارڈ نمبر" },
  cnic_hint: { en: "Enter your 13-digit CNIC", ur: "اپنا 13 ہندسوں کا شناختی کارڈ نمبر درج کریں" },
  staff_note: { en: "Staff accounts are created by your administrator.", ur: "اسٹاف اکاؤنٹس آپ کے ایڈمنسٹریٹر بناتے ہیں۔" },
  new_patient: { en: "New patient?", ur: "نئے مریض؟" },
  sign_up_here: { en: "Sign up here", ur: "یہاں رجسٹر کریں" },
  enter_email: { en: "Enter your email", ur: "اپنا ای میل درج کریں" },
  enter_password: { en: "Enter your password", ur: "اپنا پاس ورڈ درج کریں" },
  bad_login: { en: "Incorrect credentials. Please check and try again.", ur: "غلط تفصیلات۔ براہ کرم دوبارہ کوشش کریں۔" },
} as const;

type Key = keyof typeof dict;

const Ctx = React.createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    const stored = (localStorage.getItem("gs-lang") as Lang | null) ?? "en";
    setLangState(stored);
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("gs-lang", l);
  }, []);

  const t = React.useCallback((k: Key) => dict[k][lang], [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useT() {
  return React.useContext(Ctx);
}

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ur" : "en")}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:text-foreground",
        className,
      )}
      aria-label="Toggle language"
    >
      <Globe size={16} />
      {lang === "en" ? "اردو" : "EN"}
    </button>
  );
}
