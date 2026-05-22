import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from "@/lib/admin-cookie";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin/dashboard")) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const raw = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const valid = await verifyAdminCookieValue(raw, secret);

  if (!valid) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard", "/admin/dashboard/:path*"],
};
