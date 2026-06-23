import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBvJuEq70b1JGqC83YFJy_4780B24S0bM",
  authDomain: "arox-48513.firebaseapp.com",
  projectId: "arox-48513",
  storageBucket: "arox-48513.firebasestorage.app",
  messagingSenderId: "317254519087",
  appId: "1:317254519087:web:8d0478c26094cc470739da"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
