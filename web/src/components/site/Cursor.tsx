"use client";

import { useEffect, useRef } from "react";

export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const corePos = useRef({ x: 0, y: 0 });
  const hover = useRef(false);
  const hide = useRef(false);
  const seen = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      if (!seen.current) {
        ringPos.current.x = event.clientX;
        ringPos.current.y = event.clientY;
        corePos.current.x = event.clientX;
        corePos.current.y = event.clientY;
        seen.current = true;
      }
      const node = event.target as HTMLElement | null;
      hide.current = Boolean(node?.closest("input, textarea, select, [contenteditable='true']"));
      hover.current = Boolean(
        node?.closest("a, button, [role='button'], label, summary, [data-cursor='hover']"),
      );
    };

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.033);
      previous = now;
      const ringFollow = 1 - Math.exp(-9 * dt);
      const coreFollow = 1 - Math.exp(-18 * dt);
      ringPos.current.x += (pointer.current.x - ringPos.current.x) * ringFollow;
      ringPos.current.y += (pointer.current.y - ringPos.current.y) * ringFollow;
      corePos.current.x += (pointer.current.x - corePos.current.x) * coreFollow;
      corePos.current.y += (pointer.current.y - corePos.current.y) * coreFollow;

      if (ring.current && core.current) {
        const visible = seen.current && !hide.current ? "1" : "0";
        ring.current.style.opacity = visible;
        core.current.style.opacity = visible;
        ring.current.dataset.hover = hover.current ? "true" : "false";
        core.current.dataset.hover = hover.current ? "true" : "false";
        ring.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
        core.current.style.transform = `translate3d(${corePos.current.x}px, ${corePos.current.y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={core} className="cursor-core" aria-hidden />
    </>
  );
}
