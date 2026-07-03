import { reviews } from "@/mocks/reviews";

export default function PopularReviews() {
  const popularReviews = reviews.slice(0, 12);

  return (
    <section id="popular" className="w-full py-10 md:py-14 bg-gradient-to-b from-purple-50/30 via-white to-pink-50/20">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-purple-50">
            <i className="ri-heart-3-line text-lg text-insta-pink"></i>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">6시간마다 업데이트 인기 리뷰</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">가장 많은 공감을 받은 인기 리뷰들</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {popularReviews.map((review) => (
            <div
              key={review.id}
              className="group p-4 md:p-5 rounded-xl bg-white border border-gray-100 hover:border-purple-100 hover:shadow-md hover:shadow-purple-50/50 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <i className="ri-user-smile-line text-insta-pink text-sm"></i>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{review.author}</div>
                  <div className="text-xs text-gray-400">{review.date}</div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <i className="ri-star-fill text-yellow-400 text-xs"></i>
                  </div>
                  <span className="text-xs font-medium text-gray-700">{review.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-xs font-medium">
                  {review.region}
                </span>
                <span className="text-xs text-gray-400">{review.storeName}</span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-2">{review.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">
                {review.content}
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-insta-pink transition-colors">
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <i className="ri-thumb-up-line"></i>
                  </div>
                  <span>도움됨 {review.helpful}</span>
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <i className="ri-share-line"></i>
                  </div>
                  <span>공유</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}