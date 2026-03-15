'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border, #333)',
  background: 'var(--card, #222)',
  color: 'inherit',
  fontSize: 14,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'var(--muted, #888)',
}

const blockStyle: React.CSSProperties = {
  marginBottom: 16,
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={blockStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

function FormTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div style={blockStyle}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
    </div>
  )
}

function FormNumber({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <div style={blockStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        min={min ?? 0}
        style={inputStyle}
      />
    </div>
  )
}

function ArrayBlock<T extends Record<string, unknown>>({
  label,
  items,
  onChange,
  renderItem,
  getDefault,
}: {
  label: string
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, i: number, onChange: (item: T) => void) => React.ReactNode
  getDefault: () => T
}) {
  const add = () => onChange([...items, getDefault()])
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i: number, v: T) => onChange(items.map((item, idx) => (idx === i ? v : item)))
  return (
    <div style={blockStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={labelStyle}>{label}</label>
        <button type="button" onClick={add} className="btn-save" style={{ padding: '6px 12px', fontSize: 12 }}>
          + 추가
        </button>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: 12,
            marginBottom: 8,
            background: 'var(--card, #222)',
            borderRadius: 8,
            border: '1px solid var(--border, #333)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button type="button" onClick={() => remove(i)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', fontSize: 12 }}>
              삭제
            </button>
          </div>
          {renderItem(item, i, (v) => update(i, v))}
        </div>
      ))}
    </div>
  )
}

// --- Hero Form ---
function HeroForm({
  data,
  onChange,
}: {
  data: Record<string, unknown>
  onChange: (d: Record<string, unknown>) => void
}) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  const kpis = (d.kpis as { num?: string; label?: string }[]) ?? []
  const btns = (d.btns as { text?: string; href?: string }[]) ?? []
  return (
    <>
      <FormInput label="상단 라벨 (eyebrow)" value={String(d.eyebrow ?? '')} onChange={(v) => set('eyebrow', v)} />
      <FormInput label="메인 타이틀 1줄" value={String(d.h1_line1 ?? '')} onChange={(v) => set('h1_line1', v)} />
      <FormInput label="메인 타이틀 2줄" value={String(d.h1_line2 ?? '')} onChange={(v) => set('h1_line2', v)} />
      <FormTextarea label="설명 1줄" value={String(d.desc_1 ?? '')} onChange={(v) => set('desc_1', v)} rows={2} />
      <FormTextarea label="설명 2줄" value={String(d.desc_2 ?? '')} onChange={(v) => set('desc_2', v)} rows={2} />
      <ArrayBlock
        label="KPI 숫자 (4개 권장)"
        items={kpis}
        onChange={(arr) => set('kpis', arr)}
        getDefault={() => ({ num: '', label: '' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormInput label="숫자" value={item.num ?? ''} onChange={(v) => up({ ...item, num: v })} />
            <FormInput label="라벨" value={item.label ?? ''} onChange={(v) => up({ ...item, label: v })} />
          </div>
        )}
      />
      <ArrayBlock
        label="버튼"
        items={btns}
        onChange={(arr) => set('btns', arr)}
        getDefault={() => ({ text: '', href: '#' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormInput label="버튼 텍스트" value={item.text ?? ''} onChange={(v) => up({ ...item, text: v })} />
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
          </div>
        )}
      />
    </>
  )
}

// --- Ticker Form ---
function TickerForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const items = (data?.items as { text?: string }[]) ?? []
  return (
    <ArrayBlock
      label="티커 항목 (가로 스크롤)"
      items={items}
      onChange={(arr) => onChange({ ...data, items: arr })}
      getDefault={() => ({ text: '' })}
      renderItem={(item, _, up) => (
        <FormInput label="텍스트" value={item.text ?? ''} onChange={(v) => up({ ...item, text: v })} />
      )}
    />
  )
}

