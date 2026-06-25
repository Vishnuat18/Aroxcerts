import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAw4Qisqi4E5miDqfHC-5ldEZaU6HVRQs",
  authDomain: "arox-73685.firebaseapp.com",
  databaseURL: "https://arox-73685-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "arox-73685",
  storageBucket: "arox-73685.firebasestorage.app",
  messagingSenderId: "608488371783",
  appId: "1:608488371783:web:357b6829033808565be362",
  measurementId: "G-BG7N78YKK3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
