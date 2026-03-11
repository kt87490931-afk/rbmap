"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const REGIONS = [
  { slug: "gangnam", name: "강남" },
  { slug: "suwon", name: "수원 인계동" },
  { slug: "dongtan", name: "동탄" },
  { slug: "jeju", name: "제주" },
];

export default function RegionNavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        지역
        <span className={`nav-dropdown-arrow ${open ? "open" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="nav-dropdown-panel">
          {REGIONS.map((r) => (
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
