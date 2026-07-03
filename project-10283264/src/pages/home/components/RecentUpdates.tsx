import { useState } from "react";
import { reviews } from "@/mocks/reviews";

export default function RecentUpdates() {
  const [activeTab, setActiveTab] = useState<"all" | "reviews" | "stores">("all");
  const [showCount, setShowCount] = useState(15);

  const filteredReviews = activeTab === "all" || activeTab === "reviews" ? reviews : [];
  const displayedReviews = filteredReviews.slice(0, showCount);

  return (
    <section id="updates" className="w-full py-10 md:py-14 bg-gradient-to-b from-pink-50/50 via-white to-purple-50/30">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-purple-50">
              <i className="ri-time-line text-lg text-insta-pink"></i>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">실시간 최신 업데이트</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">6시간마다 AI가 업데이트하는 생생한 리뷰</p>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-full bg-gray-100">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "reviews"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              리뷰
            </button>
            <button
              onClick={() => setActiveTab("stores")}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "stores"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              업소
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="group p-4 md:p-5 rounded-xl bg-white border border-gray-100 hover:border-pink-100 hover:shadow-md hover:shadow-pink-50/50 transition-all duration-300"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-store-2-line text-insta-pink text-sm md:text-base"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-xs font-medium">
                      {review.region}
                    </span>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 truncate">
                    {review.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                    {review.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                        <i className="ri-star-fill text-yellow-400 text-xs"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{review.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                        <i className="ri-thumb-up-line text-gray-400 text-xs"></i>
                      </div>
                      <span className="text-xs text-gray-500">{review.helpful}</span>
                    </div>
                    <span className="text-xs text-gray-400">{review.author}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCount < reviews.length && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowCount((prev) => prev + 15)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-pink-200 hover:text-insta-pink transition-all whitespace-nowrap"
            >
              <i className="ri-arrow-down-line"></i>
              더보기 ({reviews.length - showCount}개 남음)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}