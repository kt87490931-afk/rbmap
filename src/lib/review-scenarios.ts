/**
 * 리뷰 다양성 확보 - 6축 시나리오 풀
 * 유사도 검사 없이 조합 기반으로 중복 방지
 * @see 리뷰다 다양성 확보 선택지.txt
 */

/** 인원수 */
export const SCENARIO_PEOPLE = [
  { id: 'solo', label: '1명 혼술', desc: '혼자 조용히 마시고 싶을 때, 스트레스 폭발한 날' },
  { id: 'pair', label: '2명 단짝', desc: '편하게 한잔, 의리' },
  { id: 'small', label: '3~4명 소모임', desc: '친구, 동네 선후배' },
  { id: 'group', label: '5~6명 이상 단체', desc: '군대 동기, 대학 과동기, 운동 동호회, 동네 불알친구' },
] as const

/** 시간대 */
export const SCENARIO_TIME = [
  { id: 'early', label: '오픈 직후 19~20시', desc: '조용한 대화, 첫 손님 대접, 대기 없음' },
  { id: 'peak', label: '피크 21~23시', desc: '북적이는 분위기, 에너지 넘침, 가장 핫한 시간' },
  { id: 'late', label: '심야 00~02시', desc: '2차 절정, 분위기 무르익음, 화끈한 텐션' },
  { id: 'dawn', label: '새벽/마감 03~05시', desc: '막차, 우리끼리만 있는 느낌, 실장님 특별 서비스' },
] as const

/** 동행/목적 */
export const SCENARIO_WHY = [
  { id: 'business', label: '비즈니스', desc: '중요 계약 성사 후, 바이어 접대, 직장 상사 모시기' },
  { id: 'friends', label: '친구/지인', desc: '전역 축하, 청첩장 모임, 오랜만의 회동' },
  { id: 'celebration', label: '기념일', desc: '내 생일, 친구 생일, 승진 축하, 보너스 탄 날, 첫 월급 기념' },
  { id: 'solo_reason', label: '혼술', desc: '실장님과 친분으로 방문, 스트레스 풀기' },
  { id: 'casual', label: '일상', desc: '저녁 식사 후, 1차 후 가볍게, 심심해서' },
] as const

/** 상황/이벤트 */
export const SCENARIO_EVENT = [
  { id: 'birthday', label: '생일파티', desc: '' },
  { id: 'promotion', label: '승진 기념', desc: '' },
  { id: 'project', label: '프로젝트 성공', desc: '' },
  { id: 'dinner_after', label: '저녁 식사 후', desc: '' },
  { id: 'second_round', label: '1차 후 가볍게', desc: '' },
  { id: 'stress', label: '스트레스 풀기', desc: '' },
  { id: 'curiosity', label: '호기심에 방문', desc: '' },
  { id: 'regular', label: '단골집 방문', desc: '' },
] as const

/** 방문 전 기분 */
export const SCENARIO_MOOD_BEFORE = [
  { id: 'bored', label: '심심해서', desc: '' },
  { id: 'worried', label: '내상 입을까 걱정', desc: '' },
  { id: 'low_expect', label: '큰 기대 없이', desc: '' },
  { id: 'determined', label: '오랜만에 작정하고', desc: '' },
  { id: 'sad', label: '우울해서', desc: '' },
] as const

/** 방문 후 기분 */
export const SCENARIO_MOOD_AFTER = [
  { id: 'worth', label: '돈 아깝지 않음', desc: '' },
  { id: 'healed', label: '내상 치유 완료', desc: '' },
  { id: 'energy', label: '에너지 충전', desc: '' },
  { id: 'forgot', label: '내일 출근 걱정 잊음', desc: '' },
  { id: 'regular', label: '단골 예약', desc: '' },
] as const

/** 매니저/서비스 포인트 */
export const SCENARIO_SERVICE = [
  { id: 'visual', label: '연예인급 비주얼', desc: '' },
  { id: 'mind', label: '마인드 대박', desc: '' },
  { id: 'tension', label: '텐션 장인', desc: '' },
  { id: 'care', label: '친절한 케어', desc: '' },
  { id: 'interior', label: '럭셔리한 인테리어', desc: '' },
  { id: 'sound', label: '음향 시설 굿', desc: '' },
  { id: 'choice', label: '센스 있는 초이스', desc: '' },
  { id: 'clean', label: '화장실 청결', desc: '' },
] as const

export type ScenarioPeople = (typeof SCENARIO_PEOPLE)[number]['id']
export type ScenarioTime = (typeof SCENARIO_TIME)[number]['id']
export type ScenarioWhy = (typeof SCENARIO_WHY)[number]['id']
export type ScenarioEvent = (typeof SCENARIO_EVENT)[number]['id']
export type ScenarioMoodBefore = (typeof SCENARIO_MOOD_BEFORE)[number]['id']
export type ScenarioMoodAfter = (typeof SCENARIO_MOOD_AFTER)[number]['id']
export type ScenarioService = (typeof SCENARIO_SERVICE)[number]['id']

