/**
 * 업체소개글 체크리스트 옵션 (id→label 매핑)
 * 페이지 UI와 API 프롬프트에서 공용
 */

export const INTERIOR_LABELS: Record<string, string> = {
  luxury_gold: '럭셔리 & 골드 (고급스러운 대리석 느낌)',
  modern_white: '모던 & 화이트 (심플하고 깔끔한 느낌)',
  cyberpunk: '사이버 펑크 (화려한 네온 조명)',
  private_classic: '프라이빗 클래식 (중후하고 조용한 분위기)',
  hip_club: '힙한 클럽 스타일 (화려한 무빙 라이트)',
  wood_warm: '우드 & 웜톤 (따뜻한 나무 인테리어)',
  minimal_black: '미니멀 블랙 (시크하고 모던한 검정톤)',
  vintage_retro: '빈티지/레트로 (감성적인 옛날 분위기)',
  penthouse_view: '펜트하우스 뷰 (전망·야경 강조)',
  art_gallery: '아트 갤러리 컨셉 (작품 전시형)',
}

export const ROOM_CONDITION_LABELS: Record<string, string> = {
  large_50: '50인 수용 대형룸 (단체/회식 최적)',
  room_toilet: '룸 내 개별 화장실 완비',
  non_smoking: '비흡연자를 위한 금연룸 운영',
  air_purifier: '최신형 공기청정기 풀가동',
  soundproof: '층간 소음 완벽 차단 (방음 시설)',
  small_private: '프라이빗 소형룸',
  party_room: '파티/이벤트룸',
  vip_room: 'VIP 전용 룸 (프라이빗 최상급)',
  multi_room: '다양한 크기 룸 구성 (2인~10인)',
  terrace_room: '테라스/루프탑 룸',
  karaoke_pro: '노래방 전문 대형룸',
  meeting_room: '미팅/접대용 공식룸',
}

export const SOUND_FACILITY_LABELS: Record<string, string> = {
  latest_karaoke: '최신형 노래방 기기',
  high_speaker: '고성능 스피커',
  laser_light: '레이저 조명',
  mirror_ball: '미러볼',
  dj_booth: 'DJ 부스 (파티 모드)',
  surround_sound: '서라운드 사운드',
  wireless_mic: '무선 마이크 (자유로운 이동)',
  mv_screen: '대형 MV/영상 스크린',
  stage_light: '무대 조명·스포트라이트',
  bass_boost: '베이스 강화 음향',
}

export const CLEAN_LABELS: Record<string, string> = {
  daily_sterilize: '매일 소독·살균',
  air_purifier_24: '공기청정기 24시간 가동',
  no_smell: '담배 냄새 없는 청결한 룸',
  uv_sanitizer: 'UV 살균기 적용',
  one_time_sheet: '1회용 시트·커버 교체',
  premium_clean: '프리미엄 청소 서비스',
  bathroom_spotless: '화장실 최상급 청결',
  fragrance_free: '무취·향균 관리',
}

export const MANAGER_STYLE_LABELS: Record<string, string> = {
  young_20s: '20대 초반 위주 (젊은 에너지)',
  model_grade: '모델/연예인 지망생 급 (비주얼 강조)',
  friendly: '싹싹하고 친절한 마인드 (내상 제로)',
  party_type: '텐션 높은 파티형 (분위기 메이커)',
  innocent_intel: '청순/지적인 이미지',
  mid_20s_trendy: '20대 중후반 트렌디 (세련된 스타일)',
  mature_elegant: '30대 이상 성숙·엘레강트',
  conversation_pro: '대화·케어 전문 (편안한 대화)',
  visual_plus_mind: '비주얼+마인드 겸비',
  variety_lineup: '다양한 연령·스타일 라인업',
}

