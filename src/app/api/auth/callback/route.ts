import { cookies } from "next/headers";

const ADMIN_API = process.env.ADMIN_API || "https://cat.wdao.chat";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://miomio.chat";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("mio_oauth_state")?.value;

  // Clear state cookie
  cookieStore.set("mio_oauth_state", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  if (!code || !state || state !== savedState) {
    return Response.redirect(`${SITE_URL}?error=invalid_state`);
  }

  try {
    // Exchange code via admin API
    const res = await fetch(`${ADMIN_API}/api/public/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      return Response.redirect(`${SITE_URL}?error=auth_failed`);
    }

    const data = await res.json();
    // data: { accessToken, refreshToken, user }

    // Set httpOnly refresh token cookie (7 days)
    cookieStore.set("mio_refresh", data.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Set non-httpOnly auth data cookie (60 seconds) for client to consume
    const authData = JSON.stringify({
      accessToken: data.accessToken,
      user: data.user,
    });
    cookieStore.set("mio_auth_data", authData, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60,
    });

    return Response.redirect(SITE_URL);
  } catch {
    return Response.redirect(`${SITE_URL}?error=auth_error`);
  }
}
