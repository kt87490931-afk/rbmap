import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { getOtpSecret, verifyOtpSession } from './otp'

export type AdminCheckResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'no-session'; redirect: string }
  | { ok: false; reason: 'not-admin'; redirect: null }
  | { ok: false; reason: 'otp-not-setup'; redirect: string }
  | { ok: false; reason: 'otp-not-verified'; redirect: string }

export async function checkAdminOtp(callbackPath: string): Promise<AdminCheckResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      ok: false,
      reason: 'no-session',
      redirect: `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`,
    }
  }

  if (session.user.role !== 'admin') {
    return { ok: false, reason: 'not-admin', redirect: null }
  }

  const otpSecret = await getOtpSecret(session.user.id)

  if (!otpSecret) {
    return { ok: false, reason: 'otp-not-setup', redirect: '/admin/setup-otp' }
  }

  const isVerified = await verifyOtpSession(session.user.id)

  if (!isVerified) {
    return { ok: false, reason: 'otp-not-verified', redirect: '/admin/verify-otp' }
  }

  return { ok: true, userId: session.user.id }
}
