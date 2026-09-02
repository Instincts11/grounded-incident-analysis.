import { ConsoleShell } from "@/components/console/Shell";
import type { ReactNode } from "react";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
