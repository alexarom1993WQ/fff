import { Routes, Route, Navigate } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import Home from "./components/home";
import LoginPage from "./components/auth/LoginPage";
import PaymentsPage from "./components/payments/PaymentsPage";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check Supabase session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session?.user && !error) {
          console.log("User authenticated via Supabase session");
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Fallback to localStorage check
        const user = localStorage.getItem("user");
        if (user) {
          try {
            const userData = JSON.parse(user);
            if (userData.loggedIn === true && userData.loginTime) {
              // Check if login is not too old (24 hours)
              const loginTime = new Date(userData.loginTime);
              const now = new Date();
              const hoursDiff =
                (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

              if (hoursDiff < 24) {
                setIsAuthenticated(true);
              } else {
                // Login expired, clear storage
                localStorage.removeItem("user");
                localStorage.removeItem("loginSuccess");
                await supabase.auth.signOut();
                setIsAuthenticated(false);
              }
            } else {
              setIsAuthenticated(false);
            }
          } catch {
            localStorage.removeItem("user");
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("user");
        localStorage.removeItem("loginSuccess");
        setIsAuthenticated(false);
      } else if (event === "SIGNED_IN" && session?.user) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-t-transparent border-yellow-500 animate-spin mx-auto"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 animate-pulse"></div>
            </div>
          </div>
          <p className="text-white text-lg font-medium">جاري التحميل...</p>
          <p className="text-gray-400 text-sm mt-2">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* For the tempo routes */}
      {import.meta.env.VITE_TEMPO && useRoutes(routes)}

      <Routes>
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* Add this before the catchall route */}
        {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}

        {/* Redirect root based on auth status */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
