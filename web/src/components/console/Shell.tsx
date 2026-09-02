"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  FileText,
  GitBranch,
  LayoutDashboard,
  ChevronsLeft,
  ChevronsRight,
  Radar,
  Shield,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { navigateBack } from "@/lib/nav-history";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const items = [
  { href: "/console", label: "Overview", icon: LayoutDashboard },
  { href: "/console/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/console/incidents", label: "Incidents", icon: Shield },
  { href: "/console/anomalies", label: "Anomalies", icon: Radar },
  { href: "/console/reports", label: "Reports", icon: FileText },
  { href: "/console/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/console/evaluation", label: "Evaluation", icon: Activity },
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("console-sidebar");
    if (stored === "expanded") {
      setCollapsed(false);
      return;
    }
    if (stored === "collapsed") {
      setCollapsed(true);
      return;
    }
    setCollapsed(window.innerWidth <= 1218);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("console-sidebar", next ? "collapsed" : "expanded");
  };

  const goBack = () => {
    navigateBack((href) => router.push(href));
  };

  return (
    <div
      className={cn("console-shell min-h-screen bg-[var(--bg)]", collapsed && "console-shell--collapsed")}
      style={{ ["--console-sidebar" as string]: collapsed ? "4.5rem" : "16rem" }}
    >
      <aside className="console-shell__aside fixed inset-y-0 left-0 z-30 overflow-hidden border-r border-[var(--line)] bg-[var(--bg-elevated)]/90 py-8 backdrop-blur-xl">
        <div className={cn("flex items-center", collapsed ? "justify-center px-2" : "px-5")}>
          <Link href="/" className={cn("flex items-baseline gap-2", collapsed && "justify-center")}>
            {collapsed ? (
              <span className="serif text-2xl">i</span>
            ) : (
              <>
                <span className="serif text-2xl">incident</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--mint)]">
                  console
                </span>
              </>
            )}
          </Link>
        </div>
        <nav className={cn("mt-10 space-y-1", collapsed ? "px-2" : "px-4")}>
          {items.map((item) => {
            const active =
              item.href === "/console"
                ? pathname === "/console"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center rounded-xl py-2.5 text-sm text-[var(--muted)] transition hover:bg-[var(--fill)] hover:text-[var(--text)]",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                  active && "bg-[var(--violet)]/10 text-[var(--text)]",
                )}
              >
                <Icon size={16} strokeWidth={1.6} />
                {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
              </Link>
            );
          })}
        </nav>
        <div
          className={cn(
            "absolute bottom-6 left-0 right-0 flex items-center",
            collapsed ? "flex-col gap-3 px-2" : "justify-between gap-3 px-5",
          )}
        >
          {collapsed ? null : (
            <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--faint)]">
              API 127.0.0.1:8000
            </p>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--fill)] text-[var(--text)] transition hover:border-[var(--violet)] hover:bg-[var(--violet)]/10"
          >
            {collapsed ? (
              <ChevronsRight size={18} strokeWidth={1.7} />
            ) : (
              <ChevronsLeft size={18} strokeWidth={1.7} />
            )}
          </button>
        </div>
      </aside>
      <div className="console-shell__main">
        <header className="console-shell__header sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--bg)]/80 py-5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--fill)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--violet)] hover:bg-[var(--violet)]/10 hover:text-[var(--text)]"
            >
              <ArrowLeft size={16} strokeWidth={1.6} />
              <span className="max-[640px]:hidden">Back</span>
            </button>
            <p className="hidden min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--faint)] min-[1100px]:block">
              Grounded analysis · heuristic compose · optional Groq or OpenAI
            </p>
          </div>
          <ThemeToggle />
        </header>
        <div className="console-shell__body">{children}</div>
      </div>
    </div>
  );
}
