import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

// Analytics only in browser environments (not SSR/test)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;
