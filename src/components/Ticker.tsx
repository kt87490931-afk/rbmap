const DEFAULT_ITEMS = [
  { region: "강남", text: "달토 가라오케 3월 라인업 업데이트" },
  { region: "수원", text: "아우라 하이퍼블릭 새 리뷰 등록" },
  { region: "동탄", text: "최저가 룸싸롱 신규 업소 추가" },
  { region: "제주", text: "가라오케 현지인 추천 TOP5 업데이트" },
  { region: "강남", text: "가라오케 가격 비교 2025 업데이트" },
  { region: "수원", text: "셔츠룸 완전 가이드 게재" },
];

interface TickerItem {
  region?: string;
  text?: string;
}
interface TickerData {
  items?: TickerItem[];
}
interface TickerProps {
  data?: TickerData | null;
  items?: TickerItem[];
}

export default function Ticker({ data, items: propItems }: TickerProps) {
  const items = propItems ?? data?.items ?? DEFAULT_ITEMS;
  const list = items.length > 0 ? items : DEFAULT_ITEMS;
  const duplicated = [...list, ...list];

  return (
    <div className="ticker" aria-label="실시간 업데이트 피드" role="marquee">
      <div className="ticker-inner">
        {duplicated.flatMap((item, i) => [
          <span key={`${i}-item`} className="ticker-item">
            <span>{item.region ?? ""}</span> {item.text ?? ""}
          </span>,
          <span key={`${i}-dot`} className="ticker-dot" />,
        ])}
      </div>
    </div>
  );
}
