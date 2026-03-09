"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { api, setApiAccessToken } from "@/lib/api";
import { UserOut } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserOut | null;
  supabaseUser: User | null;
  loading: boolean;
  backendUnavailable: boolean;
  backendMessage: string | null;
  retryBackendConnection: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: wait for a given number of milliseconds
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ErrorWithStatus = {
  status?: number;
  message?: string;
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === "object" && error !== null && "status" in error) {
    return (error as ErrorWithStatus).status;
  }
  return undefined;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const userRef = useRef<UserOut | null>(null);
  const isFetchingProfileRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchAndSetProfile = useCallback(
    async (
      accessToken: string,
      options?: {
        silent?: boolean;
        maxRetries?: number;
      }
    ) => {
      const { silent = false, maxRetries = 2 } = options ?? {};

      if (isFetchingProfileRef.current) return;

      isFetchingProfileRef.current = true;
      setApiAccessToken(accessToken);

      if (!silent) {
        setLoading(true);
      }

      let lastError: unknown = null;

      try {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const profile = await api.getMe(accessToken);
            if (!mountedRef.current) return;
            setBackendUnavailable(false);
            setBackendMessage(null);
            setUser(profile);
            return;
          } catch (error: unknown) {
            lastError = error;

            const status = getErrorStatus(error);

            if (status === 401 || status === 403) {
              const { user: backendUser } = await api.login(accessToken);
              if (!mountedRef.current) return;
              setBackendUnavailable(false);
              setBackendMessage(null);
              setUser(backendUser);
              return;
            }

            if (attempt < maxRetries) {
              await wait(attempt * 750);
              continue;
            }
          }
        }

        throw lastError;
      } catch (error: unknown) {
        console.error("AuthProvider: failed to load backend profile", error);

        const status = getErrorStatus(error);

        if ((status === 401 || status === 403) && mountedRef.current) {
          setUser(null);
          setApiAccessToken(null);
          setBackendUnavailable(false);
          setBackendMessage(null);
          await supabase.auth.signOut();
          return;
        }

        if (mountedRef.current) {
          setBackendUnavailable(true);
          setBackendMessage(
            "نعتذر عن الإزعاج. الخادم غير متاح حالياً. يرجى إعادة المحاولة بعد قليل، وإذا استمرت المشكلة نأمل العودة لاحقاً."
          );
        }
      } finally {
        isFetchingProfileRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const retryBackendConnection = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    await fetchAndSetProfile(session.access_token, {
      silent: false,
      maxRetries: 1,
    });
  };

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      console.log("AuthProvider: Initializing...");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mountedRef.current) return;

      setSupabaseUser(session?.user ?? null);
      setApiAccessToken(session?.access_token ?? null);

      if (session?.access_token) {
        await fetchAndSetProfile(session.access_token);
      } else {
        setLoading(false);
      }
    };

    void initialize();

    
    // 2. Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      console.log("AuthProvider: Auth event", event);
      setSupabaseUser(session?.user ?? null);
      setApiAccessToken(session?.access_token ?? null);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        router.replace("/login");
        return;
      }

      if (!session?.access_token) {
        return;
      }

      if (event === "SIGNED_IN") {
        await fetchAndSetProfile(session.access_token);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        if (!userRef.current) {
          await fetchAndSetProfile(session.access_token, { silent: true, maxRetries: 1 });
        }
        return;
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetProfile, router]);

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
      setApiAccessToken(null);
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
        backendUnavailable,
        backendMessage,
        retryBackendConnection,
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