// --- Header Form ---
function HeaderForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  const nav = (d.nav as { label?: string; href?: string; cta?: boolean }[]) ?? []
  return (
    <>
      <FormInput label="로고 아이콘" value={String(d.logo_icon ?? '')} onChange={(v) => set('logo_icon', v)} />
      <FormInput label="로고 텍스트" value={String(d.logo_text ?? '')} onChange={(v) => set('logo_text', v)} />
      <FormInput label="로고 서브" value={String(d.logo_sub ?? '')} onChange={(v) => set('logo_sub', v)} />
      <ArrayBlock
        label="네비게이션 메뉴"
        items={nav}
        onChange={(arr) => set('nav', arr)}
        getDefault={() => ({ label: '', href: '/', cta: false })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <FormInput label="라벨" value={item.label ?? ''} onChange={(v) => up({ ...item, label: v })} />
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={!!item.cta} onChange={(e) => up({ ...item, cta: e.target.checked })} />
              CTA 강조
            </label>
          </div>
        )}
      />
    </>
  )
}

// --- About Form ---
function AboutForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  const cards = (d.cards as { icon?: string; title?: string; desc?: string }[]) ?? []
  return (
    <>
      <FormInput label="섹션 라벨" value={String(d.intro_label ?? '')} onChange={(v) => set('intro_label', v)} />
      <FormTextarea label="소개 텍스트 (HTML 가능)" value={String(d.intro_text ?? '')} onChange={(v) => set('intro_text', v)} rows={4} />
      <ArrayBlock
        label="소개 카드 (3개 권장)"
        items={cards}
        onChange={(arr) => set('cards', arr)}
        getDefault={() => ({ icon: '📌', title: '', desc: '' })}
        renderItem={(item, _, up) => (
          <>
            <FormInput label="아이콘(이모지)" value={item.icon ?? ''} onChange={(v) => up({ ...item, icon: v })} />
            <FormInput label="제목" value={item.title ?? ''} onChange={(v) => up({ ...item, title: v })} />
            <FormTextarea label="설명" value={item.desc ?? ''} onChange={(v) => up({ ...item, desc: v })} rows={2} />
          </>
        )}
      />
    </>
  )
}

// --- Stats Form ---
function StatsForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const items = (data?.items as { num?: string; label?: string }[]) ?? []
  return (
    <ArrayBlock
      label="통계 항목 (숫자 + 라벨)"
      items={items}
      onChange={(arr) => onChange({ ...data, items: arr })}
      getDefault={() => ({ num: '', label: '' })}
      renderItem={(item, _, up) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <FormInput label="숫자" value={item.num ?? ''} onChange={(v) => up({ ...item, num: v })} />
          <FormInput label="라벨" value={item.label ?? ''} onChange={(v) => up({ ...item, label: v })} />
        </div>
      )}
    />
  )
}

// --- CTA Form ---
function CTAForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  return (
    <>
      <FormInput label="제목" value={String(d.title ?? '')} onChange={(v) => set('title', v)} />
      <FormTextarea label="설명" value={String(d.desc ?? '')} onChange={(v) => set('desc', v)} rows={2} />
      <FormInput label="버튼 텍스트" value={String(d.btn_text ?? '')} onChange={(v) => set('btn_text', v)} />
      <FormInput label="버튼 링크" value={String(d.btn_href ?? '')} onChange={(v) => set('btn_href', v)} />
    </>
  )
}

// --- Footer Form ---
function FooterForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  const links = (d.links as { label?: string; href?: string }[]) ?? []
  return (
    <>
      <FormTextarea label="하단 설명" value={String(d.desc ?? '')} onChange={(v) => set('desc', v)} rows={2} />
      <FormInput label="저작권 문구" value={String(d.copyright ?? '')} onChange={(v) => set('copyright', v)} />
      <ArrayBlock
        label="하단 링크"
        items={links}
        onChange={(arr) => set('links', arr)}
        getDefault={() => ({ label: '', href: '/' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormInput label="라벨" value={item.label ?? ''} onChange={(v) => up({ ...item, label: v })} />
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
          </div>
        )}
      />
    </>
  )
}

// --- Config Forms (숫자만) ---
function PartnersConfigForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const v = (data?.display_limit as number) ?? 0
  return (
    <FormNumber
      label="노출 개수 (0=전체, N=상위 N개)"
      value={v}
      onChange={(n) => onChange({ ...data, display_limit: n })}
      min={0}
    />
  )
}

function FeedConfigForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const v = (data?.display_limit as number) ?? 10
  return (
    <FormNumber
      label="피드 노출 개수"
      value={v}
      onChange={(n) => onChange({ ...data, display_limit: n })}
      min={1}
    />
  )
}

const REVIEW_FEED_OPTIONS = [3, 6, 9, 12, 15] as const

function ReviewConfigForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const value = REVIEW_FEED_OPTIONS.includes((d.display_limit as number) as (typeof REVIEW_FEED_OPTIONS)[number])
    ? (d.display_limit as number)
    : 6
  return (
    <div style={blockStyle}>
      <label style={labelStyle}>피드 노출 개수</label>
      <select
        value={value}
        onChange={(e) => onChange({ ...d, display_limit: Number(e.target.value) })}
        style={inputStyle}
      >
        {REVIEW_FEED_OPTIONS.map((n) => (
          <option key={n} value={n}>{n}개</option>
        ))}
      </select>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>메인 페이지 인기 리뷰 섹션에 표시할 카드 개수 (3 / 6 / 9 / 12 / 15)</p>
    </div>
  )
}

// --- Region Guide Form ---
function RegionGuideForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  const tabs = (d.region_tabs as { id?: string; label?: string }[]) ?? []
  const panels = (d.region_panels as Record<string, { title?: string; cols?: { h4?: string; ps?: string[] }[] }>) ?? {}

  const setPanel = (tabId: string, panel: { title?: string; cols?: { h4?: string; ps?: string[] }[] }) => {
    const next = { ...panels, [tabId]: panel }
    set('region_panels', next)
  }

  return (
    <>
      <ArrayBlock
        label="지역 탭 (이름)"
        items={tabs}
        onChange={(arr) => set('region_tabs', arr)}
        getDefault={() => ({ id: 'tab-', label: '' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormInput label="탭 ID" value={item.id ?? ''} onChange={(v) => up({ ...item, id: v })} placeholder="tab-gangnam" />
            <FormInput label="탭 라벨" value={item.label ?? ''} onChange={(v) => up({ ...item, label: v })} placeholder="강남" />
          </div>
        )}
      />
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border, #333)' }}>
        <p style={{ ...labelStyle, marginBottom: 12, fontSize: 14 }}>지역별 본문 (강남 가라오케란? 등)</p>
        {tabs.map((t) => {
          const tabId = t.id ?? ''
          if (!tabId) return null
          const panel = panels[tabId] ?? { title: '', cols: [] }
          const cols = panel.cols ?? []
          return (
            <div
              key={tabId}
              style={{
                marginBottom: 20,
                padding: 16,
                background: 'var(--card, #222)',
                borderRadius: 8,
                border: '1px solid var(--border, #333)',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{t.label || tabId}</p>
              <FormInput
                label="패널 제목"
                value={panel.title ?? ''}
                onChange={(v) => setPanel(tabId, { ...panel, title: v })}
                placeholder="강남 _유흥 완전 가이드_ — 가라오케·하이퍼블릭·쩜오"
              />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, marginTop: 12 }}>소제목 + 문단 (예: 강남 가라오케란?, 강남 이용 시 주의사항)</p>
              <ArrayBlock
                label=""
                items={cols}
                onChange={(arr) => setPanel(tabId, { ...panel, cols: arr })}
                getDefault={() => ({ h4: '', ps: [''] })}
                renderItem={(col, _, upCol) => (
                  <>
                    <FormInput
                      label="소제목 (h4)"
                      value={col.h4 ?? ''}
                      onChange={(v) => upCol({ ...col, h4: v })}
                      placeholder="강남 가라오케란?"
                    />
                    <FormTextarea
                      label="문단 (한 줄 = 한 문단)"
                      value={(col.ps ?? []).join('\n')}
                      onChange={(v) => upCol({ ...col, ps: v.split('\n').map((s) => s.trim()).filter((s) => s) })}
                      rows={4}
                    />
                  </>
                )}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}

// --- Category Guide Form ---
function CategoryGuideForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const typeCards = (data?.type_cards as { icon?: string; title?: string; desc?: string; href?: string }[]) ?? []
  const kwLinks = (data?.kw_links as { href?: string; text?: string }[]) ?? []
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  return (
    <>
      <ArrayBlock
        label="업종 카드"
        items={typeCards}
        onChange={(arr) => set('type_cards', arr)}
        getDefault={() => ({ icon: '🎤', title: '', desc: '', href: '/category/' })}
        renderItem={(item, _, up) => (
          <>
            <FormInput label="아이콘" value={item.icon ?? ''} onChange={(v) => up({ ...item, icon: v })} />
            <FormInput label="제목" value={item.title ?? ''} onChange={(v) => up({ ...item, title: v })} />
            <FormTextarea label="설명" value={item.desc ?? ''} onChange={(v) => up({ ...item, desc: v })} rows={2} />
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
          </>
        )}
      />
      <ArrayBlock
        label="키워드 링크"
        items={kwLinks}
        onChange={(arr) => set('kw_links', arr)}
        getDefault={() => ({ href: '/', text: '' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
            <FormInput label="텍스트" value={item.text ?? ''} onChange={(v) => up({ ...item, text: v })} />
          </div>
        )}
      />
    </>
  )
}

// --- Region Preview Form ---
function RegionPreviewForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const regions = (data?.regions as { href?: string; region?: string; count?: string; venues?: { vname?: string; type?: string; star?: string }[] }[]) ?? []
  return (
    <ArrayBlock
      label="지역별 미리보기"
      items={regions}
      onChange={(arr) => onChange({ ...data, regions: arr })}
      getDefault={() => ({ href: '/', region: '', count: '', venues: [] })}
      renderItem={(item, _, up) => (
        <>
          <FormInput label="지역 링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
          <FormInput label="지역명" value={item.region ?? ''} onChange={(v) => up({ ...item, region: v })} />
          <FormInput label="업소 수 문구" value={item.count ?? ''} onChange={(v) => up({ ...item, count: v })} />
          <ArrayBlock
            label="대표 업소"
            items={item.venues ?? []}
            onChange={(arr) => up({ ...item, venues: arr })}
            getDefault={() => ({ vname: '', type: '', star: '' })}
            renderItem={(v, __, upv) => (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <FormInput label="업소명" value={v.vname ?? ''} onChange={(val) => upv({ ...v, vname: val })} />
                <FormInput label="업종" value={v.type ?? ''} onChange={(val) => upv({ ...v, type: val })} />
                <FormInput label="별점" value={v.star ?? ''} onChange={(val) => upv({ ...v, star: val })} />
              </div>
            )}
          />
        </>
      )}
    />
  )
}

// --- Widgets A Form (간소화) ---
function WidgetsAForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  const priceRows = (d.price_rows as { region?: string; type?: string; val?: string; chg?: string }[]) ?? []
  const venueRanks = (d.venue_ranks as { href?: string; rank?: number; name?: string; sub?: string; score?: string }[]) ?? []
  const categories = (d.categories as { href?: string; icon?: string; label?: string; count?: string }[]) ?? []
  const keywords = (d.keywords as { href?: string; text?: string; rank?: string; hot?: boolean }[]) ?? []
  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>평균가격 행</p>
      <ArrayBlock
        label=""
        items={priceRows}
        onChange={(arr) => set('price_rows', arr)}
        getDefault={() => ({ region: '', type: '', val: '', chg: 'fl' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: 8 }}>
            <FormInput label="지역" value={item.region ?? ''} onChange={(v) => up({ ...item, region: v })} />
            <FormInput label="업종" value={item.type ?? ''} onChange={(v) => up({ ...item, type: v })} />
            <FormInput label="금액" value={item.val ?? ''} onChange={(v) => up({ ...item, val: v })} />
            <FormInput label="변동" value={item.chg ?? ''} onChange={(v) => up({ ...item, chg: v })} placeholder="fl/up/dn" />
          </div>
        )}
      />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, marginTop: 16 }}>랭킹</p>
      <ArrayBlock
        label=""
        items={venueRanks}
        onChange={(arr) => set('venue_ranks', arr)}
        getDefault={() => ({ href: '/', rank: 1, name: '', sub: '', score: '' })}
        renderItem={(item, _, up) => (
          <>
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
            <FormInput label="업소명" value={item.name ?? ''} onChange={(v) => up({ ...item, name: v })} />
            <FormInput label="부제" value={item.sub ?? ''} onChange={(v) => up({ ...item, sub: v })} />
            <FormInput label="점수" value={item.score ?? ''} onChange={(v) => up({ ...item, score: v })} />
          </>
        )}
      />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, marginTop: 16 }}>카테고리</p>
      <ArrayBlock
        label=""
        items={categories}
        onChange={(arr) => set('categories', arr)}
        getDefault={() => ({ href: '/', icon: '', label: '', count: '' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 80px', gap: 8 }}>
            <FormInput label="아이콘" value={item.icon ?? ''} onChange={(v) => up({ ...item, icon: v })} />
            <FormInput label="라벨" value={item.label ?? ''} onChange={(v) => up({ ...item, label: v })} />
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
            <FormInput label="개수" value={item.count ?? ''} onChange={(v) => up({ ...item, count: v })} />
          </div>
        )}
      />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, marginTop: 16 }}>키워드 트렌드</p>
      <ArrayBlock
        label=""
        items={keywords}
        onChange={(arr) => set('keywords', arr)}
        getDefault={() => ({ href: '/', text: '', rank: '', hot: false })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: 8, alignItems: 'end' }}>
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
            <FormInput label="텍스트" value={item.text ?? ''} onChange={(v) => up({ ...item, text: v })} />
            <FormInput label="순위" value={item.rank ?? ''} onChange={(v) => up({ ...item, rank: v })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={!!item.hot} onChange={(e) => up({ ...item, hot: e.target.checked })} />
              핫
            </label>
          </div>
        )}
      />
    </>
  )
}

