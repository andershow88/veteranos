"use client";

import { useEffect } from "react";

/**
 * When a match detail page is opened via a "#payment-<id>" deep link (from the
 * profile payment list), centre the targeted replacement row in the viewport
 * and flash it briefly, so the user lands exactly on the payment actions
 * without having to scroll or hunt for the row. No-op when there is no hash.
 *
 * Centring (block: "center") sidesteps the sticky header entirely; scroll-mt-*
 * on the row is a belt-and-braces fallback for native anchor jumps.
 */
export function HashScrollHighlight() {
  useEffect(() => {
    let timer: number | undefined;

    const focusHashTarget = () => {
      const hash = window.location.hash;
      if (hash.length < 2) return;
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      el.classList.add("payment-flash");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => el.classList.remove("payment-flash"), 900);
    };

    // Defer one frame so the server-rendered row is laid out before scrolling.
    const raf = requestAnimationFrame(focusHashTarget);
    window.addEventListener("hashchange", focusHashTarget);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", focusHashTarget);
    };
  }, []);

  return null;
}
