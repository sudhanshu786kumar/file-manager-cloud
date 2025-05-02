import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD7rahh7ezfanXE91TyqNukPNzhaBiowL0",
  authDomain: "file-upload-app-b22b6.firebaseapp.com",
  projectId: "file-upload-app-b22b6",
  storageBucket: "file-upload-app-b22b6.firebasestorage.app",
  messagingSenderId: "426438192786",
  appId: "1:426438192786:web:ce1964ea6e7f39808e404b",
  measurementId: "G-BC8FN0B4BY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Log initialization
console.log('Firebase initialized:', app.name);
console.log('Firestore initialized:', db);

export { auth, db }; 