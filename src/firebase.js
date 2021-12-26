import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/auth";
import { getAuth } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6ehdE0lptO70rfZrWUJeDrmsQHN7JyOs",
  authDomain: "qr-at-webapp.firebaseapp.com",
  projectId: "qr-at-webapp",
  storageBucket: "qr-at-webapp.appspot.com",
  messagingSenderId: "503604904340",
  appId: "1:503604904340:web:ac333969cd7e2fce060f81",
  measurementId: "G-YZ6CTGWWZF",
};

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore();

export { analytics, auth, db };
