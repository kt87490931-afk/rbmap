"use client";

import { useState } from "react";
import SectionFormEditor from "./admin/SectionFormEditor";

interface FaqItem {
  q: string;
  a: string;
}

const DEFAULT_FAQ: FaqItem[] = [
  { q: "리뷰는 어떻게 작성되나요?", a: "AI가 구글 플레이스 데이터를 기반으로 6시간마다 자동 생성합니다." },
  { q: "업소 등록은 어떻게 하나요?", a: "광고 문의 페이지를 통해 등록 신청이 가능합니다. 심사 후 등록됩니다." },
  { q: "가격 정보는 최신인가요?", a: "가격은 주 1회 업데이트되며, 실제 방문 시 변동이 있을 수 있습니다." },
];

interface FaqSectionProps {
  items?: FaqItem[];
  isAdmin?: boolean;
}

export default function FaqSection({ items = DEFAULT_FAQ, isAdmin }: FaqSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const list = items.length > 0 ? items : DEFAULT_FAQ;

  return (
    <section className="w-full bg-white py-10 md:py-14" id="faq" aria-label="자주 묻는 질문">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 text-lg">
              ❓
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">자주 묻는 질문</h2>
              <p className="mt-0.5 text-xs text-gray-500 md:text-sm">룸빵여지도에 대해 궁금한 점을 확인해보세요</p>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              aria-label="FAQ 설정"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-pink-200 hover:text-insta-pink"
            >
              ⚙
            </button>
          )}
        </div>

        {modalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-[680px] overflow-auto rounded-xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <SectionFormEditor sectionKey="faq" sectionLabel="자주 묻는 질문 (FAQ)" onClose={() => setModalOpen(false)} />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-3">
          {list.map((f, i) => {
            const open = openIndex === i;
            return (
              <div
                key={i}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  open ? "border-pink-200 bg-pink-50/30" : "border-gray-100 hover:border-pink-100"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                >
                  <span className="text-sm font-semibold text-gray-900 md:text-base">{f.q}</span>
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-lg transition-transform ${
                      open ? "rotate-45 bg-insta-pink text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    +
                  </span>
                </button>
                {open && (
                  <div className="border-t border-pink-100/80 px-4 pb-4 pt-2 text-sm leading-relaxed text-gray-600 md:px-5">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
