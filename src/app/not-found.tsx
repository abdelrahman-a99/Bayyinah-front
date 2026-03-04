"use client";

import Link from "next/link";
import { MoveRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <div className="relative text-center space-y-8 max-w-md w-full">
        {/* Animated Background Element */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />

        {/* Large 404 Text */}
        <div className="relative">
          <h1 className="text-9xl font-bold tracking-tighter text-primary/10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              تِهتَ في الطريق؟
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">الصفحة غير موجودة</h2>
          <p className="text-muted-foreground leading-relaxed">
            يبدو أنك انتقلت إلى مكان لم يكتب فيه أي تاريخ بعد. لا تقلق، يمكنك العودة إلى البواب الرئيسية والبدء من جديد.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
          <Button asChild size="lg" className="rounded-full px-8 gap-2 group">
            <Link href="/">
              <Home className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Link>
          </Button>

          {/* <Link
            href="/"
            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2 group"
          >
            <span>تصفح القصص</span>
            <MoveRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link> */}
        </div>

        {/* Decorative Grid Pattern */}
        <div className="pt-12 opacity-10">
          <div className="grid grid-cols-4 gap-4 max-w-[200px] mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded shadow-inner bg-primary" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
