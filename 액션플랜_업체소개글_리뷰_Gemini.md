# 룸빵여지도 — 업체소개글·리뷰·Gemini API 액션플랜

> 작성일: 2025-03-11 | 운영자 전용 어드민, 전문가/파트너 톤 소개글, 7개 손님 톤 리뷰

---

## Phase 0: 사전 정리

| 항목 | 내용 |
|------|------|
| 작성 주체 | **운영자** (어드민에서 모든 입력) |
| 업체소개글 톤 | 전문가 톤(pro), 듬직한 파트너 톤(partner_pro) — 2종 |
| 업체리뷰 톤 | 손님 관점 7종 (룸빵리뷰톤.txt) |
| 기간·연락처 | 30일 단위 선택, 만료 시 리뷰 유지·연락처 비공개 |
| 컬러 변동 | 없음 (텍스트만 톤별 적용) |

---

## Phase 1: DB 스키마 설계 및 확장 (1일)

| # | 액션 | 상세 | 완료 |
|---|------|------|:----:|
| 1-1 | `partners` 테이블 확장 | 업체소개글용 필드: `intro_form_json`(JSONB, 양식 원본), `intro_ai_json`(JSONB, AI 생성 결과), `ai_tone`(pro/partner_pro) | ☐ |
| 1-2 | `partners` 기간·연락처 필드 | `period_end`(DATE), `contact_visible`(BOOLEAN) | ☐ |
| 1-3 | `venue_reviews` 테이블 (신규) | 업체별 AI 리뷰 저장: `venue_id`, `tone`(7종), `content`(TEXT), `char_count`, `created_at` | ☐ |
| 1-4 | 기존 `reviews`·`review_posts` 활용 방안 | 메인/상세 노출 구조와 venue_reviews 매핑 정리 | ☐ |
| 1-5 | 마이그레이션 SQL 작성 | `supabase-venue-intro-reviews.sql` 생성 | ☐ |

**검증**: Supabase Table Editor에서 스키마 확인

---

## Phase 2: 어드민 — 업체소개글 작성폼 (2일)

| # | 액션 | 상세 | 완료 |
|---|------|------|:----:|
| 2-1 | 신규 페이지 `/admin/venues/intro` | 업체 선택(드롭다운) + 양식 작성 UI | ☐ |
| 2-2 | 양식 필드 정의 | 이브알바 참고: 업소명, 지역, 업종, 연락처, 주소, 시설, 혜택, 자격, 추가설명 등 | ☐ |
| 2-3 | AI 종합정리 패널 | 실시간 미리보기(입력값 반영), "제출 전 확인" 문구 | ☐ |
| 2-4 | 소개글 톤 선택 | 전문가 톤 / 듬직한 파트너 톤 라디오 버튼 | ☐ |
| 2-5 | 30일 기간 선택 | 시작일·종료일 또는 기간(30일) 선택 UI | ☐ |
| 2-6 | 폼 저장 API | `/api/admin/venues/intro` POST — `intro_form_json` 저장 | ☐ |

**검증**: 어드민에서 양식 작성 후 DB에 JSON 저장 확인

---

## Phase 3: Gemini API 연동 (1.5일)

| # | 액션 | 상세 | 완료 |
|---|------|------|:----:|
| 3-1 | `@google/generative-ai` 설치 | `npm install @google/generative-ai` | ☐ |
| 3-2 | 환경변수 | `GEMINI_API_KEY` 추가 (.env.local, .env.production) | ☐ |
| 3-3 | `src/lib/gemini/` 생성 | `config.ts`(톤 정의), `api.ts`(호출 래퍼) | ☐ |
| 3-4 | 업체소개글 프롬프트 | 이브알바 `$gemini_section_instruction` 참고, pro/partner_pro 톤 | ☐ |
| 3-5 | 리뷰 프롬프트 | 룸빵리뷰톤.txt 7종 연동 | ☐ |
| 3-6 | API Route `/api/admin/gemini/intro` | 양식 JSON → Gemini 호출 → `intro_ai_json` 반환 | ☐ |
| 3-7 | API Route `/api/admin/gemini/review` | 업체소개 + 톤 → 리뷰 텍스트 생성 | ☐ |

**검증**: API Route 직접 호출 후 응답 확인

---

## Phase 4: 업체소개글 생성 및 저장 (1일)

| # | 액션 | 상세 | 완료 |
|---|------|------|:----:|
| 4-1 | "AI 소개글 생성" 버튼 | 업체소개글 작성폼 하단에 배치 | ☐ |
| 4-2 | 생성 플로우 | 종합정리 JSON → API 호출 → 응답 파싱 → `intro_ai_json` 저장 | ☐ |
| 4-3 | 섹션 매핑 | intro, card1~4, location, env, welfare, qualify, extra 등 키 구조 정의 | ☐ |
| 4-4 | 업체 상세 페이지 반영 | `intro_ai_json` 기반으로 각 섹션 렌더링 | ☐ |

