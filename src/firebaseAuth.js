// src/firebaseAuth.js
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { app } from "./firebase"; // Assicurati che il percorso corrisponda al tuo firebase.js

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// Login con Google
export const loginWithGoogle = () => signInWithPopup(auth, provider);

// Logout
export const logout = () => signOut(auth);
