// Importa solo quello che serve
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// La tua configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBcICNy1K_3cC0KXqdMv1L3c4ual4qArM0",
  authDomain: "mealplanner-36e6c.firebaseapp.com",
  projectId: "mealplanner-36e6c",
  storageBucket: "mealplanner-36e6c.firebasestorage.app",
  messagingSenderId: "358262517866",
  appId: "1:358262517866:web:aa717cd1f3a33c09499a13"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta il database Firestore
export const db = getFirestore(app);
