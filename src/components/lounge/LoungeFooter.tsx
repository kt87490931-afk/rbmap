'use client'

import Link from 'next/link'
import { EditableText } from '@/components/lounge/edit/EditableText'
import { useLoungeContent, useLoungeEdit } from '@/components/lounge/edit/LoungeEditContext'

export function LoungeFooter() {
  const c = useLoungeContent()
  const { editMode } = useLoungeEdit()

  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-block">
          <Link href="/" className="brand">
            룸빵<em>여지도</em>
          </Link>
          <p className="editable-block" style={{ fontSize: 13, marginTop: 12 }}>
            <EditableText path="footer.desc" value={c.footer.desc} block />
          </p>
        </div>
        <div className="footer-block">
          <h4>바로가기</h4>
          <ul>
            <li><Link href="/#about">소개</Link></li>
            <li><Link href="/#menu">이용요금</Link></li>
            <li><Link href="/reviews">후기</Link></li>
            <li><Link href="/#location">오시는 길</Link></li>
          </ul>
        </div>
        <div className="footer-block">
          <h4>안내</h4>
          <ul>
            <li><Link href="/#contact">문의</Link></li>
            <li><Link href="/reviews">전체 후기</Link></li>
          </ul>
        </div>
      </div>
      <div className="container footer-legal">
        <span className="editable">
          <EditableText path="footer.copyright" value={c.footer.copyright} />
        </span>
        {(c.footer.bizNo || editMode) && (
          <span className="editable" style={!c.footer.bizNo ? { opacity: 0.45 } : undefined}>
            <EditableText path="footer.bizNo" value={c.footer.bizNo || '사업자등록번호 입력'} />
          </span>
        )}
      </div>
    </footer>
  )
}
