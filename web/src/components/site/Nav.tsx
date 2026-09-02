"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const links = [
  { href: "/architecture", label: "Architecture" },
  { href: "/method", label: "Method" },
  { href: "/security", label: "Grounding" },
  { href: "/console", label: "Console" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onConsole = pathname.startsWith("/console");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (onConsole) {
    return null;
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        open && "bg-[var(--bg)]/95 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none",
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="serif text-2xl tracking-tight">incident</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--mint)]">
            agent
          </span>
        </Link>
        <nav className="hidden items-center gap-10 text-sm text-[var(--muted)] md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-[var(--text)]",
                pathname === link.href && "text-[var(--text)]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/console"
            className="hidden rounded-full border border-[var(--line)] bg-[var(--fill)] px-5 py-2 text-sm text-[var(--text)] backdrop-blur-xl transition hover:border-[var(--violet)] hover:bg-[var(--violet)]/10 md:inline-flex"
          >
            Open console
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--fill)] text-[var(--text)] transition hover:border-[var(--violet)] hover:bg-[var(--violet)]/10 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X size={18} strokeWidth={1.7} /> : <Menu size={18} strokeWidth={1.7} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-[var(--line)] md:hidden">
          <nav className="mx-auto flex max-w-[1440px] flex-col gap-1 px-8 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-3 py-3 text-base text-[var(--muted)] transition hover:bg-[var(--fill)] hover:text-[var(--text)]",
                  pathname === link.href && "text-[var(--text)]",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/console"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--violet)] px-5 py-3 text-sm font-medium text-[var(--on-accent)]"
            >
              Open console
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
