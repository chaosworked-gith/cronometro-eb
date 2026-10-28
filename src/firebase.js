import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração web do Firebase. É pública por natureza: quem protege os dados
// são as regras do Firestore (firestore.rules), não o sigilo desta chave.
const firebaseConfig = {
  apiKey: "AIzaSyACVsEytMknHsqfkhP2XFZIkxHyQ1ZEvb8",
  authDomain: "cronometro-eb.firebaseapp.com",
  projectId: "cronometro-eb",
  storageBucket: "cronometro-eb.firebasestorage.app",
  messagingSenderId: "158950300977",
  appId: "1:158950300977:web:5dad21c2f8981ad30c6410"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

auth.languageCode = 'pt-BR';
