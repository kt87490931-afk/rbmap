"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { detectDeviceType } from "@/lib/device-type";

const VISITOR_KEY = "rbmap_visitor_id";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const referrer = typeof document !== "undefined" ? document.referrer || "" : "";
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const touch = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer,
        visitor_id: getVisitorId(),
        device_type: detectDeviceType(ua, touch),
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
