import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const publicPaths = ["/login", "/api/auth", "/api/print-receipt"]
const adminOnlyPaths = ["/settings", "/reports", "/api/users", "/api/settings", "/api/tax-settings", "/api/reports"]
const adminWriteApiPaths = ["/api/products", "/api/categories", "/api/customers"]
const writeMethods = ["POST", "PATCH", "PUT", "DELETE"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const method = req.method ?? "GET"

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

  if (adminWriteApiPaths.some((p) => pathname.startsWith(p))) {
    if (writeMethods.includes(method) && req.auth.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
