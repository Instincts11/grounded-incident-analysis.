"use client";

import { useEffect, useRef, useState } from "react";

export function TypedWord({
  text,
  className,
  delay = 900,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState("");

  useEffect(() => {
    const node = root.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
        }
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }

    let index = 0;
    let mode: "type" | "hold" | "clear" = "type";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (fn: () => void, ms: number) => {
      timer = window.setTimeout(fn, ms);
    };

    const tick = () => {
      if (mode === "type") {
        index += 1;
        setShown(text.slice(0, index));
        if (index >= text.length) {
          mode = "hold";
          schedule(tick, 5000);
          return;
        }
        schedule(tick, 86);
        return;
      }

      if (mode === "hold") {
        setShown("");
        index = 0;
        mode = "clear";
        schedule(tick, 360);
        return;
      }

      mode = "type";
      schedule(tick, 86);
    };

    schedule(tick, delay);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [active, delay, text]);

  return (
    <span ref={root} className={`relative inline-block ${className ?? ""}`.trim()}>
      <span className="invisible" aria-hidden>
        {text}
      </span>
      <span className="absolute left-0 top-0">{shown}</span>
    </span>
  );
}
