"use client";

import { useEffect } from "react";

/** Ports the original static design's scroll-reveal + hero parallax JS 1:1 (no behavior change). */
export function PageEffects() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const hero = document.querySelector<HTMLElement>(".hero");
    const fx = document.querySelector<HTMLElement>(".hero__fx");
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onMove(e: MouseEvent) {
      if (!hero || !fx) return;
      const r = hero.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      fx.style.transform = `translate(${cx * -10}px,${cy * -10}px)`;
    }
    function onLeave() {
      if (fx) fx.style.transform = "translate(0,0)";
    }

    if (hero && fx && !reduceMotion) {
      hero.addEventListener("mousemove", onMove);
      hero.addEventListener("mouseleave", onLeave);
    }

    return () => {
      io.disconnect();
      if (hero) {
        hero.removeEventListener("mousemove", onMove);
        hero.removeEventListener("mouseleave", onLeave);
      }
    };
  }, []);

  return null;
}
