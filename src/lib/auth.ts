import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'

export const authOptions: NextAuthOptions = {
  trustHost: true, // Cloudflare/Nginx 프록시 환경에서 올바른 callback URL 사용
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user && account) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: member } = await supabase
          .from('members')
          .select('id, role')
          .eq('email', user.email!)
          .single()

        if (member) {
          token.memberId = member.id
          token.role = member.role
        } else {
          const { data: newMember } = await supabase
            .from('members')
            .upsert(
              {
                email: user.email!,
                display_name: user.name || '사용자',
                picture: user.image || '',
                google_id: account.providerAccountId,
                role: 'user',
              },
              { onConflict: 'email' }
            )
            .select('id, role')
            .single()
          token.memberId = newMember?.id
          token.role = newMember?.role || 'user'
        }
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = (token.memberId as string) || ''
        session.user.role = (token.role as string) || 'user'
      }
      return session
    },
  },
}
