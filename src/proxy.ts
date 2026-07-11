import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const publicPaths = ["/login", "/api/auth"]
const adminOnlyPaths = ["/settings", "/api/users", "/api/settings", "/api/tax-settings"]

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return
  }

  if (pathname === "/") {
    return
  }

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
    if (req.auth.user?.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/pos", req.url))
    }
  }
})

export const config = {
  matcher: [
    "/login",
    "/pos/:path*",
    "/products/:path*",
    "/categories/:path*",
    "/customers/:path*",
    "/orders/:path*",
    "/reports/:path*",
    "/register/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
}