**검증**: 어드민에서 생성 후 업체 상세 페이지에 소개글 표시 확인

---

## Phase 5: 업체리뷰 생성 및 관리 (1.5일)

| # | 액션 | 상세 | 완료 |
|---|------|------|:----:|
| 5-1 | 리뷰 톤 7종 정의 | `src/lib/gemini/review-tones.ts` — 룸빵리뷰톤.txt 반영 | ☐ |
| 5-2 | 어드민 리뷰 생성 UI | 업체 선택 + 톤 선택 + "리뷰 생성" 버튼 | ☐ |
| 5-3 | 일괄 생성 옵션 | 한 업체당 7톤 전부 생성 또는 톤별 선택 생성 | ☐ |
| 5-4 | 6시간 배치 (선택) | Supabase Edge Function 또는 Next.js API + cron | ☐ |
| 5-5 | 리뷰 관리 목록 | 생성된 리뷰 목록, 톤·글자수·생성일 표시 | ☐ |
| 5-6 | 리뷰 노출 연동 | 메인/업체 상세에 `venue_reviews` 연동 | ☐ |

**검증**: 7개 톤으로 리뷰 생성 후 화면 노출 확인

---

## Phase 6: 30일 기간·연락처 비공개 (0.5일)

| # | 액션 | 상세 | 완료 |
|---|------|------|:----:|
| 6-1 | 기간 설정 UI | 어드민 업체 편집 시 `period_end` 설정 | ☐ |
| 6-2 | 만료 판단 로직 | `period_end < today` → `contact_visible = false` | ☐ |
| 6-3 | 연락처 노출 분기 | `contact_visible`이 false면 연락처 영역 숨김 또는 "만료됨" 표시 | ☐ |
| 6-4 | 리뷰 유지 | 기간 만료 후에도 리뷰는 그대로 노출 | ☐ |

**검증**: period_end 과거로 설정 후 연락처 비공개·리뷰 유지 확인

---

## Phase 7: 정리 및 QA (0.5일)

| # | 액션 | 상세 | 완료 |
|---|------|------|:----:|
| 7-1 | 에러 처리 | API 실패, 키 누락, 타임아웃 처리 | ☐ |
| 7-2 | 로딩·피드백 UI | 생성 중 스피너, 완료/실패 메시지 | ☐ |
| 7-3 | 문서화 | .env.production.example에 GEMINI_API_KEY 설명 추가 | ☐ |

---

## 파일 구조 (예상)

```
src/
├── app/admin/
│   ├── venues/
│   │   └── intro/
│   │       └── page.tsx          # 업체소개글 작성폼
│   └── reviews/
│       ├── page.tsx              # 리뷰 관리 (기존)
│       ├── write/page.tsx        # 리뷰 작성 (기존)
│       └── generate/page.tsx     # (신규) AI 리뷰 일괄 생성
├── app/api/admin/
│   └── gemini/
│       ├── intro/route.ts        # 소개글 생성
│       └── review/route.ts       # 리뷰 생성
└── lib/gemini/
    ├── config.ts                 # 모델, 톤 공통 설정
    ├── intro-tones.ts            # pro, partner_pro
    ├── review-tones.ts           # 7종 손님 톤
    └── api.ts                    # generateContent 래퍼
```

---

## 동일 실수 시 해결책

| 문제 | 원인 | 해결책 |
|------|------|--------|
| Gemini 403/401 | API 키 미설정/만료 | .env 확인, aistudio.google.com에서 키 재발급 |
| JSON 파싱 실패 | Gemini가 마크다운/설명 포함 응답 | 프롬프트에 "JSON만 반환" 명시, ```json 블록 제거 후 파싱 |
| 톤 적용 안 됨 | role_id 미전달 | API 호출 시 tone 파라미터 검증 |
| 30일 후 연락처 계속 표시 | period_end 비교 로직 오류 | 서버/클라이언트 일관된 시간대 사용, RLS 또는 API 필터링 |
| 리뷰 미노출 | venue_id 매핑 오류 | reviews/venue_reviews 조인 확인 |

---

## 예상 일정 요약

| Phase | 예상 소요 | 누적 |
|-------|----------|------|
| Phase 1 | 1일 | 1일 |
| Phase 2 | 2일 | 3일 |
| Phase 3 | 1.5일 | 4.5일 |
| Phase 4 | 1일 | 5.5일 |
| Phase 5 | 1.5일 | 7일 |
| Phase 6 | 0.5일 | 7.5일 |
| Phase 7 | 0.5일 | 8일 |

**총 예상: 약 8일** (1인 풀타임 기준)

---

## 다음 첫 액션

1. Phase 1-1~1-5: DB 스키마 확장 SQL 작성 및 Supabase 실행  
2. Phase 3-1~3-2: Gemini 패키지 설치 및 환경변수 설정  
3. Phase 2-1: `/admin/venues/intro` 페이지 골격 생성  
