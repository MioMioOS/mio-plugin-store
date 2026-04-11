import { cookies } from "next/headers";

const ADMIN_API = process.env.ADMIN_API || "https://cat.wdao.chat";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("mio_refresh")?.value;

  if (!refreshToken) {
    return Response.json({ error: "no_refresh_token" }, { status: 401 });
  }

  try {
    const res = await fetch(`${ADMIN_API}/api/public/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Clear invalid refresh token
      cookieStore.set("mio_refresh", "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return Response.json({ error: "refresh_failed" }, { status: 401 });
    }

    const data = await res.json();

    // Update refresh token cookie with rotated token
    if (data.refreshToken) {
      cookieStore.set("mio_refresh", data.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return Response.json({
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch {
    return Response.json({ error: "refresh_error" }, { status: 500 });
  }
}
