// Centralized Firebase config and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDzE1eNH7x-4vYR4-bdKsV13E30x-5BsQ",
  authDomain: "chick-ko-bkk.firebaseapp.com",
  projectId: "chick-ko-bkk",
  storageBucket: "chick-ko-bkk.firebasestorage.app",
  messagingSenderId: "581157913930",
  appId: "1:581157913930:web:90365f413c1ab884612db3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
