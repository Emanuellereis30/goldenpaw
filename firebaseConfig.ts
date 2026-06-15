import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAhxzuxoasUlzXk0otfQzD2cSZDHfN7ZhY",
  authDomain: "petshop-2c06a.firebaseapp.com",
  projectId: "petshop-2c06a",
  storageBucket: "petshop-2c06a.firebasestorage.app",
  messagingSenderId: "885146825109",
  appId: "1:885146825109:web:0f0aa767b528d55cce469c",
  measurementId: "G-LDW3TR86V7",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Auth com persistência usando AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Exporta os serviços
export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);