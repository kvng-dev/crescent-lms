import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const session = getSessionCookie(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Optionally, you can add more logic here to check user roles or permissions
  // For example, redirecting non-admin users from admin routes

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
