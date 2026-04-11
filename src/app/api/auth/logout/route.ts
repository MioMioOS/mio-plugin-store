import { cookies } from "next/headers";

const ADMIN_API = process.env.ADMIN_API || "https://cat.wdao.chat";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("mio_refresh")?.value;

  // Try to invalidate on admin side
  if (refreshToken) {
    try {
      await fetch(`${ADMIN_API}/api/public/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // ignore errors during logout
    }
  }

  // Clear cookies
  cookieStore.set("mio_refresh", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set("mio_auth_data", "", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