// --- Widgets B Form ---
function WidgetsBForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const d = data ?? {}
  const set = (k: string, v: unknown) => onChange({ ...d, [k]: v })
  const timeline = (d.timeline as { time?: string; dot?: string; title?: string; desc?: string }[]) ?? []
  const mapCells = (d.map_cells as { href?: string; name?: string; sub?: string; on?: boolean; coming?: boolean }[]) ?? []
  const notices = (d.notices as { badge?: string; text?: string; date?: string }[]) ?? []
  const faq = (d.faq as { q?: string; a?: string }[]) ?? []
  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>타임라인</p>
      <ArrayBlock
        label=""
        items={timeline}
        onChange={(arr) => set('timeline', arr)}
        getDefault={() => ({ time: '', dot: '', title: '', desc: '' })}
        renderItem={(item, _, up) => (
          <>
            <FormInput label="시간" value={item.time ?? ''} onChange={(v) => up({ ...item, time: v })} placeholder="06:00" />
            <FormInput label="타이틀" value={item.title ?? ''} onChange={(v) => up({ ...item, title: v })} />
            <FormTextarea label="설명" value={item.desc ?? ''} onChange={(v) => up({ ...item, desc: v })} rows={2} />
          </>
        )}
      />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, marginTop: 16 }}>지역 빠른이동</p>
      <ArrayBlock
        label=""
        items={mapCells}
        onChange={(arr) => set('map_cells', arr)}
        getDefault={() => ({ href: '/', name: '', sub: '', on: false, coming: false })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 8, alignItems: 'end' }}>
            <FormInput label="링크" value={item.href ?? ''} onChange={(v) => up({ ...item, href: v })} />
            <FormInput label="지역명" value={item.name ?? ''} onChange={(v) => up({ ...item, name: v })} />
            <FormInput label="부제" value={item.sub ?? ''} onChange={(v) => up({ ...item, sub: v })} />
            <label style={{ fontSize: 13 }}><input type="checkbox" checked={!!item.on} onChange={(e) => up({ ...item, on: e.target.checked })} /> 선택</label>
            <label style={{ fontSize: 13 }}><input type="checkbox" checked={!!item.coming} onChange={(e) => up({ ...item, coming: e.target.checked })} /> 준비중</label>
          </div>
        )}
      />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, marginTop: 16 }}>공지</p>
      <ArrayBlock
        label=""
        items={notices}
        onChange={(arr) => set('notices', arr)}
        getDefault={() => ({ badge: 'nb-n', text: '', date: '' })}
        renderItem={(item, _, up) => (
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: 8 }}>
            <FormInput label="뱃지" value={item.badge ?? ''} onChange={(v) => up({ ...item, badge: v })} />
            <FormInput label="내용(HTML가능)" value={item.text ?? ''} onChange={(v) => up({ ...item, text: v })} />
            <FormInput label="날짜" value={item.date ?? ''} onChange={(v) => up({ ...item, date: v })} placeholder="03.11" />
          </div>
        )}
      />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, marginTop: 16 }}>FAQ</p>
      <ArrayBlock
        label=""
        items={faq}
        onChange={(arr) => set('faq', arr)}
        getDefault={() => ({ q: '', a: '' })}
        renderItem={(item, _, up) => (
          <>
            <FormInput label="질문" value={item.q ?? ''} onChange={(v) => up({ ...item, q: v })} />
            <FormTextarea label="답변" value={item.a ?? ''} onChange={(v) => up({ ...item, a: v })} rows={2} />
          </>
        )}
      />
    </>
  )
}

