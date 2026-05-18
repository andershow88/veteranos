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
      className="grid h-10 w-10 place-items-center rounded-xl text-foreground/80 hover:text-foreground hover:bg-surface-2 transition"
      title={show ? "Hide player details" : "Show player details (OVR)"}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
