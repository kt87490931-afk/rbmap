const DEFAULT_ITEMS = [
  "강남 가라오케",
  "수원 인계동 하이퍼블릭",
  "동탄 셔츠룸",
  "제주 룸싸롱",
];

interface TickerData {
  items?: { text?: string }[];
}

export default function Ticker({ data }: { data?: TickerData | null }) {
  const items = data?.items?.map((i) => i.text ?? "")?.filter(Boolean) ?? DEFAULT_ITEMS;
  const duplicated = [...items, ...items];

  return (
    <div className="ticker-bar" aria-hidden="true">
      <div className="ticker-inner">
        {duplicated.map((item, i) => (
          <span key={i} className="ticker-item">
            {item} <span className="ticker-dot">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
