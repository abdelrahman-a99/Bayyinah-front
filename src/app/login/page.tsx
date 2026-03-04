"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // the redirect is handled by supabase OAuth which will take us to /auth/callback
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Islamic pattern decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#islamic-pattern)" className="text-primary" />
        </svg>
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-4 shadow-inner">
            <BookOpenText className="w-12 h-12 rtl-flip" />
          </div>
          <h1 className="text-4xl font-bold font-kufi text-foreground mb-2">قصص الأنبياء</h1>
          <p className="text-muted-foreground text-lg">وكيل ذكاء اصطناعي للإجابة عن أسئلتك</p>
        </div>

        <Card className="glass-card border-none shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-kufi">تسجيل الدخول</CardTitle>
            <CardDescription className="text-base">
              للمتابعة وحفظ محادثاتك، قم بتسجيل الدخول
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {error && (
              <div className="p-3 mb-4 rounded-md bg-destructive/10 text-destructive text-sm text-center font-medium">
                {error}
              </div>
            )}

            <Button
              className="w-full text-lg h-12 shadow-md hover:shadow-lg transition-all"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin rtl-flip" />
              ) : (
                <svg
                  className="mr-2 -ml-1 w-5 h-5 ml-2 mr-0"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
              )}
              المتابعة باستخدام Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
