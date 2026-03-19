-- 잘못된 venue_slug(jsroom 등) 보정 예시
-- partners.href의 세 번째 세그먼트와 review_posts.venue_slug를 일치시키세요.
-- 실제 slug는 partners 테이블 href를 확인한 뒤 수정하세요.

-- 예: href가 /jamsil/room-salon/잠실룸싸롱잠실노래방-mmy0km6f 인 경우
/*
UPDATE review_posts
SET venue_slug = '잠실룸싸롱잠실노래방-mmy0km6f',
    venue_page_url = '/jamsil/room-salon/잠실룸싸롱잠실노래방-mmy0km6f',
    updated_at = now()
WHERE region = 'jamsil'
  AND type = 'room-salon'
  AND venue_slug = 'jsroom';

UPDATE partners
SET href = '/jamsil/room-salon/잠실룸싸롱잠실노래방-mmy0km6f'
WHERE href LIKE '/jamsil/room-salon/jsroom%';
*/
