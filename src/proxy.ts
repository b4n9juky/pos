import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const publicPaths = ["/login", "/api/auth", "/api/print-receipt"]
const adminOnlyPaths = ["/settings", "/reports", "/api/users", "/api/settings", "/api/tax-settings"]
const warehouseAllowedPaths = ["/products", "/api/products", "/api/categories"]
const adminWriteApiPaths = ["/api/products", "/api/categories", "/api/customers"]
const ownerOnlyPaths = ["/dashboard", "/api/dashboard"]
const writeMethods = ["POST", "PATCH", "PUT", "DELETE"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const method = req.method ?? "GET"
  const role = req.auth?.user?.role

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

  if (role === "warehouse") {
    if (!warehouseAllowedPaths.some((p) => pathname.startsWith(p))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/products", req.url))
    }
  }

  if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
    if (role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/pos", req.url))
    }
  }

  if (pathname.startsWith("/api/reports")) {
    if (role !== "admin" && role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  if (ownerOnlyPaths.some((p) => pathname.startsWith(p))) {
    if (role !== "owner") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/pos", req.url))
    }
  }

  if (adminWriteApiPaths.some((p) => pathname.startsWith(p))) {
    if (writeMethods.includes(method) && role !== "admin" && role !== "warehouse") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }
})

export const config = {
  matcher: [
    "/login",
    "/pos",
    "/pos/:path*",
    "/products",
    "/products/:path*",
    "/categories",
    "/categories/:path*",
    "/customers",
    "/customers/:path*",
    "/orders",
    "/orders/:path*",
    "/reports",
    "/reports/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/register",
    "/register/:path*",
    "/settings",
    "/settings/:path*",
    "/api/:path*",
  ],
}
