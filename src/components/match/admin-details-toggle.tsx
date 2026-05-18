"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

export function AdminDetailsToggle() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin-show-details");
    if (stored === "true") {
      setShow(true);
      document.documentElement.classList.add("show-admin-details");
    }
  }, []);

  function toggle() {
    const next = !show;
    setShow(next);
    document.documentElement.classList.toggle("show-admin-details", next);
    localStorage.setItem("admin-show-details", String(next));
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted hover:text-pitch-300 transition"
      title={show ? "Hide player details" : "Show player details (OVR)"}
    >
      {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      {show ? "Hide details" : "Details"}
    </button>
  );
}
