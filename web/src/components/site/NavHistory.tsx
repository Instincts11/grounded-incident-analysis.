"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordNavigation, rememberScroll } from "@/lib/nav-history";

export function NavHistory() {
  const pathname = usePathname();

  useEffect(() => {
    recordNavigation(pathname);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => rememberScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
