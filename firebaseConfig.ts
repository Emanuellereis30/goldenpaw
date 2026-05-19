import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAhxzuxoasUlzXk0otfQzD2cSZDHfN7ZhY",
  authDomain: "petshop-2c06a.firebaseapp.com",
  projectId: "petshop-2c06a",
  storageBucket: "petshop-2c06a.firebasestorage.app",
  messagingSenderId: "885146825109",
  appId: "1:885146825109:web:0f0aa767b528d55cce469c",
  measurementId: "G-LDW3TR86V7",
};

// Inicializa o Firebase apenas uma vez
const app = initializeApp(firebaseConfig);

// Exporta os serviços para usar no restante do app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
