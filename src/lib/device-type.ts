export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

/** UA + 터치 포인트 기반 디바이스 분류 (클라이언트·서버 공용) */
export function detectDeviceType(userAgent: string, maxTouchPoints = 0): DeviceType {
  const ua = userAgent || '';
  const lower = ua.toLowerCase();

  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini|webos/i.test(lower)) {
    return 'mobile';
  }
  if (maxTouchPoints > 1 && /macintosh|mac os x/i.test(ua)) {
    return 'tablet';
  }
  if (lower.includes('mozilla') || lower.includes('windows') || lower.includes('linux') || lower.includes('mac')) {
    return 'desktop';
  }
  return ua ? 'unknown' : 'unknown';
}

export function deviceTypeLabel(type: string): string {
  switch (type) {
    case 'desktop':
      return '💻 PC';
    case 'mobile':
      return '📱 모바일';
    case 'tablet':
      return '📲 태블릿';
    default:
      return '❓ 기타';
  }
}