export const MATCHING_LABELS: Record<string, string> = {
  unlimited_choice: '무한 초이스 시스템 (마음에 들 때까지)',
  manager_match: '실장 추천 맞춤 매칭 (실패 없는 선택)',
  no_rotation: '로테이션 없는 고정 시스템',
  first_30: '첫 타임 출근 인원 30명 이상',
  first_50: '첫 타임 출근 인원 50명 이상',
  preview_room: '미리보기 룸 (매칭 전 확인)',
  three_pick: '3픽 이상 선택 가능',
  no_penalty_change: '교체 시 페널티 없음',
  night_owl: '심야 타임 라인업 풍부',
  weekday_special: '평일 전용 초이스 이벤트',
}

export const FREE_SERVICE_LABELS: Record<string, string> = {
  fruit_refill: '고급 과일 안주 무한 리필',
  soju_beer: '소주/맥주 무제한 제공 이벤트',
  ramen_meal: '라면/짜파게티 등 식사 대용 서비스',
  whiskey_upgrade: '고급 양주 승급 이벤트 (저녁 9시 이전)',
  premium_fruit: '프리미엄 과일 플래터',
  champagne_welcome: '입장 시 샴페인 웰컴',
  snack_bar: '스낵바 무한 제공',
  soft_drink_free: '음료·이온음료 무제한',
  ice_cream: '아이스크림·디저트 서비스',
  late_night_meal: '심야 식사 서비스 (라면 등)',
}

export const CONVENIENCE_LABELS: Record<string, string> = {
  valet: '발렛 파킹 무료 서비스',
  pickup: '인근 지역 픽업/샌딩 가능',
  hangover: '숙취해소제(컨디션 등) 증정',
  charging: '휴대폰 초고속 충전 서비스',
  umbrella: '우산 대여/보관',
  coat_check: '외투·가방 보관 서비스',
  call_taxi: '택시 호출 대행',
  near_subway: '역세권 도보 접근',
  parking_guide: '주차 안내·예약 지원',
  late_night_parking: '심야 주차 무료',
}

export const DISCOUNT_LABELS: Record<string, string> = {
  first_visit: '첫 방문 고객 특별 할인',
  cash_extra: '현금 결제 시 추가 서비스 룸 제공',
  birthday: '생일/기념일 축하 샴페인 증정',
  weekday_discount: '평일 특별 할인',
  early_bird: '얼리버드 할인 (오픈~저녁)',
  repeat_guest: '재방문 고객 할인',
  group_discount: '단체 할인 (5명 이상)',
  card_discount: '제휴 카드 할인',
  event_coupon: '이벤트 쿠폰·할인',
  membership_benefit: '멤버십 전용 혜택',
}

export const PHILOSOPHY_LABELS: Record<string, string> = {
  fixed_price: '정찰제 운영 (추가금 일체 없음)',
  real_liquor: '정품 양주/새 술 확인 시스템',
  as_100: '내상 발생 시 100% AS 보장',
  privacy: '프라이버시 철저 보장 (비밀 유지)',
  no_hidden_fee: '숨은 비용 없음 (투명 가격)',
  customer_first: '고객 우선 운영 철학',
  quality_over_quantity: '양보다 질 (품질 중시)',
  long_term_trust: '장기 신뢰 관계 중시',
  safe_environment: '안전한 업소 환경',
  reputation_focus: '평판·리뷰 관리 철저',
}

export const MANAGER_CAREER_LABELS: Record<string, string> = {
  veteran: 'OO지역 10년차 베테랑 실장',
  veteran_20: 'OO지역 20년차 베테랑 실장',
  youtube_famous: '유튜브/커뮤니티 유명 실장 직접 케어',
  outgoing: '외성적인 성격의 화끈한 케어 가능',
  multi_venue: '다수 업소 운영 경험 실장',
  hotel_background: '호텔/접대업 출신 실장',
  female_manager: '여성 실장 직원 케어',
  certified_pro: '자격·인증 보유 전문 실장',
  network_wide: '광범위 인맥·네트워크 보유',
  young_energy: '젊은 에너지 실장 (MZ세대)',
}

/** id 배열을 label 배열로 변환 (없으면 id 그대로) */
export function idsToLabels(ids: string[] | undefined, labelMap: Record<string, string>): string {
  if (!Array.isArray(ids) || ids.length === 0) return ''
  return ids.map((id) => labelMap[id] ?? id).join(', ')
}
