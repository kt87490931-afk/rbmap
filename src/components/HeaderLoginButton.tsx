"use client";

import { useSession, signIn } from "next-auth/react";

export function HeaderLoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user?.role === "admin") {
    return (
      <a href="/admin" className="nav-login nav-login-admin">
        관리자
      </a>
    );
  }

  return (
    <button
      type="button"
      className="nav-login"
      onClick={() => signIn("google", { callbackUrl: "/admin/verify-otp" })}
    >
      로그인
    </button>
  );
}
