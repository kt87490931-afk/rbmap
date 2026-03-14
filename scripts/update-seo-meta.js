/**
 * SEO 메타태그 DB 업데이트 스크립트
 * node scripts/update-seo-meta.js (로컬 .env.local 로드 필요)
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요');
  process.exit(1);
}

const supabase = createClient(url, key);
const seoContent = {
  title: '룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보',
  description: '강남, 수원 인계동, 동탄, 제주 등 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보. 지역별 업소 평점, 가격, 리뷰를 한눈에 비교하세요.',
  ogImage: 'https://rbbmap.com/og-image.png',
  siteUrl: 'https://rbbmap.com',
  googleVerify: '-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY',
};

async function main() {
  const { error } = await supabase.from('site_sections').upsert(
    { section_key: 'seo', content: seoContent, updated_at: new Date().toISOString() },
    { onConflict: 'section_key' }
  );
  if (error) {
    console.error('업데이트 실패:', error.message);
    process.exit(1);
  }
  console.log('SEO 메타태그 DB 업데이트 완료');
}
main();
