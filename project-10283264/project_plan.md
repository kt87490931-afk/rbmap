# 룸빵여지도 (RBB Map) 리디자인

## 1. Project Description

룸빵여지도는 전국 룸빵주가(룸살롱, 노래방, 유흥주점 등)를 위한 업소 정보 및 리뷰 플랫폼입니다. 제미나이 AI를 활용하여 제휴업소의 리뷰를 자동으로 생성하는 시스템을 갖추고 있습니다. 기존 어두운 테마에서 밝고 산뜻한 인스타그램 감성(흰색+핑크/퍼플)으로 전환하여 사용자 경험과 브랜드 이미지를 개선합니다.

## 2. Page Structure

- `/` - Home (메인 페이지)
  - Hero 섹션 (검색 + 통계)
  - 지역별 필터
  - 실시간 최신 업데이트 (리뷰/업소 목록)
  - 지역별 주요 업소 (카드 그리드)
  - 6시간마다 업데이트 인기 리뷰
  - 자주 묻는 질문 (FAQ)
  - Footer

## 3. Core Features

- [ ] 홈페이지 메인 디자인 (흰색+핑크/퍼플 테마)
- [ ] 리뷰 목록 대량 노출 (SEO 최적화)
- [ ] 지역별 필터 및 탐색
- [ ] 실시간 업데이트 리스트
- [ ] 인기 리뷰 섹션
- [ ] FAQ 섹션
- [ ] 검색 기능

## 4. Data Model Design

현재 단계에서는 목업 데이터 사용. 추후 Supabase 연결 시:

### Table: stores
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | text | 업소명 |
| region | text | 지역 (서울, 경기 등) |
| category | text | 업종 (룸살롱, 노래방 등) |
| address | text | 주소 |
| rating | float | 평점 |
| review_count | int | 리뷰 수 |
| created_at | timestamptz | 생성일 |

### Table: reviews
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| store_id | uuid | 업소 FK |
| title | text | 리뷰 제목 |
| content | text | 리뷰 내용 |
| rating | float | 평점 |
| created_at | timestamptz | 생성일 |

## 5. Backend / Third-party Integration Plan

- Supabase: 필요 (추후 데이터 저장 및 API 연결)
- Shopify: 불필요
- Stripe: 불필요
- 기타: 제미나이 API (리뷰 자동 생성 - 현재 별도 서비스)

## 6. Development Phase Plan

### Phase 1: 홈페이지 리디자인
- Goal: 흰색+핑크/퍼플 인스타그램 감성으로 메인 페이지 전면 리디자인
- Deliverable: 완성된 홈페이지 컴포넌트 + 목업 데이터

### Phase 2: 데이터 연결
- Goal: Supabase 연결 및 실제 데이터 연동
- Deliverable: 실시간 데이터 fetching, 검색 기능

### Phase 3: 추가 기능
- Goal: 상세 페이지, 필터링, 검색 최적화
- Deliverable: 업소 상세 페이지, 고급 필터