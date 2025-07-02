import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

const basename = import.meta.env.BASE_URL;

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// Create a context for network status
export const NetworkStatusContext = React.createContext({
  isOnline: navigator.onLine,
});

// Get Google Client ID from environment
const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "334886615040-5kh7sc73t127babo3pperopb5ui0sb4c.apps.googleusercontent.com";

// Force the client ID to be available
if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.log("Using fallback Google Client ID");
}

// Log configuration status for debugging
console.log("Google OAuth Configuration:", {
  clientIdPresent: !!googleClientId,
  clientIdLength: googleClientId?.length || 0,
});

// Validate Google Client ID
if (!googleClientId) {
  console.error("⚠️ VITE_GOOGLE_CLIENT_ID environment variable is missing!");
  console.error(
    "Please set the Google OAuth Client ID in your environment variables.",
  );
}

const AppContent = () => (
  <NetworkStatusContext.Provider value={{ isOnline: navigator.onLine }}>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </NetworkStatusContext.Provider>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppContent />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
