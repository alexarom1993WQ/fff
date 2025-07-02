import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { LogIn, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is already authenticated and handle OAuth callback
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Handle OAuth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth error:", error);
          setError("حدث خطأ في المصادقة. يرجى المحاولة مرة أخرى.");
          return;
        }

        if (data?.session?.user) {
          console.log("User authenticated successfully");

          // Store user data in localStorage for compatibility
          const userData = {
            loggedIn: true,
            loginTime: new Date().toISOString(),
            user: data.session.user,
          };
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("loginSuccess", "true");

          // Navigate to home
          navigate("/home", { replace: true });
          return;
        }

        // Clear any stale localStorage data if no session
        localStorage.removeItem("user");
        localStorage.removeItem("loginSuccess");
      } catch (error) {
        console.error("Error checking authentication:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("loginSuccess");
        setError("حدث خطأ في التحقق من المصادقة.");
      }
    };

    checkExistingAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in successfully");

        // Store user data in localStorage
        const userData = {
          loggedIn: true,
          loginTime: new Date().toISOString(),
          user: session.user,
        };
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("loginSuccess", "true");

        // Navigate to home
        navigate("/home", { replace: true });
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("user");
        localStorage.removeItem("loginSuccess");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      setSuccess("جاري تسجيل الدخول...");

      // Use Supabase's built-in Google OAuth with proper redirect handling
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw new Error(`فشل في تسجيل الدخول: ${error.message}`);
      }

      // The redirect will happen automatically to the OAuth provider
      setSuccess("جاري إعادة التوجيه...");
    } catch (error: any) {
      console.error("Login failed:", error);
      setError(error.message || "فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-1/2 left-20 w-16 h-16 bg-purple-400/20 rounded-full blur-xl animate-bounce delay-1000"></div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-6">
            <img
              src="/yacin-gym-logo.png"
              alt="Yacin Gym Logo"
              className="h-24 w-24 rounded-full shadow-lg border-2 border-yellow-400 object-cover mx-auto"
            />
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Shield className="h-3 w-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Yacin Gym</h1>
          <p className="text-muted-foreground text-sm">
            نظام إدارة الصالة الرياضية
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-card/95 backdrop-blur-sm border-border shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-card-foreground">
                  مرحباً بك
                </h2>
                <p className="text-muted-foreground text-sm">
                  سجل دخولك باستخدام حساب جوجل للوصول إلى لوحة التحكم
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3"
                >
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p className="text-green-400 text-sm font-medium">
                    {success}
                  </p>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {/* Google Login Button */}
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 font-semibold border border-gray-300 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>تسجيل الدخول بحساب جوجل</span>
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  بتسجيل الدخول، أنت توافق على شروط الخدمة وسياسة الخصوصية
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
