import configJson from "@/config/config.json";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const referer = request.headers.get("referer");

  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  // Cookieを取得して認証をチェック
  const userId = request.cookies.get("id");

  // userDataがない場合はログインページにリダイレクト
  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  //直打ちでかつクッキーにidがないとき
  if (
    (!referer || !referer.includes(configJson.frontend_base_url)) &&
    !userId
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

// middlewareを適用するパスの指定
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)"],
};
