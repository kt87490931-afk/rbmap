'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EditableText } from '@/components/lounge/edit/EditableText'
import { EditableImage } from '@/components/lounge/edit/EditableImage'
import { useLoungeContent, useLoungeEdit } from '@/components/lounge/edit/LoungeEditContext'
import { loungeImageSrc } from '@/lib/data/lounge-home'
import {
  buildFlatReviewPath,
  formatReviewDate,
  formatStars,
  reviewExcerpt,
} from '@/lib/data/review-flat'
import type { ReviewPost } from '@/lib/data/review-posts'

type Props = {
  latestReviews: (ReviewPost & { flatSlug: string })[]
  totalCount: number
  avgStar: string
}

export function LoungeHomeSections({ latestReviews, totalCount, avgStar }: Props) {
  const c = useLoungeContent()
  const { editMode } = useLoungeEdit()
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [contactOpen, setContactOpen] = useState(false)

  const contactRaw = (c.hero.contact || '').trim()
  const contactHref = buildContactHref(contactRaw)

  // 헤더/네비의 "문의하기"(/#contact)로 진입하면 문의 모달을 자동으로 연다
  useEffect(() => {
    const openIfHash = () => {
      if (window.location.hash === '#contact') setContactOpen(true)
    }
    openIfHash()
    window.addEventListener('hashchange', openIfHash)
    return () => window.removeEventListener('hashchange', openIfHash)
  }, [])

  const closeContact = () => {
    setContactOpen(false)
    if (window.location.hash === '#contact') {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }

  const galleryVisible = c.gallery.images
    .map((img) => loungeImageSrc(img))
    .filter((src): src is string => !!src)

  return (
    <main id="main">
      <section className="hero" id="top">
        <div className="container hero-inner">
          <div className="hero-text">
            <div className="hero-badges">
              <EditableText path="hero.badge1" value={c.hero.badge1} className="hero-badge-pill" />
              <EditableText path="hero.badge2" value={c.hero.badge2} className="hero-badge-pill" />
              <EditableText path="hero.badge3" value={c.hero.badge3} className="hero-badge-pill" />
            </div>
            <h1>
              <EditableText path="hero.h1" value={c.hero.h1} html />
            </h1>
            <p className="hero-sub editable-block">
              <EditableText path="hero.sub" value={c.hero.sub} block />
            </p>
            <div className="hero-actions">
              <Link href="/reviews" className="btn btn-primary">후기 보기</Link>
              <Link href="#about" className="btn btn-ghost">소개 보기</Link>
              <button
                type="button"
                className="btn btn-primary hero-inquiry-btn"
                onClick={() => setContactOpen(true)}
              >
                문의하기
              </button>
            </div>
          </div>
          <div className="hero-media">
            <EditableImage path="hero.image" url={c.hero.image} placeholder="대표 이미지" slot="hero-main" />
          </div>
        </div>
        <div className="quickbar">
          <div className="container">
            <div className="quickbar-item">
              <span className="label">
                <EditableText path="quickbar.label1" value={c.quickbar.label1} />
              </span>
              <span className="value">{totalCount}건</span>
            </div>
            <div className="quickbar-item">
              <span className="label">
                <EditableText path="quickbar.label2" value={c.quickbar.label2} />
              </span>
              <span className="value">{avgStar} / 5.0</span>
            </div>
            <div className="quickbar-item">
              <span className="label">
                <EditableText path="quickbar.label3" value={c.quickbar.label3} />
              </span>
              <span className="editable">
                <EditableText path="quickbar.value3" value={c.quickbar.value3} className="value" />
              </span>
            </div>
            <div className="quickbar-item">
              <span className="label">
                <EditableText path="quickbar.label4" value={c.quickbar.label4} />
              </span>
              <span className="editable">
                <EditableText path="quickbar.value4" value={c.quickbar.value4} className="value" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container about-grid">
          <div className="about-media">
            <EditableImage path="about.image" url={c.about.image} placeholder="공간 사진" slot="about-main" />
          </div>
          <div className="about-copy">
            <span className="eyebrow">
              <EditableText path="about.eyebrow" value={c.about.eyebrow} />
            </span>
            <h2 className="editable-block">
              <EditableText path="about.title" value={c.about.title} block />
            </h2>
            <p className="editable-block">
              <EditableText path="about.p1" value={c.about.p1} block />
            </p>
            <p className="editable-block">
              <EditableText path="about.p2" value={c.about.p2} block />
            </p>
            <ul className="about-list">
              {c.about.items.map((item, i) => (
                <li key={i}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="editable-block">
                      <EditableText path={`about.items.${i}.title`} value={item.title} block />
                    </h3>
                    <p className="editable-block">
                      <EditableText path={`about.items.${i}.desc`} value={item.desc} block />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="gallery">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Space</span>
            <h2 className="editable-block">
              <EditableText path="gallery.title" value={c.gallery.title} block />
            </h2>
            <p className="editable-block">
              <EditableText path="gallery.note" value={c.gallery.note} block />
            </p>
          </div>
          {editMode ? (
            <div className="gallery-grid">
              {c.gallery.images.map((img, i) => (
                <EditableImage
                  key={i}
                  path={`gallery.images.${i}`}
                  url={img}
                  placeholder={String(i + 1)}
                  slot={`gallery-${i + 1}`}
                />
              ))}
            </div>
          ) : galleryVisible.length > 0 ? (
            <div className="gallery-grid">
              {galleryVisible.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className="ph has-image gallery-thumb"
                  style={{ backgroundImage: `url(${src})` }}
                  onClick={() => setLightbox(src)}
                  aria-label="이미지 원본 보기"
                >
                  <span>{i + 1}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section" id="menu">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Price</span>
            <h2 className="editable-block">
              <EditableText path="menu.title" value={c.menu.title} block />
            </h2>
            <p className="menu-tabs-note editable-block">
              <EditableText path="menu.note" value={c.menu.note} block />
            </p>
          </div>
          <div className="menu-groups">
            {c.menu.groups.map((group, gi) => (
              <div className="menu-group" key={gi}>
                <h3 className="editable-block">
                  <EditableText path={`menu.groups.${gi}.title`} value={group.title} block />
                </h3>
                {group.rows.map((row, ri) => (
                  <div className="menu-row" key={ri}>
                    <div className="name-block">
                      <span className="editable">
                        <EditableText path={`menu.groups.${gi}.rows.${ri}.name`} value={row.name} className="name" />
                      </span>
                      <span className="editable">
                        <EditableText path={`menu.groups.${gi}.rows.${ri}.desc`} value={row.desc} className="desc" />
                      </span>
                    </div>
                    <div className="leader" />
                    <span className="editable">
                      <EditableText path={`menu.groups.${gi}.rows.${ri}.price`} value={row.price} className="price" />
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {(c.menu.menuNote || editMode) && (
            <div className="menu-note editable-block">
              <EditableText path="menu.menuNote" value={c.menu.menuNote || '안내 문구 입력'} block />
            </div>
          )}
        </div>
      </section>

      <section className="section" id="reviews">
        <div className="container">
          <span className="eyebrow">Review</span>
          <h2 style={{ marginBottom: 12 }} className="editable-block">
            <EditableText path="reviews.title" value={c.reviews.title} block />
          </h2>
          <p className="editable-block" style={{ fontSize: 13, marginBottom: 22 }}>
            <EditableText path="reviews.note" value={c.reviews.note} block />
          </p>
          <ul className="review-list">
            {latestReviews.map((r) => (
              <li key={r.id}>
                <Link href={buildFlatReviewPath(r.flatSlug)} className="review-item">
                  <div className="top">
                    <span className="name">{r.title}</span>
                    <span className="date">{formatReviewDate(r.published_at)}</span>
                  </div>
                  <span className="stars">{formatStars(r.star)}</span>
                  <p>{reviewExcerpt(r, 120)}</p>
                </Link>
              </li>
            ))}
            {latestReviews.length === 0 && (
              <li className="review-item"><p>등록된 후기가 없습니다.</p></li>
            )}
          </ul>
          <div className="review-more">
            <Link href="/reviews" className="btn btn-ghost btn-block">후기 더보기</Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <span className="eyebrow">
            <EditableText path="cta.eyebrow" value={c.cta.eyebrow} />
          </span>
          <h2 className="editable-block" style={{ justifyContent: 'center' }}>
            <EditableText path="cta.title" value={c.cta.title} block />
          </h2>
          <p className="editable-block" style={{ justifyContent: 'center' }}>
            <EditableText path="cta.desc" value={c.cta.desc} block />
          </p>
          <div className="cta-actions">
            <Link href="/reviews" className="btn btn-primary">전체 후기 보기</Link>
            <button type="button" className="btn btn-ghost" onClick={() => setContactOpen(true)}>문의하기</button>
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="lounge-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="이미지 원본 보기"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="lounge-lightbox-close"
            aria-label="닫기"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="원본 이미지" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {contactOpen && (
        <div
          className="lounge-contact-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="문의하기"
          onClick={closeContact}
        >
          <div className="lounge-contact-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lounge-contact-close"
              aria-label="닫기"
              onClick={closeContact}
            >
              ×
            </button>
            <span className="eyebrow">Contact</span>
            <h3>문의하기</h3>
            <p className="lounge-contact-desc">아래 연락처로 편하게 문의해 주세요.</p>
            <div className="lounge-contact-value editable-block">
              <EditableText
                path="hero.contact"
                value={contactRaw || (editMode ? '연락처를 입력하세요' : '연락처 준비 중입니다.')}
                block
              />
            </div>
            {contactHref && (
              <a
                href={contactHref}
                className="btn btn-primary btn-block"
                {...(contactHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {contactHref.startsWith('tel:') ? '전화 걸기' : '연결하기'}
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

/** 연락처 문자열을 tel: 링크 또는 외부 링크(카카오/텔레그램 등)로 변환. 변환 불가 시 null. */
function buildContactHref(raw: string): string | null {
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  const digits = raw.replace(/[^0-9+]/g, '')
  if (digits.replace(/\D/g, '').length >= 7) return `tel:${digits}`
  return null
}
