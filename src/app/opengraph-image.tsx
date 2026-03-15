/**
 * 홈 OG 이미지 (동적 생성)
 * SNS 공유 시 1200×630 이미지 자동 생성
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "룸빵여지도 — 믿을 수 있는 업소를 한눈에";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  let fontData: ArrayBuffer | null = null;
  try {
    fontData = await fetch(
      new URL("https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2")
    ).then((res) => (res.ok ? res.arrayBuffer() : Promise.resolve(null)));
  } catch {
    /* 폰트 로드 실패 시 기본 폰트 사용 */
  }

  const fontConfig = fontData ? [{ name: "Noto Sans KR", data: fontData, weight: 700 as const }] : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#070707",
          display: "flex",
          fontFamily: fontData ? '"Noto Sans KR"' : 'system-ui, "Segoe UI", sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(200,168,75,0.22) 0%, rgba(180,140,40,0.08) 35%, transparent 55%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#c8a84b",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40px",
            bottom: "40px",
            left: "820px",
            width: "1px",
            background: "rgba(200,168,75,0.3)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: "60px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "linear-gradient(135deg, #edd97a, #c8a84b, #96620e)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 900,
              color: "#120800",
            }}
          >
            빵
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "#c8a84b" }}>룸빵여지도</span>
            <span
              style={{
                fontSize: "12px",
                color: "rgba(200,168,75,0.5)",
                letterSpacing: "0.12em",
              }}
            >
              ROOMBANG YEOJIDO
            </span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: "165px",
            left: "60px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <span
            style={{
              fontSize: "58px",
              fontWeight: 700,
              color: "#f0e0a0",
              lineHeight: 1.2,
            }}
          >
            믿을 수 있는 업소를 한눈에!
          </span>
          <span
            style={{
              fontSize: "22px",
              color: "rgba(200,168,75,0.85)",
              marginTop: "12px",
            }}
          >
            룸빵여지도에서 전국 유흥 정보를 확인하세요.
          </span>
          <span
            style={{
              fontSize: "18px",
              color: "rgba(180,158,105,0.8)",
              marginTop: "8px",
            }}
          >
            검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다.
          </span>
          <span
            style={{
              fontSize: "16px",
              color: "rgba(160,138,90,0.75)",
              marginTop: "10px",
            }}
          >
            6시간마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "860px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {[
            { val: "380+", label: "검증된 업소" },
            { val: "3,200+", label: "실제 이용 후기" },
            { val: "6시간", label: "자동 업데이트" },
            { val: "4개", label: "주요 지역 서비스" },
          ].map(({ val, label }) => (
            <div
              key={val}
              style={{
                width: "300px",
                height: "106px",
                background: "rgba(18,13,3,0.8)",
                border: "1px solid rgba(200,168,75,0.25)",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#c8a84b" }}>{val}</span>
              <span style={{ fontSize: "16px", color: "rgba(160,140,100,0.8)" }}>{label}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "62px",
            fontSize: "16px",
            color: "rgba(100,80,50,0.7)",
            display: "flex",
          }}
        >
          rbbmap.com
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#c8a84b",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      ...(fontConfig && fontConfig.length > 0 ? { fonts: fontConfig } : {}),
    }
  );
}
