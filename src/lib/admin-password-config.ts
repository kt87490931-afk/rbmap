/** ADMIN_PASSWORD 가 설정되면 Google 로그인 대신 비밀번호로 어드민 접근 */
export function isAdminPasswordEnabled(): boolean {
  return !!(process.env.ADMIN_PASSWORD || '').trim()
}

export function getAdminPassword(): string {
  return (process.env.ADMIN_PASSWORD || '').trim()
}
