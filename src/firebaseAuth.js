// src/firebaseAuth.js
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBcICNy1K_3cC0KXqdMv1L3c4ual4qArM0",
  authDomain: "mealplanner-36e6c.firebaseapp.com",
  projectId: "mealplanner-36e6c",
  storageBucket: "mealplanner-36e6c.firebasestorage.app",
  messagingSenderId: "358262517866",
  appId: "1:358262517866:web:aa717cd1f3a33c09499a13"
};

// Inizializza Firebase per Auth
const app = initializeApp(firebaseConfig, "auth-app");

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    console.log("🔐 Inizio login con Google...");
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("❌ Errore durante il login:", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("❌ Errore durante il logout:", error);
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("✅ Login riuscito:", result.user.email);
      return result.user;
    }
  } catch (error) {
    console.error("❌ Errore login redirect:", error);
  }
  return null;
};