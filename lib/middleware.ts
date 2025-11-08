import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Super admin routes
    if (pathname.startsWith("/super-admin") && token?.role !== "super-admin") {
      return Response.redirect(new URL("/login", req.url))
    }

    // Tenant routes
    if (pathname.startsWith("/tenant") && token?.role !== "tenant-admin") {
      return Response.redirect(new URL("/login", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to login page
        if (pathname === "/login") return true
        
        // Require authentication for protected routes
        if (pathname.startsWith("/super-admin") || pathname.startsWith("/tenant")) {
          return !!token
        }
        
        return true
      }
    }
  }
)

export const config = {
  matcher: ["/super-admin/:path*", "/tenant/:path*", "/login"]
}