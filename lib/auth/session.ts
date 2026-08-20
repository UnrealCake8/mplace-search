import { cookies } from "next/headers";
import { adminAuth } from "../firebase/auth-admin";

const SESSION_COOKIE = "mplace_session";

export async function getMPlaceUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch {
    return null;
  }
}
