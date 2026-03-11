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

const FALLBACKS: Record<SiteSectionKey, unknown> = {
  hero: {
    eyebrow: 'Gemini AI · 6시간 자동 업데이트',
    h1_line1: '전국 룸빵 정보,',
    h1_line2: '여기서 다 찾자',
    desc_1: '강남부터 제주까지 — 가라오케·룸싸롱·하이퍼블릭·셔츠룸',
    desc_2: '지역별 검증 정보와 실제 이용 후기를 한눈에',
    kpis: [
      { num: '14', label: '등록 지역' },
      { num: '380+', label: '등록 업소' },
      { num: '3,200+', label: '누적 리뷰' },
      { num: '6H', label: '업데이트' },
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
      { label: '랭킹', href: '/ranking' },
      { label: '가이드', href: '/guide' },
      { label: '광고문의', href: '/contact', cta: true },
    ],
  },
  about: {
    intro_label: 'ABOUT 룸빵여지도',
    intro_text: '<strong>룸빵여지도</strong>는 강남·수원·동탄·제주 등 전국 주요 지역의 <strong>가라오케·룸싸롱·하이퍼블릭·셔츠룸·퍼블릭</strong> 정보를 한눈에 비교할 수 있는 국내 최대 유흥 정보 허브입니다. Gemini AI가 Google Places 데이터를 기반으로 <strong>6시간마다 자동 업데이트</strong>하여 항상 가장 최신의 정보를 제공합니다.',
    cards: [
      { icon: '🤖', title: 'AI 기반 자동 업데이트', desc: 'Gemini AI가 구글 플레이스 데이터를 분석해 6시간마다 리뷰와 업소 정보를 자동 생성합니다.' },
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
    region_panels: {},
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
  review_config: { grid_limit: 6, full_limit: 10 },
  widgets_a: {},
  widgets_b: {},
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
    btn_href: '/contact',
  },
  footer: {
    desc: '전국 지역별 가라오케·룸싸롱·하이퍼블릭·셔츠룸 정보를 한눈에.',
    copyright: '© 2025 룸빵여지도. All rights reserved.',
    links: [
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '이용약관', href: '/terms' },
    ],
    cols: [],
  },
  region_preview: { regions: [] },
}

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
