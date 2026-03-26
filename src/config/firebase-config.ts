// Firebase Configuration
// Replace these values with your actual Firebase project credentials

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBQ52qRtytldDhc6LEhln1r8fG84mQkdJA",
  authDomain: "fellowgix.firebaseapp.com",
  databaseURL: "https://fellowgix-default-rtdb.firebaseio.com",
  projectId: "fellowgix",
  storageBucket: "fellowgix.firebasestorage.app",
  messagingSenderId: "471325399984",
  appId: "1:471325399984:web:99bbf93fceb2f97c245475",
  measurementId: "G-PV6GTG44R4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
