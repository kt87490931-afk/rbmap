export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-100">
      <div className="w-full px-4 md:px-8 lg:px-12 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-insta-pink to-insta-purple flex items-center justify-center">
                <i className="ri-map-pin-line text-white text-sm"></i>
              </div>
              <span className="font-bold text-lg text-gray-900">룸빵여지도</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              전국 룸살롱, 노래방, 유흥주점 정보와 리뷰를 한눈에 제공하는 플랫폼입니다.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">빠른 링크</h3>
            <ul className="space-y-2">
              <li>
                <a href="#regions" className="text-sm text-gray-500 hover:text-insta-pink transition-colors">
                  지역별 업소
                </a>
              </li>
              <li>
                <a href="#updates" className="text-sm text-gray-500 hover:text-insta-pink transition-colors">
                  실시간 업데이트
                </a>
              </li>
              <li>
                <a href="#popular" className="text-sm text-gray-500 hover:text-insta-pink transition-colors">
                  인기 리뷰
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm text-gray-500 hover:text-insta-pink transition-colors">
                  자주 묻는 질문
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">업종</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-gray-500 hover:text-insta-pink transition-colors cursor-pointer">
                  룸살롱
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-500 hover:text-insta-pink transition-colors cursor-pointer">
                  노래방
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-500 hover:text-insta-pink transition-colors cursor-pointer">
                  룸바
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-500 hover:text-insta-pink transition-colors cursor-pointer">
                  유흥주점
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">문의</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-mail-line text-insta-pink text-xs"></i>
                </div>
                contact@rbbmap.com
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-kakao-talk-line text-insta-pink text-xs"></i>
                </div>
                카카오톡 문의
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:border-pink-200 hover:text-insta-pink transition-all">
                <i className="ri-instagram-line"></i>
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:border-pink-200 hover:text-insta-pink transition-all">
                <i className="ri-kakao-talk-line"></i>
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:border-pink-200 hover:text-insta-pink transition-all">
                <i className="ri-telegram-line"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            &copy; 2026 룸빵여지도. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}