/**
 * 리뷰 다양성 — 오프닝 훅, 금지 패턴
 * 업소별·시나리오별 중복 느낌 방지
 */

import { hashSeed } from './intro-diversity'

/** 리뷰 오프닝 훅 6종 — 본문 첫 문장 시작 방식 */
export const REVIEW_OPENING_HOOKS = [
  {
    id: 'experience',
    instruction: '본문 첫 문장을 "방문한 날", "이번에 갔을 때" 등 구체적 경험 시점으로 시작하라.',
  },
  {
    id: 'price',
    instruction: '본문 첫 문장을 가격·비용 관련 얘기로 시작하라. 예: "가격 대비 만족도가 …", "주대 생각보다 …"',
  },
  {
    id: 'atmosphere',
    instruction: '본문 첫 문장을 분위기·인상으로 시작하라. 예: "들어가자마자 느껴지는 …", "분위기가 예상보다 …"',
  },
  {
    id: 'service',
    instruction: '본문 첫 문장을 서비스·매니저 얘기로 시작하라. 예: "실장님 케어가 …", "매칭이 …"',
  },
  {
    id: 'comparison',
    instruction: '본문 첫 문장을 비교·선택 이유로 시작하라. 예: "다른 곳이랑 비교해보면 …", "여기 고른 이유는 …"',
  },
  {
    id: 'result',
    instruction: '본문 첫 문장을 결과·만족도로 시작하라. 예: "결론부터 말하면 …", "돈 아깝지 않았어요 …"',
  },
] as const

export type ReviewOpeningHookId = (typeof REVIEW_OPENING_HOOKS)[number]['id']

/** 시드로 오프닝 훅 선택 */
export function pickReviewOpeningHook(seed: number): (typeof REVIEW_OPENING_HOOKS)[number] {
  const idx = Math.abs(seed) % REVIEW_OPENING_HOOKS.length
  return REVIEW_OPENING_HOOKS[idx]
}

/** 리뷰 금지 패턴 — 피해야 할 클리셰 */
export const REVIEW_BAN_PATTERNS =
  '다음과 같이 시작하지 마라: "이번에 OO에 다녀왔습니다", "친구 추천으로 방문했어요", "처음 가보는 곳이었는데". ' +
  '다른 업소 리뷰와 구분되는 독특한 오프닝을 써라. 매번 비슷한 인사말은 금지.'

/** venue+scenario 기반 시드 */
export function reviewSeed(venueName: string, scenarioHash: string): number {
  return hashSeed(venueName + '|' + scenarioHash)
}

/** 리뷰 포커스 5종 — 본문에서 강조할 축 (업체소개와 동일 다양성) */
export const REVIEW_FOCUS_OPTIONS = [
  { id: 'facility', label: '시설·인테리어', instruction: '본문에서 시설, 인테리어, 룸 분위기, 음향 등을 특히 강조하라.' },
  { id: 'price', label: '가격·가성비', instruction: '본문에서 가격 대비 만족도, 가성비, 투명한 가격 등을 특히 강조하라.' },
  { id: 'service', label: '서비스·매니저', instruction: '본문에서 매니저 케어, 매칭, 서비스 품질 등을 특히 강조하라.' },
  { id: 'comparison', label: '비교·차별점', instruction: '본문에서 다른 곳과 비교한 차별점, 선택 이유를 특히 강조하라.' },
  { id: 'mood', label: '분위기·결과', instruction: '본문에서 방문 후 기분 전환, 만족도, 전체적인 분위기를 특히 강조하라.' },
] as const

export type ReviewFocusId = (typeof REVIEW_FOCUS_OPTIONS)[number]['id']

/** 시드로 리뷰 포커스 선택 */
export function pickReviewFocus(seed: number): (typeof REVIEW_FOCUS_OPTIONS)[number] {
  const idx = Math.abs(seed) % REVIEW_FOCUS_OPTIONS.length
  return REVIEW_FOCUS_OPTIONS[idx]
}
