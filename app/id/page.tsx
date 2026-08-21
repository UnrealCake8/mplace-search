"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase/client";
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

  async function google() {
    setBusy(true);
    setMessage("");
    try {
      const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      await finish(credential.user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign in failed.");
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
    <main className="identity-page">
      <a href="/" className="identity-brand"><MPlaceBrand product="ID" /></a>
      <section className="identity-card">
        {user ? (
          <>
            <p className="eyebrow">MPlace ID</p>
            <h1>You're signed in.</h1>
            <p className="notice">{user.displayName || user.email || "MPlace member"}</p>
            <div className="identity-actions">
              <a className="primary-link" href="/business/add">Add a business</a>
              <a className="secondary-link" href="/submit">Add a website</a>
              <button className="secondary-button" onClick={logout}>Sign out</button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">One account for MPlace</p>
            <h1>{mode === "signin" ? "Sign in" : "Create your MPlace ID"}</h1>
            <p className="notice">Use MPlace ID to manage websites, businesses and future MPlace services. Searching stays account-free.</p>
            <button className="google-button" disabled={busy} onClick={google}>Continue with Google</button>
            <div className="form-divider"><span>or</span></div>
            <form className="stack" onSubmit={submit}>
              <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label>
              <button className="primary" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create ID"}</button>
            </form>
            <button className="text-button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "New to MPlace? Create an ID" : "Already have an ID? Sign in"}</button>
          </>
        )}
        {message && <p className="notice" role="status">{message}</p>}
      </section>
    </main>
  );
}
