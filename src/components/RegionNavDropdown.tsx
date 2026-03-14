"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";

export default function RegionNavDropdown() {
  const [open, setOpen] = useState(false);
  const [regions, setRegions] = useState<{ slug: string; name: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const fetchRegions = useCallback(() => {
    fetch("/api/regions", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRegions(Array.isArray(data) ? data : []))
      .catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const handleOpen = () => {
    if (!open) fetchRegions();
    setOpen(!open);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="nav-dropdown-wrap" ref={ref}>
      <button
        type="button"
        className="nav-dropdown-trigger"
        onClick={handleOpen}
        aria-expanded={open}
        aria-haspopup="true"
      >
        지역
        <span className={`nav-dropdown-arrow ${open ? "open" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="nav-dropdown-panel">
          {regions.map((r) => (
            <Link
              key={r.slug}
              href={`/${r.slug}`}
              className="nav-dropdown-item"
              onClick={() => setOpen(false)}
            >
              {r.name}
            </Link>
          ))}
          <Link
            href="/regions"
            className="nav-dropdown-item nav-dropdown-all"
            onClick={() => setOpen(false)}
          >
            전체 지역 →
          </Link>
        </div>
      )}
    </div>
  );
}
