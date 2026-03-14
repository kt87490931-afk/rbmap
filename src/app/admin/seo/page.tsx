"use client";

import { useState, useEffect } from "react";

interface SeoData {
  title: string;
  description: string;
  ogImage: string;
  siteUrl: string;
  googleVerify: string;
}

export default function AdminSeoPage() {
  const [seo, setSeo] = useState<SeoData>({
    title: "",
    description: "",
    ogImage: "",
    siteUrl: "",
    googleVerify: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/site/seo")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSeo({
            title: data.title ?? "",
            description: data.description ?? "",
            ogImage: data.ogImage ?? "",
            siteUrl: data.siteUrl ?? "",
            googleVerify: data.googleVerify ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function showMsg(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site/seo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });
      if (res.ok) {
        showMsg("SEO 설정이 저장되었습니다!");
      } else {
        const err = await res.json().catch(() => ({}));
        showMsg((err as { error?: string }).error || "저장 실패");
      }
    } catch {
      showMsg("저장 실패");
    }
    setSaving(false);
  }

  if (loading) return <p style={{ color: "var(--muted)" }}>로딩 중...</p>;

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>SEO</h1>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Google Search Console · Open Graph · 메타 설정
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 14,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: "rgba(46,204,113,.1)",
            color: "var(--green)",
            border: "1px solid rgba(46,204,113,.3)",
          }}
        >
          {msg}
        </div>
      )}

      <div className="card-box">
        <div className="card-box-title">🔍 SEO 설정</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
            사이트 제목
          </label>
          <input
            className="form-input"
            value={seo.title}
            onChange={(e) => setSeo({ ...seo, title: e.target.value })}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
            메타 디스크립션
          </label>
          <textarea
            className="form-input"
            style={{ minHeight: 80, resize: "vertical" }}
            value={seo.description}
            onChange={(e) => setSeo({ ...seo, description: e.target.value })}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
              OG 이미지 URL
            </label>
            <input
              className="form-input"
              value={seo.ogImage}
              onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
              사이트 URL
            </label>
            <input
              className="form-input"
              value={seo.siteUrl}
              onChange={(e) => setSeo({ ...seo, siteUrl: e.target.value })}
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
            Google Search Console 인증 코드
          </label>
          <input
            className="form-input"
            value={seo.googleVerify}
            onChange={(e) => setSeo({ ...seo, googleVerify: e.target.value })}
          />
        </div>
        <button className="btn-save" onClick={save} disabled={saving}>
          {saving ? "저장 중..." : "💾 저장"}
        </button>
      </div>

      <div className="card-box">
        <div className="card-box-title">👁 SEO 미리보기</div>
        <div
          style={{
            padding: 16,
            background: "var(--deep)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            {seo.siteUrl || "https://rbbmap.com"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--blue)", marginBottom: 4 }}>
            {seo.title || "제목 미입력"}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{seo.description || "설명 미입력"}</div>
        </div>
      </div>

      <div className="card-box">
        <div className="card-box-title">🗺️ 사이트맵</div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          동적 사이트맵에 메인·지역·업체·리뷰 URL이 포함됩니다. 구글이 매일 크롤하도록 Ping이 KST 06시에 자동 실행됩니다.
        </p>
        <div
          style={{
            padding: 14,
            background: "var(--card2)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>사이트맵 URL</div>
          <a
            href={`${seo.siteUrl || "https://rbbmap.com"}/sitemap.xml`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 14, color: "var(--blue)", wordBreak: "break-all" }}
          >
            {seo.siteUrl || "https://rbbmap.com"}/sitemap.xml
          </a>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          <strong>포함 URL:</strong> 메인, /reviews, /regions, 지역별 페이지, 카테고리, 업체 소개글, 리뷰 페이지
        </div>
      </div>
    </>
  );
}