export interface ScenarioCombo {
  people: ScenarioPeople
  time: ScenarioTime
  why: ScenarioWhy
  event: ScenarioEvent
  moodBefore: ScenarioMoodBefore
  moodAfter: ScenarioMoodAfter
  service: ScenarioService
}

/** 9종 리뷰 톤 (20대초~50대 + 솔직·감성) */
export const REVIEW_TONES = [
  { id: 'young_20s', name: '20대 초반 (MZ 새내기 톤)', charTarget: 800 },
  { id: 'mid_20s', name: '20대 중후반 (트렌디 힙스터 톤)', charTarget: 900 },
  { id: 'early_30s', name: '30대 초반 (스마트 직장인 톤)', charTarget: 900 },
  { id: 'mid_30s', name: '30대 중후반 (베테랑 형님 톤)', charTarget: 1000 },
  { id: 'early_40s', name: '40대 초반 (열정 자영업자 톤)', charTarget: 1000 },
  { id: 'mid_40s', name: '40대 중후반 (중후한 관리직 톤)', charTarget: 1000 },
  { id: 'senior_50s', name: '50대 이상 (여유로운 회장님 톤)', charTarget: 1000 },
  { id: 'honest_compare', name: '솔직·비교 톤', charTarget: 900 },
  { id: 'story_emotion', name: '감성·스토리 톤', charTarget: 900 },
] as const

export type ReviewTone = (typeof REVIEW_TONES)[number]['id']

/** 시나리오를 프롬프트용 문자열로 변환 */
export function scenarioToPromptText(combo: ScenarioCombo, tone: ReviewTone): string {
  const p = SCENARIO_PEOPLE.find((x) => x.id === combo.people)
  const t = SCENARIO_TIME.find((x) => x.id === combo.time)
  const w = SCENARIO_WHY.find((x) => x.id === combo.why)
  const e = SCENARIO_EVENT.find((x) => x.id === combo.event)
  const mb = SCENARIO_MOOD_BEFORE.find((x) => x.id === combo.moodBefore)
  const ma = SCENARIO_MOOD_AFTER.find((x) => x.id === combo.moodAfter)
  const s = SCENARIO_SERVICE.find((x) => x.id === combo.service)
  const toneInfo = REVIEW_TONES.find((x) => x.id === tone)

  return [
    `[톤] ${toneInfo?.name ?? tone}`,
    `[인원] ${p?.label ?? combo.people}`,
    `[방문 시간] ${t?.label ?? combo.time} — ${t?.desc ?? ''}`,
    `[목적] ${w?.label ?? combo.why} — ${w?.desc ?? ''}`,
    `[상황] ${e?.label ?? combo.event}`,
    `[방문 전 기분] ${mb?.label ?? combo.moodBefore}`,
    `[방문 후 느낌] ${ma?.label ?? combo.moodAfter}`,
    `[서비스 포인트] ${s?.label ?? combo.service}`,
  ].join('\n')
}

/** 랜덤 선택 (배열에서 1개) */
function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 기존 사용 이력과 다른 것 우선 선택 (중복 느낌 방지) */
function pickDifferent<T extends { id: string }>(pool: readonly T[], usedIds: string[]): T {
  const used = new Set(usedIds)
  const unused = pool.filter((x) => !used.has(x.id))
  const arr = unused.length >= 2 ? unused : [...pool]
  return pickRandom(arr)
}

/**
 * 새 시나리오 조합 생성
 * recentCombos: 이 업체의 최근 N개 리뷰에 사용된 조합
 */
export function pickScenarioCombo(recentCombos: ScenarioCombo[]): ScenarioCombo {
  const usedPeople = recentCombos.map((c) => c.people)
  const usedTime = recentCombos.map((c) => c.time)
  const usedWhy = recentCombos.map((c) => c.why)
  const usedEvent = recentCombos.map((c) => c.event)
  const usedMoodB = recentCombos.map((c) => c.moodBefore)
  const usedMoodA = recentCombos.map((c) => c.moodAfter)
  const usedService = recentCombos.map((c) => c.service)

  return {
    people: pickDifferent(SCENARIO_PEOPLE, usedPeople).id as ScenarioPeople,
    time: pickDifferent(SCENARIO_TIME, usedTime).id as ScenarioTime,
    why: pickDifferent(SCENARIO_WHY, usedWhy).id as ScenarioWhy,
    event: pickDifferent(SCENARIO_EVENT, usedEvent).id as ScenarioEvent,
    moodBefore: pickDifferent(SCENARIO_MOOD_BEFORE, usedMoodB).id as ScenarioMoodBefore,
    moodAfter: pickDifferent(SCENARIO_MOOD_AFTER, usedMoodA).id as ScenarioMoodAfter,
    service: pickDifferent(SCENARIO_SERVICE, usedService).id as ScenarioService,
  }
}

/** 랜덤 톤 선택 (최근 사용 톤 우회) */
export function pickTone(recentTones: ReviewTone[]): ReviewTone {
  const used = new Set(recentTones)
  const available = REVIEW_TONES.filter((t) => !used.has(t.id) || Math.random() > 0.6)
  const arr = available.length > 0 ? available : [...REVIEW_TONES]
  return pickRandom(arr).id
}
