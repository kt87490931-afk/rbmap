/**
 * referrer URL에서 검색엔진 유입 시 검색어 추출
 * 구글, 네이버, 다음, 빙, 야후 등
 */
export function parseSearchQueryFromReferrer(referrer: string | null | undefined): string | null {
  if (!referrer || typeof referrer !== "string") return null;
  const trimmed = referrer.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    // Google (google.com, google.co.kr 등)
    if (host.includes("google.")) {
      const q = url.searchParams.get("q");
      return q ? decodeURIComponent(q) : null;
    }

    // Naver (search.naver.com, search.naver.com.kr, m.search.naver.com)
    if (host.includes("naver.")) {
      const q = url.searchParams.get("query") || url.searchParams.get("q");
      return q ? decodeURIComponent(q) : null;
    }

    // Daum (search.daum.net)
    if (host.includes("daum.net")) {
      const q = url.searchParams.get("q");
      return q ? decodeURIComponent(q) : null;
    }

    // Bing
    if (host.includes("bing.")) {
      const q = url.searchParams.get("q");
      return q ? decodeURIComponent(q) : null;
    }

    // Yahoo
    if (host.includes("yahoo.")) {
      const p = url.searchParams.get("p") || url.searchParams.get("q");
      return p ? decodeURIComponent(p) : null;
    }

    // DuckDuckGo
    if (host.includes("duckduckgo.")) {
      const q = url.searchParams.get("q");
      return q ? decodeURIComponent(q) : null;
    }

    // Nate (search.nate.com)
    if (host.includes("nate.com")) {
      const q = url.searchParams.get("q") || url.searchParams.get("query");
      return q ? decodeURIComponent(q) : null;
    }

    // Zum (search.zum.com)
    if (host.includes("zum.com")) {
      const q = url.searchParams.get("query") || url.searchParams.get("q");
      return q ? decodeURIComponent(q) : null;
    }

    return null;
  } catch {
    return null;
  }
}
