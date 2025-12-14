import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export const auth = getAuth();
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Errore login:", error);
  }
};

export const logout = async () => {
  await signOut(auth);
};
