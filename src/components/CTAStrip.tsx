import Link from "next/link";

export default function CTAStrip() {
  return (
    <div className="cta-strip">
      <h2>내 업소를 룸빵여지도에 등록하세요</h2>
      <p>전국 유흥 정보를 찾는 방문자에게 직접 노출됩니다</p>
      <Link href="/contact" className="btn-primary">광고 및 등록 문의하기</Link>
    </div>
  );
}
