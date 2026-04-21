import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDg9eT7FDpi8iEt6jl9cicidJfXR-LlQHc",
  authDomain: "pixshard.firebaseapp.com",
  projectId: "pixshard",
  storageBucket: "pixshard.firebasestorage.app",
  messagingSenderId: "904323960275",
  appId: "1:904323960275:web:9728b0332573c5f202f326",
  measurementId: "G-KV9GYCL4H5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google provider — client ID ties to your Google Cloud OAuth credential
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  client_id: '904323960275-6j9japitl3pj74j8ia1gp154dqo0r434.apps.googleusercontent.com',
  prompt: 'select_account',   // always show account chooser
});

// Analytics only in browser environments (not SSR/test)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;
