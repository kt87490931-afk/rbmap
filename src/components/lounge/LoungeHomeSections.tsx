'use client'

import Link from 'next/link'
import { EditableText } from '@/components/lounge/edit/EditableText'
import { EditableImage } from '@/components/lounge/edit/EditableImage'
import { useLoungeContent, useLoungeEdit } from '@/components/lounge/edit/LoungeEditContext'
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
        <div className="container review-layout">
          <div>
            <span className="eyebrow">Review</span>
            <h2 style={{ marginBottom: 18 }} className="editable-block">
              <EditableText path="reviews.title" value={c.reviews.title} block />
            </h2>
            <div className="review-summary">
              <div className="score">{avgStar}</div>
              <div>
                <span className="stars">{formatStars(Math.round(Number(avgStar)))}</span>
                <span className="count">총 {totalCount}건의 후기</span>
              </div>
            </div>
            <p className="editable-block" style={{ fontSize: 13 }}>
              <EditableText path="reviews.note" value={c.reviews.note} block />
            </p>
          </div>
          <div>
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
        </div>
      </section>

      <section className="section" id="location">
        <div className="container location-grid">
          <div className="location-map">
            <EditableImage path="location.mapImage" url={c.location.mapImage} placeholder="지도 임베드 자리" slot="map" />
          </div>
          <div>
            <span className="eyebrow">Location</span>
            <h2 style={{ marginBottom: 18 }} className="editable-block">
              <EditableText path="location.title" value={c.location.title} block />
            </h2>
            <ul className="info-list">
              {c.location.items.map((item, i) => (
                <li key={i}>
                  <span className="k">{item.key}</span>
                  <span className="editable">
                    <EditableText path={`location.items.${i}.value`} value={item.value} className="v" />
                  </span>
                </li>
              ))}
            </ul>
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
            <Link href="#contact" className="btn btn-ghost">문의하기</Link>
          </div>
        </div>
      </section>

      <section className="section" id="contact" style={{ borderBottom: 'none' }}>
        <div className="container contact-grid">
          <div>
            <span className="eyebrow">Contact</span>
            <h2 style={{ marginBottom: 18 }} className="editable-block">
              <EditableText path="contact.title" value={c.contact.title} block />
            </h2>
            <ul className="contact-info">
              {c.contact.items.map((item, i) => (
                <li key={i}>
                  <span className="k">{item.key}</span>
                  <span className="editable">
                    <EditableText path={`contact.items.${i}.value`} value={item.value} className="v" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <form className="form-grid" aria-label="문의 폼">
            <div className="form-row">
              <div><label htmlFor="name">이름</label><input id="name" name="name" type="text" placeholder="이름" /></div>
              <div><label htmlFor="phone">연락처</label><input id="phone" name="phone" type="tel" placeholder="010-0000-0000" /></div>
            </div>
            <div><label htmlFor="message">문의 내용</label><textarea id="message" name="message" placeholder="문의 내용을 남겨주세요" /></div>
            <button type="button" className="btn btn-primary btn-block">
              <EditableText path="contact.formBtn" value={c.contact.formBtn} />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
