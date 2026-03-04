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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Initial mounting and session checking
  useEffect(() => {
    console.log("AuthProvider: Initializing...");
    let mounted = true;

    // Safety timeout: Never stay in loading state for more than 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        setLoading((prev) => {
          if (prev) console.warn("AuthProvider: Safety timeout triggered!");
          return false;
        });
      }
    }, 5000);

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
      clearTimeout(safetyTimeout);
    };
  }, [router]); // Stable array

  // 3. Focus Heartbeat: Re-check on focus
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        setLoading((prev) => {
          if (prev) {
            console.log("AuthProvider: Tab focused, clearing stuck loading state");
            return false;
          }
          return prev;
        });
      }
    };
    document.addEventListener("visibilitychange", handleFocus);
    return () => document.removeEventListener("visibilitychange", handleFocus);
  }, []);

  const fetchAndSetProfile = async (accessToken: string) => {
    try {
      // First try to get existing profile
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (e: any) {
        // If 401 or 403, we might need to login/register first with the backend
        if (e.status === 401 || e.status === 403) {
          const { user: newUser } = await api.login(accessToken);
          setUser(newUser);
        } else {
          throw e; // Other errors
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
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
