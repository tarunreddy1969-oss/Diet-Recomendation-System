import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
	if (!getApps().length) {
		return initializeApp(firebaseConfig);
	}
	return getApp();
}

export function getAuthInstance() {
	if (typeof window === 'undefined') throw new Error('Auth must be initialized in the browser');
	return getAuth(getFirebaseApp());
}

export function getFirestoreInstance() {
	if (typeof window === 'undefined') throw new Error('Firestore must be initialized in the browser');
	return getFirestore(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();

