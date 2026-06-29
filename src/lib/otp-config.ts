/**
 * Google OTP 강제 여부.
 * ADMIN_OTP_ENABLED=false 로 설정 시 OTP 단계를 건너뜁니다 (구현은 유지, 재활성화 가능).
 */
export function isOtpEnforced(): boolean {
  const raw = (process.env.ADMIN_OTP_ENABLED ?? 'true').trim().toLowerCase()
  return !['false', '0', 'no', 'off'].includes(raw)
}
