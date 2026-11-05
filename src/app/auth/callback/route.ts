import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Finishes email links (confirmation, password reset) by exchanging the one-time code for a session. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const target = request.nextUrl.clone();
  target.search = "";

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Only allow same-site relative paths, never an open redirect.
      target.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(target);
    }
  }

  target.pathname = "/forgot";
  return NextResponse.redirect(target);
}
