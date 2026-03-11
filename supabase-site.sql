-- rbmap 메인 페이지 섹션 (어드민에서 수정 가능)
-- Supabase SQL Editor에서 supabase-sections.sql 실행 후 실행

CREATE TABLE IF NOT EXISTS site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_sections_anon_read" ON site_sections FOR SELECT USING (true);

-- 초기 데이터 (현재 하드코딩된 내용)
INSERT INTO site_sections (section_key, content) VALUES
('hero', '{
  "eyebrow": "Gemini AI · 6시간 자동 업데이트",
  "h1_line1": "전국 룸빵 정보,",
  "h1_line2": "여기서 다 찾자",
  "desc_1": "강남부터 제주까지 — 가라오케·룸싸롱·하이퍼블릭·셔츠룸",
  "desc_2": "지역별 검증 정보와 실제 이용 후기를 한눈에",
  "kpis": [
    {"num": "14", "label": "등록 지역"},
    {"num": "380+", "label": "등록 업소"},
    {"num": "3,200+", "label": "누적 리뷰"},
    {"num": "6H", "label": "업데이트"}
  ],
  "btns": [
    {"text": "🗺 지역 선택하기", "href": "#regions"},
    {"text": "최신 리뷰 →", "href": "/reviews"}
  ]
}'::jsonb),
('ticker', '{
  "items": [
    {"text": "강남 가라오케"},
    {"text": "수원 인계동 하이퍼블릭"},
    {"text": "동탄 셔츠룸"},
    {"text": "제주 룸싸롱"},
    {"text": "강남 달토 신규 리뷰"},
    {"text": "수원 아우라 후기 업데이트"},
    {"text": "동탄 신규 업소 등록"},
    {"text": "인천 서비스 오픈 예정"}
  ]
}'::jsonb),
('header', '{
  "logo_icon": "빵",
  "logo_text": "룸빵여지도",
  "logo_sub": "ROOMBANG YEOJIDO",
  "nav": [
    {"label": "업소별리뷰", "href": "/reviews"},
    {"label": "랭킹", "href": "/ranking"},
    {"label": "가이드", "href": "/guide"},
    {"label": "광고문의", "href": "/contact", "cta": true}
  ]
}'::jsonb),
('seo', '{
  "intro_label": "ABOUT 룸빵여지도",
  "intro_text": "<strong>룸빵여지도</strong>는 강남·수원·동탄·제주 등 전국 주요 지역의 <strong> 가라오케·룸싸롱·하이퍼블릭·셔츠룸·퍼블릭</strong> 정보를 한눈에 비교할 수 있는 국내 최대 유흥 정보 허브입니다. Gemini AI가 Google Places 데이터를 기반으로 <strong> 6시간마다 자동 업데이트</strong>하여 항상 가장 최신의 정보를 제공합니다.",
  "cards": [
    {"icon": "🤖", "title": "AI 기반 자동 업데이트", "desc": "Gemini AI가 구글 플레이스 데이터를 분석해 6시간마다 리뷰와 업소 정보를 자동 생성합니다. 수동으로 작성된 후기와 달리 편향 없이 객관적인 정보를 제공하며, 신규 업소도 빠르게 반영됩니다. 업소 현황이 바뀌면 다음 업데이트 사이클에 즉시 반영됩니다."},
    {"icon": "📍", "title": "전국 지역별 맞춤 정보", "desc": "강남·수원 인계동·동탄·제주를 시작으로 전국 14개 지역으로 확장 중입니다. 지역마다 업소 분포, 평균 가격, 인기 업종이 다릅니다. 룸빵여지도는 지역 특성에 맞는 맞춤 정보를 제공해 처음 방문하는 지역도 자신 있게 이용할 수 있도록 안내합니다."},
    {"icon": "💰", "title": "투명한 가격 정보 공개", "desc": "지역별·업종별 1인 평균 주대를 주 1회 업데이트합니다. 숨겨진 추가 비용 여부, 정찰제 운영 여부까지 리뷰를 통해 파악할 수 있습니다. 불필요한 비용 지출 없이 합리적인 선택을 할 수 있도록 가격 투명성을 최우선 가치로 삼습니다."}
  ],
  "region_tabs": [
    {"id": "tab-gangnam", "label": "강남"},
    {"id": "tab-suwon", "label": "수원 인계동"},
    {"id": "tab-dongtan", "label": "동탄"},
    {"id": "tab-jeju", "label": "제주"}
  ],
  "region_panels": {
    "tab-gangnam": {"title": "강남 _유흥 완전 가이드_ — 가라오케·하이퍼블릭·쩜오", "cols": [{"h4": "강남 가라오케란?", "ps": ["강남 가라오케는 서울 강남구 역삼동·논현동·청담동 일대에 밀집한 대한민국 최상급 유흥 업소를 통칭합니다. 전국에서 가장 높은 라인업 수준과 서비스 퀄리티를 자랑하며, 국내 유흥 문화의 기준점으로 불립니다. 강남 가라오케의 평균 주대는 1인 기준 50만~70만 원대이며, 프리미엄 하이퍼블릭의 경우 80만 원 이상을 호가합니다.", "퍼블릭은 노래를 즐기며 파트너와 함께하는 일반적인 가라오케 형태입니다. 하이퍼블릭은 퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태로 강남에서 가장 수요가 높습니다. 쩜오(0.5)는 하이퍼블릭과 일반 퍼블릭의 중간 단계로 가성비를 추구하는 방문객에게 적합합니다."]}, {"h4": "강남 이용 시 주의사항", "ps": ["강남 가라오케는 예약 없이 방문할 경우 대기가 발생할 수 있습니다. 특히 금요일·토요일 저녁 8시 이후는 예약 필수입니다. 담당 실장을 통해 예약하면 룸 배정과 초이스 진행이 훨씬 원활합니다. 또한 강남에서는 정찰제 운영 업소와 흥정 가능한 업소가 혼재하므로, 방문 전 가격 확인이 중요합니다.", "평일 오후 9시~자정이 라인업이 가장 풍부하고 대기가 적습니다. 주말은 저녁 7시 이전 조기 방문을 추천합니다. 강남 달토·퍼펙트·인트로 하이퍼블릭이 룸빵여지도 이용자 기준 최고 평점을 기록 중입니다."]}]},
    "tab-suwon": {"title": "수원 인계동 _유흥 완전 가이드_ — 경기도 최대 유흥가", "cols": [{"h4": "수원 인계동이란?", "ps": ["수원 인계동은 경기도 수원시 팔달구에 위치한 경기도 최대 규모의 유흥 밀집 지역입니다. 강남 수준의 서비스를 30~40% 저렴한 비용으로 이용할 수 있어 수원·안산·화성·오산 등 경기 남부권 전역에서 방문객이 찾아옵니다.", "수원 인계동 셔츠룸은 파트너가 환복 이벤트를 진행하는 서비스로 인계동의 특화 업종 중 하나입니다. 처음 방문하는 분들도 실장의 친절한 안내로 쉽게 이용할 수 있으며, 평균 주대는 1인 기준 35만~40만 원대입니다."]}, {"h4": "인계동 접근성", "ps": ["수원역에서 택시로 10분, 버스로 20분 거리에 위치합니다. 룸빵여지도 기준 아우라 가라오케(하이퍼블릭), 마징가 가라오케(퍼블릭), 메칸더 셔츠룸이 수원 인계동 최고 평점 업소입니다."]}]},
    "tab-dongtan": {"title": "동탄 _유흥 완전 가이드_ — 신도시 유흥의 빠른 성장", "cols": [{"h4": "동탄 유흥가 특징", "ps": ["동탄 신도시는 화성시 동탄면 일대에 조성된 대규모 신도시로, 2020년대 이후 유흥 씬이 빠르게 성장하고 있습니다. 동탄 가라오케의 평균 주대는 1인 25만~35만 원으로 강남 대비 절반 수준입니다."]}, {"h4": "동탄 이용 팁", "ps": ["동탄은 자차 방문이 압도적으로 많습니다. 비너스 셔츠룸이 동탄 압도적 1위입니다. 오로라 가라오케, 스타 퍼블릭이 뒤를 잇습니다."]}]},
    "tab-jeju": {"title": "제주 _유흥 완전 가이드_ — 관광지 특성의 독특한 유흥 문화", "cols": [{"h4": "제주 유흥의 특징", "ps": ["제주 가라오케·룸싸롱은 관광지 특성상 육지와는 다른 분위기를 가집니다. 제주 가라오케의 평균 주대는 1인 25만~35만 원대로 서울 강남 대비 저렴합니다."]}, {"h4": "제주 방문 시 주의사항", "ps": ["제주는 섬 특성상 전국에서 원정 방문하는 파트너가 많습니다. 제니스 클럽이 제주 최고 평점 업소입니다. 오션뷰 가라오케는 제주 야경을 감상하며 이용할 수 있는 뷰 맛집으로 유명합니다."]}]}
  },
  "type_cards": [
    {"icon": "🎤", "title": "가라오케", "desc": "노래방 형태의 룸에서 파트너와 함께 즐기는 가장 보편적인 업종입니다. 전국 168개 업소 등록.", "href": "/category/karaoke"},
    {"icon": "💎", "title": "하이퍼블릭", "desc": "퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태입니다. 전국 72개 업소 등록.", "href": "/category/highpublic"},
    {"icon": "👔", "title": "셔츠룸", "desc": "파트너의 환복 이벤트가 포함된 서비스입니다. 전국 54개 업소 등록.", "href": "/category/shirtroom"},
    {"icon": "⭐", "title": "쩜오 (0.5)", "desc": "하이퍼블릭과 퍼블릭의 중간 단계 서비스입니다. 전국 31개 업소 등록.", "href": "/category/jjomoh"}
  ],
  "kw_links": [
    {"href": "/gangnam/category/karaoke", "text": "강남 가라오케"},
    {"href": "/gangnam/category/highpublic", "text": "강남 하이퍼블릭"},
    {"href": "/suwon/category/karaoke", "text": "수원 가라오케"},
    {"href": "/dongtan/category/shirtroom", "text": "동탄 셔츠룸"},
    {"href": "/jeju/category/karaoke", "text": "제주 룸싸롱"},
    {"href": "/reviews", "text": "가라오케 후기"},
    {"href": "/reviews", "text": "룸싸롱 후기"}
  ]
}'::jsonb),
('widgets_a', '{
  "price_rows": [
    {"region": "강남", "type": "가라오케", "val": "55만", "chg": "fl"},
    {"region": "강남", "type": "하이퍼블릭", "val": "80만", "chg": "up"},
    {"region": "수원", "type": "가라오케", "val": "33만", "chg": "fl"},
    {"region": "수원", "type": "셔츠룸", "val": "38만", "chg": "dn"},
    {"region": "동탄", "type": "가라오케", "val": "30만", "chg": "up"},
    {"region": "제주", "type": "가라오케", "val": "28만", "chg": "fl"}
  ],
  "venue_ranks": [
    {"href": "/gangnam/venue/dalto", "rank": 1, "top": true, "name": "달토 가라오케", "sub": "강남 · 가라오케", "score": "9.8"},
    {"href": "/suwon/venue/aura", "rank": 2, "top": true, "name": "아우라 가라오케", "sub": "수원 인계동 · 하이퍼블릭", "score": "9.6"},
    {"href": "/gangnam/venue/perfect", "rank": 3, "top": true, "name": "퍼펙트 가라오케", "sub": "강남 · 가라오케", "score": "9.4"},
    {"href": "/dongtan/venue/venus", "rank": 4, "top": false, "name": "비너스 셔츠룸", "sub": "동탄 · 셔츠룸", "score": "9.1"},
    {"href": "/suwon/venue/mazinga", "rank": 5, "top": false, "name": "마징가 가라오케", "sub": "수원 인계동 · 퍼블릭", "score": "8.9"},
    {"href": "/jeju/venue/zenith", "rank": 6, "top": false, "name": "제니스 클럽", "sub": "제주 · 가라오케", "score": "8.7"},
    {"href": "/gangnam/venue/intro", "rank": 7, "top": false, "name": "인트로 하이퍼블릭", "sub": "강남 · 하이퍼블릭", "score": "8.5"}
  ],
  "categories": [
    {"href": "/category/karaoke", "icon": "🎤", "label": "가라오케", "count": "168개"},
    {"href": "/category/highpublic", "icon": "💎", "label": "하이퍼블릭", "count": "72개"},
    {"href": "/category/shirtroom", "icon": "👔", "label": "셔츠룸", "count": "54개"},
    {"href": "/category/public", "icon": "🥂", "label": "퍼블릭", "count": "86개"},
    {"href": "/category/jjomoh", "icon": "⭐", "label": "쩜오", "count": "31개"},
    {"href": "/category/hostbar", "icon": "🎭", "label": "호스트바", "count": "18개"}
  ],
  "keywords": [
    {"href": "/search?q=강남가라오케", "rank": "1", "text": "강남가라오케", "hot": true},
    {"href": "/search?q=수원하이퍼블릭", "rank": "2", "text": "수원하이퍼블릭", "hot": false},
    {"href": "/search?q=동탄셔츠룸", "rank": "3", "text": "동탄셔츠룸", "hot": false},
    {"href": "/search?q=제주룸싸롱", "rank": "4", "text": "제주룸싸롱", "hot": false},
    {"href": "/search?q=인계동아우라", "rank": "5", "text": "인계동아우라", "hot": false},
    {"href": "/search?q=강남달토", "rank": "↑", "text": "강남달토", "hot": true}
  ]
}'::jsonb),
('widgets_b', '{
  "timeline": [
    {"time": "06:00", "dot": "on", "title": "강남 달토 리뷰 업데이트", "desc": "Gemini AI 자동 생성 · 가라오케"},
    {"time": "00:00", "dot": "on", "title": "수원 아우라 심야 후기 게재", "desc": "Gemini AI 자동 생성 · 하이퍼블릭"},
    {"time": "18:00", "dot": "", "title": "동탄 신규 업소 3곳 등록", "desc": "관리자 직접 등록 · 가라오케·셔츠룸"},
    {"time": "12:00", "dot": "", "title": "제주 TOP5 리뷰 게재", "desc": "Gemini AI 자동 생성 · 종합"},
    {"time": "06:00", "dot": "rd", "title": "가격 정보 일괄 업데이트", "desc": "전국 4개 지역 평균가 갱신"}
  ],
  "map_cells": [
    {"href": "/gangnam", "name": "강남", "sub": "서울", "on": true, "coming": false},
    {"href": "/suwon", "name": "수원", "sub": "경기", "on": false, "coming": false},
    {"href": "/dongtan", "name": "동탄", "sub": "경기", "on": false, "coming": false},
    {"href": "/incheon", "name": "인천", "sub": "준비중", "on": false, "coming": true},
    {"href": "/jeju", "name": "제주", "sub": "제주", "on": false, "coming": false},
    {"href": "/regions", "name": "전체", "sub": "모든지역", "on": false, "coming": false}
  ],
  "notices": [
    {"badge": "nb-u", "text": "<strong>동탄</strong> 신규 업소 3곳 추가 완료", "date": "03.11"},
    {"badge": "nb-a", "text": "<strong>광고 문의</strong> 월 단위 배너 모집 중", "date": "03.09"},
    {"badge": "nb-n", "text": "<strong>인천·부산</strong> 4월 오픈 예정", "date": "03.07"}
  ],
  "faq": [
    {"q": "리뷰는 어떻게 작성되나요?", "a": "Gemini AI가 구글 플레이스 데이터를 기반으로 6시간마다 자동 생성합니다."},
    {"q": "업소 등록은 어떻게 하나요?", "a": "광고 문의 페이지를 통해 등록 신청이 가능합니다. 심사 후 등록됩니다."},
    {"q": "가격 정보는 최신인가요?", "a": "가격은 주 1회 업데이트되며, 실제 방문 시 변동이 있을 수 있습니다."}
  ]
}'::jsonb),
('stats', '{
  "items": [
    {"num": "14", "label": "서비스 지역"},
    {"num": "380+", "label": "등록 업소"},
    {"num": "3,200+", "label": "누적 리뷰"},
    {"num": "6H", "label": "자동 업데이트"}
  ]
}'::jsonb),
('cta', '{
  "title": "내 업소를 룸빵여지도에 등록하세요",
  "desc": "전국 유흥 정보를 찾는 방문자에게 직접 노출됩니다",
  "btn_text": "광고 및 등록 문의하기",
  "btn_href": "/contact"
}'::jsonb),
('footer', '{
  "desc": "전국 지역별 가라오케·룸싸롱·하이퍼블릭·셔츠룸 정보를 한눈에. Gemini AI가 6시간마다 리뷰를 업데이트합니다.",
  "copyright": "© 2025 룸빵여지도. All rights reserved. | 본 사이트의 정보는 참고용이며 실제와 다를 수 있습니다.",
  "links": [
    {"label": "개인정보처리방침", "href": "/privacy"},
    {"label": "이용약관", "href": "/terms"}
  ],
  "cols": [
    {"title": "지역", "items": [{"label": "강남", "href": "/gangnam"}, {"label": "수원 인계동", "href": "/suwon"}, {"label": "동탄", "href": "/dongtan"}, {"label": "제주", "href": "/jeju"}, {"label": "전체 지역", "href": "/regions"}]},
    {"title": "업종", "items": [{"label": "가라오케", "href": "/category/karaoke"}, {"label": "하이퍼블릭", "href": "/category/highpublic"}, {"label": "셔츠룸", "href": "/category/shirtroom"}, {"label": "퍼블릭", "href": "/category/public"}, {"label": "쩜오", "href": "/category/jjomoh"}]},
    {"title": "서비스", "items": [{"label": "최신 리뷰", "href": "/reviews"}, {"label": "인기 랭킹", "href": "/ranking"}, {"label": "이용 가이드", "href": "/guide"}, {"label": "광고 문의", "href": "/contact"}, {"label": "사이트맵", "href": "/sitemap.xml"}]}
  ]
}'::jsonb),
('region_preview', '{
  "regions": [
    {"href": "/gangnam", "region": "강남", "count": "82개 업소 등록", "venues": [{"vname": "달토 가라오케", "type": "가라오케", "star": "★4.9"}, {"vname": "퍼펙트 가라오케", "type": "가라오케", "star": "★4.8"}, {"vname": "인트로 하이퍼블릭", "type": "하이퍼블릭", "star": "★4.7"}, {"vname": "구구단 쩜오", "type": "쩜오", "star": "★4.7"}]},
    {"href": "/suwon", "region": "수원 인계동", "count": "61개 업소 등록", "venues": [{"vname": "아우라 가라오케", "type": "하이퍼블릭", "star": "★4.9"}, {"vname": "마징가 가라오케", "type": "퍼블릭", "star": "★4.6"}, {"vname": "메칸더 셔츠룸", "type": "셔츠룸", "star": "★4.5"}, {"vname": "인스타 퍼블릭", "type": "퍼블릭", "star": "★4.4"}]},
    {"href": "/dongtan", "region": "동탄", "count": "34개 업소 등록", "venues": [{"vname": "비너스 셔츠룸", "type": "셔츠룸", "star": "★4.8"}, {"vname": "오로라 가라오케", "type": "가라오케", "star": "★4.6"}, {"vname": "스타 퍼블릭", "type": "퍼블릭", "star": "★4.5"}, {"vname": "루나 하이퍼블릭", "type": "하이퍼블릭", "star": "★4.4"}]},
    {"href": "/jeju", "region": "제주", "count": "28개 업소 등록", "venues": [{"vname": "제니스 클럽", "type": "가라오케", "star": "★4.8"}, {"vname": "오션뷰 가라오케", "type": "가라오케", "star": "★4.6"}, {"vname": "한라 퍼블릭", "type": "퍼블릭", "star": "★4.5"}, {"vname": "블루오션 바", "type": "바", "star": "★4.3"}]}
  ]
}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

-- reviews 테이블에 전문 리뷰용 컬럼 추가 (FullReviewSection)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS body_json JSONB DEFAULT '[]';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS char_count TEXT DEFAULT '';
