import { regions } from "@/mocks/regions";

export default function RegionFilter() {
  return (
    <section id="regions" className="w-full py-10 md:py-14 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-purple-50">
            <i className="ri-map-2-line text-lg text-insta-pink"></i>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">지역별 업소</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">원하는 지역을 선택해서 업소를 찾아보세요</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3 md:gap-4">
          {regions.map((region) => (
            <button
              key={region.name}
              className="group relative p-3 md:p-4 rounded-xl bg-white border border-gray-100 hover:border-transparent hover:shadow-lg hover:shadow-pink-100/50 transition-all duration-300 text-left"
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${region.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="relative">
                <div className="text-sm md:text-base font-bold text-gray-900 group-hover:text-insta-pink transition-colors">
                  {region.name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {region.count.toLocaleString()}개
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}