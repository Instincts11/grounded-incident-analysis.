"use client";

import { interviewScript } from "@/lib/content";

export function InterviewScript() {
  return (
    <section>
      <p className="kicker">Interview walkthrough</p>
      <h2 className="mt-4 text-3xl tracking-tight">What to say while you click</h2>
      <ol className="spine mt-10">
        {interviewScript.map((item, index) => (
          <li key={item.beat} className="spine-item">
            <p className="font-mono text-sm text-[var(--violet)]">
              {String(index + 1).padStart(2, "0")} · {item.beat}
            </p>
            <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{item.say}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
