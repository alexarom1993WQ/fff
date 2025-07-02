import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper function to ensure user is authenticated
export const requireAuth = async (): Promise<string> => {
  // First try to get from Supabase auth
  const userId = await getCurrentUserId();
  if (userId) {
    return userId;
  }

  // Fallback: try to get from localStorage (for Google OAuth)
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.sub || parsedUser.id) {
        return parsedUser.sub || parsedUser.id;
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
  }

  throw new Error("User not authenticated");
};
