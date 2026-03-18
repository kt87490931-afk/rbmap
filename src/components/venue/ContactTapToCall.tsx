"use client";

/** 카드 등 다른 링크 안에 있을 때, 터치/클릭 시 통화 연결만 하고 부모 링크 이동은 막음 */
export function ContactTapToCall({
  contact,
  className,
}: {
  contact: string;
  className?: string;
}) {
  const digits = (contact ?? "").replace(/\D/g, "");
  const isPhone = digits.length >= 10;

  if (!isPhone) {
    return <div className={className}>{contact}</div>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `tel:${digits}`;
  };

  return (
    <span
      role="link"
      tabIndex={0}
      className={className}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = `tel:${digits}`;
        }
      }}
      style={{ cursor: "pointer" }}
    >
      {contact}
    </span>
  );
}
