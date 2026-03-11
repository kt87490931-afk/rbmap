import { generateSecret as otpGenerateSecret, verifySync, generateURI } from 'otplib'
import { toDataURL } from 'qrcode'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase-server'

const OTP_COOKIE_NAME = 'admin_otp_session'
const OTP_SESSION_DURATION_MIN = 1440
const OTP_MAX_ATTEMPTS = 5
const OTP_LOCKOUT_MIN = 15
const OTP_ISSUER = '룸빵여지도'

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for OTP')
  return new TextEncoder().encode(secret)
}

export function generateOtpSecret(): string {
  return otpGenerateSecret()
}

export function verifyOtpToken(secret: string, token: string): boolean {
  const result = verifySync({ token, secret })
  return result.valid
}

export async function generateOtpQrCode(
  secret: string,
  email: string
): Promise<string> {
  const otpauth = generateURI({ secret, label: email, issuer: OTP_ISSUER })
  return toDataURL(otpauth)
}

export async function saveOtpSecret(userId: string, secret: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('members')
    .update({ otp_secret: secret })
    .eq('id', userId)
  if (error) throw error
}

export async function getOtpSecret(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('otp_secret')
    .eq('id', userId)
    .single()
  if (error) return null
  return data?.otp_secret ?? null
}

export async function removeOtpSecret(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('members')
    .update({ otp_secret: null })
    .eq('id', userId)
  if (error) throw error
}

export async function setOtpSessionCookie(userId: string): Promise<void> {
  const token = await new SignJWT({ userId, otpVerified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${OTP_SESSION_DURATION_MIN}m`)
    .sign(getJwtSecret())

  const cookieStore = await cookies()
  cookieStore.set(OTP_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OTP_SESSION_DURATION_MIN * 60,
  })
}

export async function verifyOtpSession(userId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(OTP_COOKIE_NAME)
    if (!cookie?.value) return false

    const { payload } = await jwtVerify(cookie.value, getJwtSecret())
    return payload.userId === userId && payload.otpVerified === true
  } catch {
    return false
  }
}

export async function clearOtpSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(OTP_COOKIE_NAME)
}

export async function checkOtpLockout(userId: string): Promise<{
  locked: boolean
  remainingMinutes: number
}> {
  const { data } = await supabaseAdmin
    .from('members')
    .select('otp_fail_count, otp_locked_until')
    .eq('id', userId)
    .single()

  if (!data) return { locked: false, remainingMinutes: 0 }

  if (data.otp_locked_until) {
    const lockedUntil = new Date(data.otp_locked_until)
    if (lockedUntil > new Date()) {
      const remaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
      return { locked: true, remainingMinutes: remaining }
    }
    await supabaseAdmin
      .from('members')
      .update({ otp_fail_count: 0, otp_locked_until: null })
      .eq('id', userId)
  }

  return { locked: false, remainingMinutes: 0 }
}

export async function recordOtpAttempt(
  userId: string,
  success: boolean
): Promise<{ locked: boolean }> {
  if (success) {
    await supabaseAdmin
      .from('members')
      .update({ otp_fail_count: 0, otp_locked_until: null })
      .eq('id', userId)
    return { locked: false }
  }

  const { data } = await supabaseAdmin
    .from('members')
    .select('otp_fail_count')
    .eq('id', userId)
    .single()

  const newCount = (data?.otp_fail_count ?? 0) + 1

  if (newCount >= OTP_MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + OTP_LOCKOUT_MIN * 60000).toISOString()
    await supabaseAdmin
      .from('members')
      .update({ otp_fail_count: newCount, otp_locked_until: lockedUntil })
      .eq('id', userId)
    return { locked: true }
  }

  await supabaseAdmin
    .from('members')
    .update({ otp_fail_count: newCount })
    .eq('id', userId)
  return { locked: false }
}
