"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/site/Theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--fill)] text-[var(--text)] transition hover:border-[var(--violet)] hover:bg-[var(--violet)]/10"
    >
      {light ? <Moon size={16} strokeWidth={1.7} /> : <Sun size={16} strokeWidth={1.7} />}
    </button>
  );
}
