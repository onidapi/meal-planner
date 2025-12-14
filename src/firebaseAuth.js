import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

export const auth = getAuth();
const provider = new GoogleAuthProvider();

// Login con redirect
export const loginWithGoogle = async () => {
  await signInWithRedirect(auth, provider);
};

// Logout
export const logout = async () => {
  await signOut(auth);
};

// Recupera l'utente dopo il redirect
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user; // utente loggato
    }
  } catch (error) {
    console.error("Errore login redirect:", error);
  }
};
