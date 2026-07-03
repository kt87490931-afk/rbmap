import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-[600px] md:min-h-[700px] bg-white overflow-hidden">
      {/* Map grid background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h-${i}`} className="w-full h-px bg-gradient-to-r from-transparent via-pink-100/40 to-transparent" />
          ))}
        </div>
        {/* Vertical grid lines */}
        <div className="absolute inset-0 flex flex-row justify-between px-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`v-${i}`} className="w-px h-full bg-gradient-to-b from-transparent via-purple-100/30 to-transparent" />
          ))}
        </div>
      </div>

      {/* Floating map pins */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Pin 1 - Seoul */}
        <div className="absolute top-24 left-[15%] md:left-[18%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-insta-pink to-insta-purple shadow-lg shadow-pink-200/50">
            <i className="ri-map-pin-2-fill text-white text-sm"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">서울</span>
        </div>

        {/* Pin 2 - Busan */}
        <div className="absolute top-[45%] right-[12%] md:right-[15%] flex flex-col items-center animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-insta-purple to-insta-pink shadow-lg shadow-purple-200/50">
            <i className="ri-map-pin-2-fill text-white text-sm"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">부산</span>
        </div>

        {/* Pin 3 - Daegu */}
        <div className="absolute top-[38%] left-[55%] md:left-[52%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg shadow-pink-200/50">
            <i className="ri-map-pin-2-fill text-white text-xs"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">대구</span>
        </div>

        {/* Pin 4 - Gwangju */}
        <div className="absolute top-[55%] left-[25%] md:left-[28%] flex flex-col items-center animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 shadow-lg shadow-purple-200/50">
            <i className="ri-map-pin-2-fill text-white text-xs"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">광주</span>
        </div>

        {/* Pin 5 - Daejeon */}
        <div className="absolute top-[32%] left-[38%] md:left-[40%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '1.5s' }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-purple-200/50">
            <i className="ri-map-pin-2-fill text-white text-xs"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">대전</span>
        </div>

        {/* Pin 6 - Jeju */}
        <div className="absolute bottom-24 right-[30%] md:right-[32%] flex flex-col items-center animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.8s' }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-200/50">
            <i className="ri-map-pin-2-fill text-white text-xs"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">제주</span>
        </div>

        {/* Pin 7 - Gangwon */}
        <div className="absolute top-[20%] right-[28%] md:right-[30%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '1.2s' }}>
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-200/50">
            <i className="ri-map-pin-2-fill text-white text-xs"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">강원</span>
        </div>

        {/* Pin 8 - Incheon */}
        <div className="absolute top-[28%] left-[10%] md:left-[12%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3.6s', animationDelay: '2.5s' }}>
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-insta-purple shadow-lg shadow-purple-200/50">
            <i className="ri-map-pin-2-fill text-white text-xs"></i>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm">인천</span>
        </div>
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-20 right-0 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-br from-pink-100/60 to-purple-100/60 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-64 md:w-80 h-64 md:h-80 bg-gradient-to-tr from-purple-100/50 to-pink-100/50 rounded-full blur-3xl -z-10"></div>

      {/* Hero Content */}
      <div className="relative z-10 w-full px-4 md:px-8 lg:px-12 pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-100 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-sm font-medium text-pink-600">
              실시간 업소 데이터 업데이트 중
            </span>
          </div>

          <h1 className="font-pretendard font-bold text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-tight mb-4">
            전국 룸빵주가
            <br />
            <span className="bg-gradient-to-r from-insta-pink to-insta-purple bg-clip-text text-transparent">
              여기서 다 찾자
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            전국 룸살롱, 노래방, 유흥주점 정보와 생생한 리뷰를 한눈에 확인하세요.
            <br className="hidden md:block" />
            AI가 생성한 진짜 후기로 현명한 선택을 도와드립니다.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg shadow-gray-100/50">
              <div className="w-10 h-10 flex items-center justify-center text-gray-400">
                <i className="ri-search-line text-xl"></i>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="지역, 업소명, 또는 업종을 검색해보세요"
                className="flex-1 bg-transparent outline-none text-sm md:text-base text-gray-800 placeholder:text-gray-400"
              />
              <button className="px-5 md:px-6 py-2.5 rounded-xl bg-gradient-to-r from-insta-pink to-insta-purple text-white text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                검색
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 md:gap-10">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900">10</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">지역</div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900">13</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">카테고리</div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-insta-pink to-insta-purple bg-clip-text text-transparent">
                1,000+
              </div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">업소</div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-insta-pink to-insta-purple bg-clip-text text-transparent">
                6H
              </div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">업데이트</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}