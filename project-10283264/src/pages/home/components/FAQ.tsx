import { useState } from "react";

const faqs = [
  {
    question: "룸빵여지도는 어떤 서비스인가요?",
    answer: "룸빵여지도는 전국 룸살롱, 노래방, 유흥주점 등의 업소 정보와 리뷰를 제공하는 플랫폼입니다. 제미나이 AI를 활용하여 제휴업소의 리뷰를 자동으로 생성하고, 6시간마다 최신 데이터를 업데이트합니다.",
  },
  {
    question: "리뷰는 어떻게 작성되나요?",
    answer: "룸빵여지도의 리뷰는 제미나이 AI가 자동으로 생성합니다. 업소의 실제 정보와 방문자들의 피드백을 바탕으로 AI가 자연스러운 리뷰를 생성하여, 사용자들에게 유용한 정보를 제공합니다.",
  },
  {
    question: "업소 정보는 얼마나 자주 업데이트되나요?",
    answer: "업소 정보는 6시간마다 자동으로 업데이트됩니다. 새로운 업소가 추가되거나 기존 업소의 정보가 변경되면, AI가 자동으로 데이터를 갱신하여 최신 정보를 제공합니다.",
  },
  {
    question: "내 지역 업소를 찾으려면 어떻게 하나요?",
    answer: "홈페이지 상단의 지역별 필터에서 원하는 지역을 클릭하거나, 검색창에 지역명을 입력하세요. 서울, 경기, 부산, 대구 등 전국 17개 지역의 업소를 쉽게 찾을 수 있습니다.",
  },
  {
    question: "업소를 등록하려면 어떻게 해야 하나요?",
    answer: "업소 등록은 관리자 페이지를 통해 가능합니다. 등록하려는 업소의 기본 정보(업소명, 주소, 연락처, 업종 등)를 제출하면, AI가 자동으로 리뷰를 생성하고 플랫폼에 등록됩니다.",
  },
  {
    question: "리뷰의 신뢰성은 보장되나요?",
    answer: "네, 룸빵여지도의 리뷰는 업소의 실제 정보를 기반으로 AI가 생성합니다. 또한 사용자들이 리뷰에 '도움됨'을 표시할 수 있어, 더 유용한 리뷰가 상단에 노출됩니다.",
  },
  {
    question: "모바일에서도 사용 가능한가요?",
    answer: "네, 룸빵여지도는 모바일 반응형 웹으로 제작되어 스마트폰과 태블릿에서도 편리하게 사용할 수 있습니다. 언제 어디서나 원하는 업소 정보를 확인하세요.",
  },
  {
    question: "검색 기능은 어떻게 사용하나요?",
    answer: "상단 검색창에서 지역명, 업소명, 또는 업종(룸살롱, 노래방 등)을 입력하세요. 검색 결과는 실시간으로 필터링되어, 원하는 업소를 빠르게 찾을 수 있습니다.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="w-full py-10 md:py-14 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <i className="ri-question-answer-line text-lg text-insta-purple"></i>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">자주 묻는 질문</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">룸빵여지도에 대해 궁금한 점을 확인해보세요</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-100 overflow-hidden hover:border-pink-100 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left"
              >
                <span className="text-sm md:text-base font-medium text-gray-900 pr-4">
                  {faq.question}
                </span>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-all ${
                  openIndex === index
                    ? "bg-gradient-to-r from-insta-pink to-insta-purple text-white"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  <i className={`ri-arrow-down-s-line transition-transform ${openIndex === index ? "rotate-180" : ""}`}></i>
                </div>
              </button>
              {openIndex === index && (
                <div className="px-4 md:px-5 pb-4 md:pb-5">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}