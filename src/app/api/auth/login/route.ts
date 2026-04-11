import { cookies } from "next/headers";

export async function GET() {
  const state = crypto.randomUUID();
  const clientId = process.env.GITHUB_CLIENT_ID || "";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://miomio.chat";

  const cookieStore = await cookies();
  cookieStore.set("mio_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/auth/callback`,
    scope: "read:user",
    state,
  });

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
}
