import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username / Admission Number", type: "text", placeholder: "e.g. S1234 or teacher@school.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password")
        }

        const username = credentials.username

        // Check if Teacher (Email)
        if (username.includes("@")) {
          const teacher = await prisma.teacher.findUnique({
            where: { email: username.toLowerCase() }
          })
          if (teacher && bcrypt.compareSync(credentials.password, teacher.password)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { id: teacher.id, email: teacher.email, name: teacher.name, role: (teacher as any).role || "teacher" }
          }
        } 
        // Otherwise, Check if Student (AdmNo)
        else {
          const student = await prisma.student.findUnique({
            where: { admno: username }
          })
          if (student && bcrypt.compareSync(credentials.password, student.password)) {
            return { id: student.admno, email: student.admno, name: student.name, role: "student" }
          }
        }

        throw new Error("Invalid username or password")
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
