import { supabase } from '../supabase'

export type SiteSectionKey =
  | 'hero'
  | 'ticker'
  | 'header'
  | 'about'
  | 'region_guide'
  | 'category_guide'
  | 'widgets_a'
  | 'widgets_b'
  | 'stats'
  | 'cta'
  | 'footer'
  | 'region_preview'
  | 'partners_config'
  | 'feed_config'
  | 'review_config'
  | 'region_sidebar'
  | 'seo'
  | 'visitor_config'

const FALLBACKS: Record<SiteSectionKey, unknown> = {
  hero: {
    eyebrow: '20분 자동 업데이트',
    h1_line1: '전국 룸빵 정보,',
    h1_line2: '여기서 다 찾자',
    desc_1: '검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다.',
    desc_2: '최신 정보로 실패 없는 밤을 약속합니다.',
    kpis: [
      { num: '—', label: '등록 지역' },
      { num: '—', label: '등록 업소' },
      { num: '—', label: '누적 리뷰' },
      { num: '20분', label: '업데이트' },
    ],
    btns: [
      { text: '🗺 지역 선택하기', href: '#regions' },
      { text: '최신 리뷰 →', href: '/reviews' },
    ],
  },
  ticker: {
    items: [
      { text: '강남 가라오케' },
      { text: '수원 인계동 하이퍼블릭' },
      { text: '동탄 셔츠룸' },
      { text: '제주 룸싸롱' },
    ],
  },
  header: {
    logo_icon: '빵',
    logo_text: '룸빵여지도',
    logo_sub: 'ROOMBANG YEOJIDO',
    nav: [
      { label: '업소별리뷰', href: '/reviews' },
      { label: '문의', href: 'https://t.me/rbbmap', cta: true },
    ],
  },
  about: {
    intro_label: 'ABOUT 룸빵여지도',
    intro_text: '<strong>룸빵여지도</strong>는 강남·수원·동탄·제주 등 전국 주요 지역의 <strong>가라오케·룸싸롱·하이퍼블릭·셔츠룸·퍼블릭</strong> 정보를 한눈에 비교할 수 있는 국내 최대 유흥 정보 허브입니다. AI가 Google Places 데이터를 기반으로 <strong>20분마다 자동 업데이트</strong>하여 항상 가장 최신의 정보를 제공합니다.',
    cards: [
      { icon: '🤖', title: 'AI 기반 자동 업데이트', desc: 'AI가 구글 플레이스 데이터를 분석해 20분마다 리뷰와 업소 정보를 자동 생성합니다.' },
      { icon: '📍', title: '전국 지역별 맞춤 정보', desc: '강남·수원 인계동·동탄·제주를 시작으로 전국 14개 지역으로 확장 중입니다.' },
      { icon: '💰', title: '투명한 가격 정보 공개', desc: '지역별·업종별 1인 평균 주대를 주 1회 업데이트합니다.' },
    ],
  },
  region_guide: {
    region_tabs: [
      { id: 'tab-gangnam', label: '강남' },
      { id: 'tab-suwon', label: '수원 인계동' },
      { id: 'tab-dongtan', label: '동탄' },
      { id: 'tab-jeju', label: '제주' },
    ],
    region_panels: {
      'tab-gangnam': {
        title: '강남 _유흥 완전 가이드_ — 가라오케·하이퍼블릭·쩜오',
        cols: [
          { h4: '강남 가라오케란?', ps: ['강남 가라오케는 서울 강남구 역삼동·논현동·청담동 일대에 밀집한 대한민국 최상급 유흥 업소를 통칭합니다. 전국에서 가장 높은 라인업 수준과 서비스 퀄리티를 자랑합니다.', '퍼블릭은 노래를 즐기며 파트너와 함께하는 일반적인 가라오케 형태입니다. 하이퍼블릭은 밀착 서비스가 강화된 프리미엄 형태입니다.'] },
          { h4: '강남 이용 시 주의사항', ps: ['예약 없이 방문할 경우 대기가 발생할 수 있습니다. 금요일·토요일 저녁 8시 이후는 예약 필수입니다.'] },
        ],
      },
      'tab-suwon': {
        title: '수원 인계동 _유흥 완전 가이드_ — 경기도 최대 유흥가',
        cols: [
          { h4: '수원 인계동이란?', ps: ['수원 인계동은 경기도 최대 규모의 유흥 밀집 지역입니다. 강남 수준의 서비스를 30~40% 저렴한 비용으로 이용할 수 있습니다.'] },
          { h4: '인계동 접근성', ps: ['수원역에서 택시로 10분, 버스로 20분 거리입니다.'] },
        ],
      },
      'tab-dongtan': {
        title: '동탄 _유흥 완전 가이드_ — 신도시 유흥의 빠른 성장',
        cols: [
          { h4: '동탄 유흥가 특징', ps: ['동탄 신도시는 화성시 동탄면 일대에 조성된 대규모 신도시로, 유흥 씬이 빠르게 성장하고 있습니다.'] },
          { h4: '동탄 이용 팁', ps: ['자차 방문이 압도적으로 많습니다. 주요 업소 대부분이 넓은 전용 주차장을 운영합니다.'] },
        ],
      },
      'tab-jeju': {
        title: '제주 _유흥 완전 가이드_ — 관광지 특성의 독특한 유흥 문화',
        cols: [
          { h4: '제주 유흥의 특징', ps: ['제주 가라오케·룸싸롱은 관광지 특성상 육지와는 다른 분위기를 가집니다.'] },
          { h4: '제주 방문 시 주의사항', ps: ['시즌에 따라 라인업 수준의 편차가 큽니다. 방문 전 최신 리뷰 확인을 추천합니다.'] },
        ],
      },
    },
  },
  category_guide: {
    type_cards: [
      { icon: '🎤', title: '가라오케', desc: '노래방 형태의 룸에서 파트너와 함께 즐기는 가장 보편적인 업종입니다.', href: '/category/karaoke' },
      { icon: '💎', title: '하이퍼블릭', desc: '퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태입니다.', href: '/category/highpublic' },
      { icon: '👔', title: '셔츠룸', desc: '파트너의 환복 이벤트가 포함된 서비스입니다.', href: '/category/shirtroom' },
      { icon: '⭐', title: '쩜오 (0.5)', desc: '하이퍼블릭과 퍼블릭의 중간 단계 서비스입니다.', href: '/category/jjomoh' },
    ],
    kw_links: [
      { href: '/gangnam/category/karaoke', text: '강남 가라오케' },
      { href: '/suwon/category/highpublic', text: '수원 하이퍼블릭' },
      { href: '/dongtan/category/shirtroom', text: '동탄 셔츠룸' },
      { href: '/jeju/category/karaoke', text: '제주 가라오케' },
    ],
  },
  partners_config: { display_limit: 0 },
  feed_config: { display_limit: 10 },
  review_config: { display_limit: 6 },
  visitor_config: { visitor_offset: 0 },
  widgets_a: {
    price_rows: [
      { region: '강남', type: '가라오케', val: '55만', chg: 'fl' },
      { region: '강남', type: '하이퍼블릭', val: '80만', chg: 'up' },
      { region: '수원', type: '가라오케', val: '33만', chg: 'fl' },
      { region: '수원', type: '셔츠룸', val: '38만', chg: 'dn' },
      { region: '동탄', type: '가라오케', val: '30만', chg: 'up' },
      { region: '제주', type: '가라오케', val: '28만', chg: 'fl' },
    ],
    venue_ranks: [
      { href: '/gangnam/venue/dalto', rank: 1, top: true, name: '달토 가라오케', sub: '강남 · 가라오케', score: '9.8' },
      { href: '/suwon/venue/aura', rank: 2, top: true, name: '아우라 가라오케', sub: '수원 인계동 · 하이퍼블릭', score: '9.6' },
      { href: '/gangnam/venue/perfect', rank: 3, top: true, name: '퍼펙트 가라오케', sub: '강남 · 가라오케', score: '9.4' },
      { href: '/dongtan/venue/venus', rank: 4, top: false, name: '비너스 셔츠룸', sub: '동탄 · 셔츠룸', score: '9.1' },
      { href: '/suwon/venue/mazinga', rank: 5, top: false, name: '마징가 가라오케', sub: '수원 인계동 · 퍼블릭', score: '8.9' },
      { href: '/jeju/venue/zenith', rank: 6, top: false, name: '제니스 클럽', sub: '제주 · 가라오케', score: '8.7' },
      { href: '/gangnam/venue/intro', rank: 7, top: false, name: '인트로 하이퍼블릭', sub: '강남 · 하이퍼블릭', score: '8.5' },
    ],
    categories: [
      { href: '/category/karaoke', icon: '🎤', label: '가라오케', count: '168개' },
      { href: '/category/highpublic', icon: '💎', label: '하이퍼블릭', count: '72개' },
      { href: '/category/shirtroom', icon: '👔', label: '셔츠룸', count: '54개' },
      { href: '/category/public', icon: '🥂', label: '퍼블릭', count: '86개' },
      { href: '/category/jjomoh', icon: '⭐', label: '쩜오', count: '31개' },
      { href: '/category/hostbar', icon: '🎭', label: '호스트바', count: '18개' },
    ],
    keywords: [
      { href: '/search?q=강남가라오케', rank: '1', text: '강남가라오케', hot: true },
      { href: '/search?q=수원하이퍼블릭', rank: '2', text: '수원하이퍼블릭', hot: false },
      { href: '/search?q=동탄셔츠룸', rank: '3', text: '동탄셔츠룸', hot: false },
      { href: '/search?q=제주룸싸롱', rank: '4', text: '제주룸싸롱', hot: false },
      { href: '/search?q=인계동아우라', rank: '5', text: '인계동아우라', hot: false },
      { href: '/search?q=강남달토', rank: '↑', text: '강남달토', hot: true },
    ],
  },
  widgets_b: {
    timeline: [
      { time: '06:00', dot: 'on', title: '강남 달토 리뷰 업데이트', desc: 'AI 자동 생성 · 가라오케' },
      { time: '00:00', dot: 'on', title: '수원 아우라 심야 후기 게재', desc: 'AI 자동 생성 · 하이퍼블릭' },
      { time: '18:00', dot: '', title: '동탄 신규 업소 3곳 등록', desc: '관리자 직접 등록' },
      { time: '12:00', dot: '', title: '제주 TOP5 리뷰 게재', desc: 'AI 자동 생성' },
      { time: '06:00', dot: 'rd', title: '가격 정보 일괄 업데이트', desc: '전국 4개 지역 평균가 갱신' },
    ],
    map_cells: [
      { href: '/gangnam', name: '강남', sub: '서울', on: true, coming: false },
      { href: '/suwon', name: '수원', sub: '경기', on: false, coming: false },
      { href: '/dongtan', name: '동탄', sub: '경기', on: false, coming: false },
      { href: '/incheon', name: '인천', sub: '준비중', on: false, coming: true },
      { href: '/jeju', name: '제주', sub: '제주', on: false, coming: false },
      { href: '/regions', name: '전체', sub: '모든지역', on: false, coming: false },
    ],
    notices: [
      { badge: 'nb-u', text: '<strong>동탄</strong> 신규 업소 3곳 추가 완료', date: '03.11' },
      { badge: 'nb-a', text: '<strong>광고 문의</strong> 월 단위 배너 모집 중', date: '03.09' },
      { badge: 'nb-n', text: '<strong>인천·부산</strong> 4월 오픈 예정', date: '03.07' },
    ],
    faq: [
      { q: '리뷰는 어떻게 작성되나요?', a: 'AI가 구글 플레이스 데이터를 기반으로 20분마다 자동 생성합니다.' },
      { q: '업소 등록은 어떻게 하나요?', a: '광고 문의 페이지를 통해 등록 신청이 가능합니다. 심사 후 등록됩니다.' },
      { q: '가격 정보는 최신인가요?', a: '가격은 주 1회 업데이트되며, 실제 방문 시 변동이 있을 수 있습니다.' },
    ],
  },
  stats: {
    items: [
      { num: '14', label: '서비스 지역' },
      { num: '380+', label: '등록 업소' },
      { num: '3,200+', label: '누적 리뷰' },
      { num: '6H', label: '자동 업데이트' },
    ],
  },
  cta: {
    title: '내 업소를 룸빵여지도에 등록하세요',
    desc: '전국 유흥 정보를 찾는 방문자에게 직접 노출됩니다',
    btn_text: '광고 및 등록 문의하기',
    btn_href: 'https://t.me/rbbmap',
  },
  footer: {
    desc: '믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다. 20분마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.',
    copyright: '© 2025 룸빵여지도. All rights reserved.',
    links: [
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '이용약관', href: '/terms' },
    ],
    cols: [],
  },
  region_sidebar: {} as Record<string, { priceRows?: { type: string; val: string; chg: string }[]; priceNote?: string; tips?: { title: string; text: string; color: string }[]; nearbyRegions?: { slug: string; name: string; venues: number; reviews: number }[] }>,
  seo: {
    title: '룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보',
    description: '믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다. 20분마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.',
    ogImage: 'https://rbbmap.com/og/og-home.png',
    siteUrl: 'https://rbbmap.com',
    googleVerify: '-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY',
  },
  region_preview: {
    regions: [
      { href: '/gangnam', region: '강남', count: '82개 업소 등록', venues: [{ vname: '달토 가라오케', type: '가라오케', star: '★4.9' }, { vname: '퍼펙트 가라오케', type: '가라오케', star: '★4.8' }] },
      { href: '/suwon', region: '수원 인계동', count: '61개 업소 등록', venues: [{ vname: '아우라 가라오케', type: '하이퍼블릭', star: '★4.9' }] },
      { href: '/dongtan', region: '동탄', count: '34개 업소 등록', venues: [{ vname: '비너스 셔츠룸', type: '셔츠룸', star: '★4.8' }] },
      { href: '/jeju', region: '제주', count: '28개 업소 등록', venues: [{ vname: '제니스 클럽', type: '가라오케', star: '★4.8' }] },
    ],
  },
}

export const SECTION_FALLBACKS = FALLBACKS

export async function getSiteSection<T = unknown>(key: SiteSectionKey): Promise<T> {
  const { data, error } = await supabase
    .from('site_sections')
    .select('content')
    .eq('section_key', key)
    .maybeSingle()

  if (error || !data?.content) {
    return FALLBACKS[key] as T
  }
  return data.content as T
}
