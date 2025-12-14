// src/firebaseAuth.js
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { app } from "./firebase"; // importa l'app da firebase.js

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// Login con Google
export const loginWithGoogle = () => signInWithPopup(auth, provider);

// Logout
export const logout = () => signOut(auth);
