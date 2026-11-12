import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie for /admin and does an optimistic
 * redirect to the login page. The real authorization check (admin_users)
 * happens on the server in every admin page and action.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname.startsWith("/admin/login");
  if (!data.user && !isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
