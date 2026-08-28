import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  type Auth
} from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(a: Auth = auth) {
  const result = await signInWithPopup(a, provider);
  return result.user;
}

export async function signOut(a: Auth = auth) {
  await fbSignOut(a);
}
