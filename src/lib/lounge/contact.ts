/** 연락처 문자열을 tel: 링크 또는 외부 링크(카카오/텔레그램 등)로 변환. 변환 불가 시 null. */
export function buildContactHref(raw: string): string | null {
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  const digits = raw.replace(/[^0-9+]/g, '')
  if (digits.replace(/\D/g, '').length >= 7) return `tel:${digits}`
  return null
}
