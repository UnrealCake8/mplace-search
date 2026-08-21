"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "../../lib/firebase/client";
import { MPlaceApps } from "../../components/MPlaceApps";
import { MPlaceBrand } from "../../components/MPlaceBrand";

async function establishSession(user: User) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) throw new Error("Could not create your MPlace session.");
}

export default function MPlaceIdPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  async function finish(nextUser: User) {
    await establishSession(nextUser);
    setUser(nextUser);
    setMessage("Signed in to MPlace ID.");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const credential = mode === "signup"
        ? await createUserWithEmailAndPassword(firebaseAuth, email, password)
        : await signInWithEmailAndPassword(firebaseAuth, email, password);
      await finish(credential.user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      await finish(credential.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not sign in with Google.";
      setMessage(errorMessage.includes("popup-closed") ? "Sign-in was cancelled." : errorMessage);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(firebaseAuth);
    setUser(null);
    setMessage("Signed out.");
  }

  return (
    <main className="account-page">
      <header className="account-topbar">
        <a href="/" className="account-brand" aria-label="MPlace home">
          <MPlaceBrand compact product="ID" />
        </a>
        <div className="account-top-actions">
          <a href="/">Search</a>
          <MPlaceApps compact />
        </div>
      </header>

      <section className="account-stage">
        <div className="account-card">
          <div className="account-intro">
            <MPlaceBrand product="ID" />
            {user ? (
              <>
                <h1>Your MPlace ID</h1>
                <p>One account for MPlace products and the things you create across them.</p>
              </>
            ) : (
              <>
                <h1>{mode === "signin" ? "Sign in" : "Create your MPlace ID"}</h1>
                <p>{mode === "signin" ? "Use your MPlace ID to continue to MPlace products." : "Create one account for the MPlace family."}</p>
              </>
            )}
          </div>

          <div className="account-panel">
            {user ? (
              <>
                <div className="account-user">
                  <div className="account-avatar">{(user.email || "M").charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{user.email || "MPlace member"}</strong>
                    <span>MPlace ID</span>
                  </div>
                </div>
                <div className="account-links">
                  <a href="https://pages.mplace.cc">MPlace Pages</a>
                  <a href="https://videos.mplace.cc">MVideo</a>
                  <a href="https://study.mplace.cc">MStudy</a>
                  <a href="https://ads.mplace.cc">M.Ads</a>
                  <a href="/business/add">Manage Places</a>
                </div>
                <button className="account-secondary-button" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="account-secondary-button"
                  onClick={signInWithGoogle}
                  disabled={busy}
                >
                  Continue with Google
                </button>
                <div className="account-divider" role="separator"><span>or</span></div>
                <form className="account-form" onSubmit={submit}>
                  <label>
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </label>
                  <label>
                    <span>Password</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                  </label>
                  <div className="account-form-actions">
                    <button type="button" className="account-text-button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
                      {mode === "signin" ? "Create account" : "Sign in instead"}
                    </button>
                    <button className="account-primary-button" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Next" : "Create ID"}</button>
                  </div>
                </form>
                <p className="account-help">Searching MPlace does not require an account.</p>
              </>
            )}
            {message && <p className="account-message" role="status">{message}</p>}
          </div>
        </div>
      </section>

      <footer className="account-footer">
        <span>MPlace ID</span>
        <nav>
          <a href="/safety">Safety</a>
          <a href="https://pages.mplace.cc">Pages</a>
          <a href="https://videos.mplace.cc">MVideo</a>
          <a href="https://study.mplace.cc">MStudy</a>
          <a href="https://ads.mplace.cc">M.Ads</a>
        </nav>
      </footer>
    </main>
  );
}
