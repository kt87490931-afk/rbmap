const TICKER_ITEMS = [
  "강남 가라오케",
  "수원 인계동 하이퍼블릭",
  "동탄 셔츠룸",
  "제주 룸싸롱",
  "강남 달토 신규 리뷰",
  "수원 아우라 후기 업데이트",
  "동탄 신규 업소 등록",
  "인천 서비스 오픈 예정",
];

export default function Ticker() {
  const duplicated = [...TICKER_ITEMS, ...TICKER_ITEMS];

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
