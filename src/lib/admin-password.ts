import { timingSafeEqual } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getAdminPassword, isAdminPasswordEnabled } from './admin-password-config'

const COOKIE_NAME = 'admin_password_session'
const SESSION_DAYS = 7

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for admin password session')
  return new TextEncoder().encode(secret)
}

export function verifyAdminPassword(input: string): boolean {
  const expected = getAdminPassword()
  if (!expected || !input) return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function setAdminPasswordSessionCookie(): Promise<void> {
  const token = await new SignJWT({ adminPassword: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getJwtSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function hasAdminPasswordSession(): Promise<boolean> {
  if (!isAdminPasswordEnabled()) return false
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload.adminPassword === true
  } catch {
    return false
  }
}

export async function clearAdminPasswordSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export { isAdminPasswordEnabled }
