import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || "AIzaSyCyd7weGx7f1JwEY6UZLBQtgU6zqMiUi9U";
const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || "promptease-ai";
const appId = (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) || "1:253452403596:web:7a9c8147d7bd338d684ca9";

if (!apiKey || apiKey === "dummy-key") {
  // eslint-disable-next-line no-console
  console.error(
    "Firebase config missing. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID.",
  );
}



const firebaseConfig = {
  apiKey: apiKey ?? "",
  authDomain: `${projectId ?? ""}.firebaseapp.com`,
  projectId: projectId ?? "",
  storageBucket: `${projectId ?? ""}.appspot.com`,
  appId: appId ?? "",
};

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
