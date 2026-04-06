import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token || !token.role) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const role = String(token.role).toUpperCase()

    if (path.startsWith("/admin") && role !== "ADMIN" && role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (path.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/student/:path*"]
}
