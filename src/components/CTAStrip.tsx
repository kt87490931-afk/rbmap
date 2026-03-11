import Link from "next/link";

interface CTAData {
  title?: string;
  desc?: string;
  btn_text?: string;
  btn_href?: string;
}

const DEFAULT: CTAData = {
  title: "내 업소를 룸빵여지도에 등록하세요",
  desc: "전국 유흥 정보를 찾는 방문자에게 직접 노출됩니다",
  btn_text: "광고 및 등록 문의하기",
  btn_href: "/contact",
};

export default function CTAStrip({ data }: { data?: CTAData | null }) {
  const d = { ...DEFAULT, ...data };
  return (
    <div className="cta-strip">
      <h2>{d.title}</h2>
      <p>{d.desc}</p>
      <Link href={d.btn_href ?? "/contact"} className="btn-primary">{d.btn_text}</Link>
    </div>
  );
}
