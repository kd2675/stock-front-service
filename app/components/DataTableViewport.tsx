"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type DataTableViewportProps = {
  children: ReactNode;
  label: string;
  tone?: "light" | "dark";
  className?: string;
};

export default function DataTableViewport({
  children,
  label,
  tone = "light",
  className = "",
}: DataTableViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measureEdges = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const maximumScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    setEdges({
      left: viewport.scrollLeft > 4,
      right: maximumScrollLeft - viewport.scrollLeft > 4,
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    measureEdges();
    const resizeObserver = new ResizeObserver(measureEdges);
    resizeObserver.observe(viewport);
    if (viewport.firstElementChild) {
      resizeObserver.observe(viewport.firstElementChild);
    }
    return () => resizeObserver.disconnect();
  }, [measureEdges]);

  const leftEdgeClass = tone === "dark" ? "from-admin-canvas/95" : "from-white/95";
  const rightEdgeClass = tone === "dark" ? "from-admin-canvas/95" : "from-white/95";

  return (
    <div className={["relative min-w-0", className].filter(Boolean).join(" ")}>
      {edges.right ? (
        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-md bg-black/65 px-2 py-1 text-[10px] font-black text-white shadow-sm md:hidden">
          좌우로 이동
        </span>
      ) : null}
      <div
        ref={viewportRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={measureEdges}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
          }
          viewportRef.current?.scrollBy({
            left: event.key === "ArrowRight" ? 180 : -180,
            behavior: "smooth",
          });
        }}
        className={[
          "stock-table-scroll overflow-x-auto overflow-y-hidden rounded-lg border outline-none",
          tone === "dark"
            ? "border-white/10 bg-admin-canvas/35 focus-visible:border-admin-accent/60"
            : "border-stock-border bg-white focus-visible:border-stock-accent/60",
        ].join(" ")}
      >
        {children}
      </div>
      {edges.left ? <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-px z-[3] w-5 rounded-l-lg bg-gradient-to-r ${leftEdgeClass} to-transparent`} /> : null}
      {edges.right ? <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 right-px z-[3] w-7 rounded-r-lg bg-gradient-to-l ${rightEdgeClass} to-transparent`} /> : null}
    </div>
  );
}
