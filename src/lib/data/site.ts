import { supabase } from '../supabase'

export type SiteSectionKey =
  | 'hero'
  | 'ticker'
  | 'header'
  | 'seo'
  | 'widgets_a'
  | 'widgets_b'
  | 'stats'
  | 'cta'
  | 'footer'
  | 'region_preview'

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
    search_placeholder: '지역, 업소명, 업종 검색...',
    nav: [
      { label: '리뷰', href: '/reviews' },
      { label: '랭킹', href: '/ranking' },
      { label: '가이드', href: '/guide' },
      { label: '광고문의', href: '/contact', cta: true },
    ],
  },
  seo: {},
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
