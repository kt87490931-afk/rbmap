"use client";

import type { AnchorHTMLAttributes } from "react";

interface CallTrackLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  path: string;
  children: React.ReactNode;
}

export function CallTrackLink({ href, path, children, onClick, ...rest }: CallTrackLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    fetch("/api/track/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "call", path }),
    }).catch(() => {});
    onClick?.(e);
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