// --- Form Router ---
const FORM_MAP: Record<string, React.FC<{ data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }>> = {
  hero: HeroForm,
  ticker: TickerForm,
  header: HeaderForm,
  about: AboutForm,
  stats: StatsForm,
  cta: CTAForm,
  footer: FooterForm,
  partners_config: PartnersConfigForm,
  feed_config: FeedConfigForm,
  review_config: ReviewConfigForm,
  region_guide: RegionGuideForm,
  category_guide: CategoryGuideForm,
  region_preview: RegionPreviewForm,
  widgets_a: WidgetsAForm,
  widgets_b: WidgetsBForm,
}

export default function SectionFormEditor({
  sectionKey,
  sectionLabel,
  onClose,
  adminLink,
}: {
  sectionKey: string
  sectionLabel: string
  onClose: () => void
  adminLink?: string
}) {
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/site/${sectionKey}`)
      .then((r) => r.json())
      .then((res) => setData(typeof res === 'object' && res !== null ? res : {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [sectionKey])

  const showMsg = useCallback((text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/site/${sectionKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        showMsg('저장 완료!')
      } else {
        const err = await res.json()
        showMsg(err?.error || '저장 실패')
      }
    } catch {
      showMsg('저장 실패')
    }
    setSaving(false)
  }

  useEffect(() => {
    load()
  }, [load])

  const FormComponent = FORM_MAP[sectionKey]

  if (!FormComponent) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 12 }}>{sectionLabel}</h2>
        <p style={{ color: 'var(--muted)' }}>이 섹션은 폼 편집을 지원하지 않습니다. 관리 페이지를 이용하세요.</p>
        <button type="button" onClick={onClose} style={{ marginTop: 16 }} className="btn-save">닫기</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxHeight: '80vh', overflow: 'auto' }}>
      <h2 id="section-modal-title" style={{ marginBottom: 8 }}>{sectionLabel}</h2>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        아래 필드를 수정 후 저장하면 메인 페이지에 반영됩니다.
      </p>
      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 12, borderRadius: 8, fontSize: 13, background: 'rgba(46,204,113,.1)', color: 'var(--green)' }}>
          {msg}
        </div>
      )}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>로딩 중...</p>
      ) : (
        <FormComponent data={data} onChange={setData} />
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button className="btn-save" onClick={save} disabled={saving || loading}>
          {saving ? '저장 중...' : '저장'}
        </button>
        <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          닫기
        </button>
        {adminLink && (
          <Link href={adminLink} target="_blank" rel="noopener noreferrer" className="btn-save" style={{ textDecoration: 'none', marginLeft: 'auto' }}>
            관리 페이지 →
          </Link>
        )}
      </div>
    </div>
  )
}
