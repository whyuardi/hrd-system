import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import * as bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.aktif) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null

        return {
          id: String(user.id),
          email: user.email,
          name: user.nama,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: Record<string, any>; user?: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any; token: Record<string, any> }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
})

declare module "next-auth" {
  interface User { role?: string }
  interface Session { user: { id?: string; role?: string; name?: string; email?: string } }
}
