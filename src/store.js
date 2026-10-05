import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  writeBatch,
} from "firebase/firestore";
import seed from "./seed.json";
import {
  STORAGE_KEY,
  validateRecords,
  publicRecord,
  privateRecord,
} from "./model";
const env = import.meta.env;
export const cloud = Boolean(env.VITE_FIREBASE_PROJECT_ID);
export const ownerUid = env.VITE_ADMIN_UID || "";
let auth, db;
if (cloud) {
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  auth = getAuth(app);
  db = getFirestore(app);
}
export function localLoad() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? validateRecords(JSON.parse(raw)) : seed;
}
export function localSave(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validateRecords(records)));
}
export function watchAuth(fn) {
  return cloud ? onAuthStateChanged(auth, fn) : () => {};
}
export function login() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export function logout() {
  return signOut(auth);
}
export function watchPublic(fn, error) {
  return onSnapshot(
    collection(db, "apps"),
    (s) => fn(s.docs.map((d) => ({ ...d.data(), id: d.id }))),
    error,
  );
}
export function watchPrivate(fn, error) {
  return onSnapshot(
    collection(db, "appPrivate"),
    (s) => fn(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))),
    error,
  );
}
export async function saveCloud(record) {
  const [clean] = validateRecords([record]);
  const batch = writeBatch(db);
  batch.set(doc(db, "apps", clean.id), publicRecord(clean));
  batch.set(doc(db, "appPrivate", clean.id), privateRecord(clean));
  await batch.commit();
}
export async function deleteCloud(id) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "apps", id));
  batch.delete(doc(db, "appPrivate", id));
  await batch.commit();
}
export async function importCloud(records) {
  const clean = validateRecords(records);
  if (clean.length > 200)
    throw new Error("Cloud imports support up to 200 apps per file.");
  const batch = writeBatch(db);
  clean.forEach((r) => {
    batch.set(doc(db, "apps", r.id), publicRecord(r));
    batch.set(doc(db, "appPrivate", r.id), privateRecord(r));
  });
  await batch.commit();
}
export { seed };
