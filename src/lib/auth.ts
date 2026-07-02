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
      async authorize(credentials: Partial<Record<string, unknown>>) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        if (!email || !password) return null

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.aktif) return null

        const isValid = await bcrypt.compare(password, user.password)
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
    async jwt(params: { token: Record<string, unknown>; user?: Record<string, unknown> }) {
      const { token, user } = params
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session(params: { session: Record<string, unknown>; token: Record<string, unknown> }) {
      const { session, token } = params
      if (session.user && typeof session.user === "object") {
        ;(session.user as Record<string, unknown>).role = token.role
        ;(session.user as Record<string, unknown>).id = token.id
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
