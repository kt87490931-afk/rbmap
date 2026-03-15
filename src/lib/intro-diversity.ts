/**
 * 업체소개글 다양성 — 오프닝 패턴, 포커스
 * 100개+ 업소 확장 시 중복 톤/패턴 방지
 */

/** 해시 시드 생성 (name+region+type → 0~N-1) */
export function hashSeed(str: string): number {
  let h = 0
  const s = (str || '').trim()
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

/** 오프닝 패턴 5종 — lead 첫 문장 시작 방식 */
export const INTRO_OPENING_PATTERNS = [
  {
    id: 'location_access',
    hint: '위치·접근성으로 시작',
    instruction:
      '리드 첫 문장을 "역/지하철/도보 거리" 등 접근성·위치로 시작하라. 예: "동탄역에서 10분, 남광장 인근의 …", "강남역 3번 출구 도보 5분 …"',
  },
  {
    id: 'differentiator',
    hint: '차별점·컨셉 선언으로 시작',
    instruction:
      '리드 첫 문장을 업소만의 차별점(최저가, 프리미엄, 1위 등) 선언으로 시작하라. 예: "동탄에서 최저가를 내건 …", "강남 1위를 목표로 하는 …"',
  },
  {
    id: 'target_value',
    hint: '대상·가치 제안으로 시작',
    instruction:
      '리드 첫 문장을 타깃 고객이나 가치 제안으로 시작하라. 예: "비즈니스 모임부터 소규모 모임까지 …", "처음 방문하는 분도 부담 없이 …"',
  },
  {
    id: 'numbers_fact',
    hint: '숫자·실적 강조로 시작',
    instruction:
      '리드 첫 문장을 구체적 숫자(라인업 수, 영업년수, 룸 수 등)로 시작하라. 예: "50명+ 라인업, 연중무휴 24시간 …", "10년간 운영 노하우가 쌓인 …"',
  },
  {
    id: 'insight_mood',
    hint: '인사이트·분위기로 시작',
    instruction:
      '리드 첫 문장을 업소의 분위기·느낌이나 방문자 인사이트로 시작하라. 예: "들어서는 순간부터 달라지는 분위기 …", "조용한 대화와 화끈한 노래가 공존하는 …"',
  },
] as const

export type IntroOpeningPatternId = (typeof INTRO_OPENING_PATTERNS)[number]['id']

/** 포커스 5종 — 이 업소 소개에서 강조할 축 */
export const INTRO_FOCUS_OPTIONS = [
  { id: 'facility', label: '시설·인테리어', instruction: '본문에서 시설, 인테리어, 룸 구성, 음향 등을 가장 많이 강조하라.' },
  { id: 'price', label: '가격·가성비', instruction: '본문에서 가격 투명성, 가성비, 정찰제, 할인 등을 가장 많이 강조하라.' },
  { id: 'access', label: '접근성·위치', instruction: '본문에서 위치, 교통, 주차, 픽업 등을 가장 많이 강조하라.' },
  { id: 'lineup', label: '라인업·서비스', instruction: '본문에서 매니저 라인업, 매칭, 케어 서비스를 가장 많이 강조하라.' },
  { id: 'trust', label: '신뢰·검증', instruction: '본문에서 신뢰, 검증, AS 보장, 프라이버시를 가장 많이 강조하라.' },
] as const

export type IntroFocusId = (typeof INTRO_FOCUS_OPTIONS)[number]['id']

/** 시드로 오프닝 패턴 선택 */
export function pickOpeningPattern(seed: number): (typeof INTRO_OPENING_PATTERNS)[number] {
  const idx = Math.abs(seed) % INTRO_OPENING_PATTERNS.length
  return INTRO_OPENING_PATTERNS[idx]
}

/** 시드로 포커스 선택 */
export function pickFocus(seed: number): (typeof INTRO_FOCUS_OPTIONS)[number] {
  const idx = Math.abs(seed) % INTRO_FOCUS_OPTIONS.length
  return INTRO_FOCUS_OPTIONS[idx]
}
