import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB-_FK2uIsUyJJzDY8h6dj8tbbo6qPlhzA',
  authDomain: 'cubo-app-cac-data.firebaseapp.com',
  projectId: 'cubo-app-cac-data',
  storageBucket: 'cubo-app-cac-data.firebasestorage.app',
  messagingSenderId: '45860187593',
  appId: '1:45860187593:web:4a2721f94a51744df48c18',
};

export const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
