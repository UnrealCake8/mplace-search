import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/firebase/auth-admin";

const SESSION_COOKIE = "mplace_session";
const FIVE_DAYS = 60 * 60 * 24 * 5;

function cookieOptions(maxAge: number) {
  const domain = process.env.MPLACE_COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) {
    return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
  }

  try {
    await adminAuth.verifyIdToken(body.idToken, true);
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: FIVE_DAYS * 1000,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, sessionCookie, cookieOptions(FIVE_DAYS));
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid or expired sign-in token." }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
  return response;
}
