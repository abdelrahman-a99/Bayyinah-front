"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { UserOut } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserOut | null;
  supabaseUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: wait for a given number of milliseconds
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Initial mounting and session checking
  useEffect(() => {
    console.log("AuthProvider: Initializing...");
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.log("AuthProvider: Session retrieved", !!session);

      setSupabaseUser(session?.user ?? null);
      if (session?.user && session?.access_token) {
        fetchAndSetProfile(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log("AuthProvider: Auth event", event);
      setSupabaseUser(session?.user ?? null);

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.access_token) {
        setLoading((prev) => {
          if (!user && !prev) return true;
          return prev;
        });
        await fetchAndSetProfile(session.access_token);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]); // Stable array

  const fetchAndSetProfile = async (accessToken: string, maxRetries = 3) => {
    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`AuthProvider: Fetching profile (attempt ${attempt}/${maxRetries})...`);

          // First try to get existing profile
          try {
            const profile = await api.getMe();
            console.log("AuthProvider: Profile loaded successfully");
            setUser(profile);
            return; // Success! Exit the retry loop
          } catch (e: any) {
            // If 401 or 403, we might need to login/register first with the backend
            if (e.status === 401 || e.status === 403) {
              const { user: newUser } = await api.login(accessToken);
              console.log("AuthProvider: Login successful");
              setUser(newUser);
              return; // Success! Exit the retry loop
            } else {
              throw e; // Network errors, 500s, etc. -> retry
            }
          }
        } catch (error) {
          console.warn(`AuthProvider: Attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            // Wait before retrying (5s, 10s, etc.)
            const delayMs = attempt * 5000;
            console.log(`AuthProvider: Retrying in ${delayMs / 1000}s...`);
            await wait(delayMs);
          } else {
            // All retries exhausted
            console.error("AuthProvider: All retries exhausted. Signing out.");
            setUser(null);
            await supabase.auth.signOut();
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
