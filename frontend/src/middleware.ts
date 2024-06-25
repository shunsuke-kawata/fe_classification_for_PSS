// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ルートページ、ログインページ、サインアップページには認証を要求しない
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  // Cookieを取得して認証をチェック
  const user_id = request.cookies.get("id");
  const logined = request.cookies.get("logined");

  // 認証されていない場合はログインページにリダイレクト
  if (user_id === null || !logined) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// middlewareを適用するパスの指定
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
