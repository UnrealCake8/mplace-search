import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function privateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const key = privateKey();

const credential = projectId && clientEmail && key
  ? cert({ projectId, clientEmail, privateKey: key })
  : applicationDefault();

export const adminApp = getApps()[0] ?? initializeApp({ credential, projectId });
export const adminDb = getFirestore(adminApp);
