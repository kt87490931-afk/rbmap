import { stores } from "@/mocks/stores";

export default function FeaturedStores() {
  return (
    <section className="w-full py-10 md:py-14 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <i className="ri-fire-line text-lg text-insta-purple"></i>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">지역별 주요 업소</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">각 지역에서 인기 있는 추천 업소</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {stores.map((store) => {
            const imageUrl = store.image
              ? store.image
              : `https://picsum.photos/400/300?random=${store.id}`;

            return (
              <div
                key={store.id}
                className="group rounded-xl bg-white border border-gray-100 overflow-hidden hover:border-pink-100 hover:shadow-lg hover:shadow-pink-100/30 transition-all duration-300"
              >
                <div className="relative h-36 md:h-44 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700">
                      {store.region}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700">
                      <i className="ri-star-fill text-yellow-400 text-xs"></i>
                      {store.rating}
                    </span>
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <div className="text-xs text-insta-pink font-medium mb-1">{store.category}</div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 truncate">
                    {store.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 truncate">{store.address}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {store.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      리뷰 {store.reviewCount}개
                    </span>
                    <button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-insta-pink to-insta-purple text-white text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}