"use client";

interface FaqItem {
  q: string;
  a: string;
}

const DEFAULT_FAQ: FaqItem[] = [
  { q: "리뷰는 어떻게 작성되나요?", a: "Gemini AI가 구글 플레이스 데이터를 기반으로 6시간마다 자동 생성합니다." },
  { q: "업소 등록은 어떻게 하나요?", a: "광고 문의 페이지를 통해 등록 신청이 가능합니다. 심사 후 등록됩니다." },
  { q: "가격 정보는 최신인가요?", a: "가격은 주 1회 업데이트되며, 실제 방문 시 변동이 있을 수 있습니다." },
];

interface FaqSectionProps {
  items?: FaqItem[];
}

export default function FaqSection({ items = DEFAULT_FAQ }: FaqSectionProps) {
  const list = items.length > 0 ? items : DEFAULT_FAQ;
  const toggle = (el: HTMLElement | null) => {
    if (el) el.classList.toggle("open");
  };

  return (
    <section className="faq-section section" aria-label="자주 묻는 질문">
      <div className="section-inner">
        <span className="section-label">FAQ</span>
        <h2 className="section-h2" style={{ marginBottom: 24 }}>자주 묻는 <em>질문</em></h2>
        <div className="faq-list">
          {list.map((f, i) => (
            <div key={i} className="faq-item">
              <div
                className="faq-q"
                onClick={(e) => toggle((e.currentTarget as HTMLElement).parentElement)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggle((e.currentTarget as HTMLElement).parentElement)}
              >
                <span>{f.q}</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
