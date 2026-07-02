import { getSiteSection } from './site'

export type LoungeMenuRow = { name: string; desc: string; price: string }
export type LoungeMenuGroup = { title: string; rows: LoungeMenuRow[] }
export type LoungeAboutItem = { title: string; desc: string }
export type LoungeInfoItem = { key: string; value: string }

export type LoungeHomeContent = {
  hero: {
    badge1: string
    badge2: string
    badge3: string
    h1: string
    sub: string
    image: string
  }
  quickbar: {
    label1: string
    label2: string
    label3: string
    label4: string
    value3: string
    value4: string
  }
  about: {
    eyebrow: string
    title: string
    p1: string
    p2: string
    image: string
    items: LoungeAboutItem[]
  }
  gallery: {
    title: string
    note: string
    images: string[]
  }
  menu: {
    title: string
    note: string
    menuNote: string
    groups: LoungeMenuGroup[]
  }
  reviews: {
    title: string
    note: string
  }
  location: {
    title: string
    mapImage: string
    items: LoungeInfoItem[]
  }
  cta: {
    eyebrow: string
    title: string
    desc: string
    primaryBtn: string
    ghostBtn: string
  }
  contact: {
    title: string
    items: LoungeInfoItem[]
    formBtn: string
  }
  footer: {
    desc: string
    copyright: string
    bizNo: string
  }
}

export const LOUNGE_HOME_DEFAULTS: LoungeHomeContent = {
  hero: {
    badge1: '프라이빗 라운지',
    badge2: '이용 후기',
    badge3: '정보 안내',
    h1: '조용한 밤, <em>완전한 프라이버시.</em>',
    sub: '룸 안내와 이용 정보, 실제 방문 후기를 한곳에서 확인하세요.',
    image: '',
  },
  quickbar: {
    label1: '후기',
    label2: '평점',
    label3: '업데이트',
    label4: '문의',
    value3: '정기 갱신',
    value4: '하단 문의란',
  },
  about: {
    eyebrow: 'About',
    title: '격식 있는 자리를 위한 프라이빗 라운지',
    p1: '비즈니스 미팅부터 소규모 모임까지, 목적에 맞는 룸과 서비스를 소개합니다.',
    p2: '실제 방문 후기를 바탕으로 이용 정보를 제공합니다.',
    image: '',
    items: [
      { title: '프라이빗 룸', desc: '인원과 목적에 맞는 다양한 룸 타입.' },
      { title: '이용 후기', desc: '실제 방문 경험을 바탕으로 한 상세 후기.' },
      { title: '이용 안내', desc: '요금·위치·문의 정보를 한곳에서 확인.' },
    ],
  },
  gallery: {
    title: '공간 둘러보기',
    note: '이미지는 추후 업로드됩니다.',
    images: ['', '', '', ''],
  },
  menu: {
    title: '이용 요금 안내',
    note: '아래 요금은 예시이며, 추후 수정할 수 있습니다.',
    menuNote: '',
    groups: [
      {
        title: '룸 이용 코스',
        rows: [
          { name: '스탠다드 코스', desc: '기본 이용 · 2~4인', price: '문의' },
          { name: '프리미엄 코스', desc: '프라이빗 룸 · 4~6인', price: '문의' },
        ],
      },
      {
        title: '추가 옵션',
        rows: [
          { name: '음료 추가', desc: '브랜드 상담 가능', price: '문의' },
          { name: '안주', desc: '제철 구성', price: '문의' },
        ],
      },
    ],
  },
  reviews: {
    title: '이용 후기',
    note: '최신 후기를 확인하고 전체 목록에서 더 볼 수 있습니다.',
  },
  location: {
    title: '오시는 길',
    mapImage: '',
    items: [
      { key: '주소', value: '추후 입력' },
      { key: '교통', value: '추후 입력' },
      { key: '주차', value: '추후 입력' },
      { key: '영업', value: '추후 입력' },
    ],
  },
  cta: {
    eyebrow: 'Reviews',
    title: '실제 방문 후기를 확인하세요',
    desc: '이용 전 참고할 수 있는 상세 후기를 모았습니다.',
    primaryBtn: '전체 후기 보기',
    ghostBtn: '문의하기',
  },
  contact: {
    title: '문의',
    items: [{ key: '안내', value: '문의 내용은 추후 입력합니다.' }],
    formBtn: '문의 보내기 (준비 중)',
  },
  footer: {
    desc: '프라이빗 라운지 이용 후기와 정보를 제공합니다.',
    copyright: '© 룸빵여지도. All rights reserved.',
    bizNo: '',
  },
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function deepMergeLoungeHome<T>(base: T, patch: Partial<T> | null | undefined): T {
  if (!patch) return structuredClone(base)
  const patchObj = patch as Record<string, unknown>
  if (Array.isArray(base) && Array.isArray(patch)) {
    return (patch.length > 0 ? patch : base) as T
  }
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch as T) ?? base
  }
  const out = { ...base } as Record<string, unknown>
  for (const key of Object.keys(patchObj)) {
    const bv = (base as Record<string, unknown>)[key]
    const pv = patchObj[key]
    if (pv === undefined) continue
    if (Array.isArray(pv)) {
      out[key] = pv.length > 0 ? pv : bv
    } else if (isPlainObject(bv) && isPlainObject(pv)) {
      out[key] = deepMergeLoungeHome(bv, pv)
    } else {
      out[key] = pv
    }
  }
  return out as T
}

export async function getLoungeHomeContent(): Promise<LoungeHomeContent> {
  const db = await getSiteSection<Partial<LoungeHomeContent>>('lounge_home')
  return deepMergeLoungeHome(LOUNGE_HOME_DEFAULTS, db)
}

/** dot 경로로 값 설정 (예: hero.badge1, gallery.images.0) */
export function setLoungeHomePath(
  content: LoungeHomeContent,
  path: string,
  value: string
): LoungeHomeContent {
  const keys = path.split('.')
  const next = structuredClone(content)
  let cur: unknown = next
  for (let i = 0; i < keys.length - 1; i++) {
    const idx = Number(keys[i])
    cur = !Number.isNaN(idx) ? (cur as unknown[])[idx] : (cur as Record<string, unknown>)[keys[i]]
  }
  const last = keys[keys.length - 1]
  const lastIdx = Number(last)
  if (!Number.isNaN(lastIdx)) {
    (cur as unknown[])[lastIdx] = value
  } else {
    (cur as Record<string, unknown>)[last] = value
  }
  return next
}

/** dot 경로로 값 읽기 */
export function getLoungeHomePath(content: LoungeHomeContent, path: string): string {
  const keys = path.split('.')
  let cur: unknown = content
  for (const k of keys) {
    if (cur == null) return ''
    const idx = Number(k)
    cur = !Number.isNaN(idx) ? (cur as unknown[])[idx] : (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'string' ? cur : ''
}

export function loungeImageSrc(path: string): string | undefined {
  const p = path.trim()
  if (!p) return undefined
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p
  return `/${p.replace(/^\/+/, '')}`
}
