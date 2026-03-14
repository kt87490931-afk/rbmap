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
  description: '내 주변 합법 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 전국 380개 이상의 검증된 업소와 3,200건이 넘는 실제 이용 후기가 당신의 선택을 돕습니다. 6시간마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.',
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

  const { data: footerRow } = await supabase.from('site_sections').select('content').eq('section_key', 'footer').maybeSingle();
  const footerContent = { ...(footerRow?.content || {}), desc: '내 주변 합법 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 전국 380개 이상의 검증된 업소와 3,200건이 넘는 실제 이용 후기가 당신의 선택을 돕습니다. 6시간마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.' };
  const { error: footerError } = await supabase.from('site_sections').upsert(
    { section_key: 'footer', content: footerContent, updated_at: new Date().toISOString() },
    { onConflict: 'section_key' }
  );
  if (footerError) console.warn('Footer 업데이트 실패:', footerError.message);
  else console.log('Footer DB 업데이트 완료');
}
main();
