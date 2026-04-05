import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (path.startsWith("/admin") && token.role !== "teacher") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url))
    }

    if (path.startsWith("/student") && token.role !== "student") {
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
