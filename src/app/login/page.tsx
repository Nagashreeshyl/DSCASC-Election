"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { signInWithGoogle } from "@/lib/services/authService";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";

export default function LoginPage() {
  const { fbUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && fbUser) router.replace("/dashboard");
  }, [loading, fbUser, router]);

  async function handleLogin() {
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (e) {
      alert("Google sign-in failed. Please try again.");
    }
  }

  if (loading) return <LoadingScreen label="Loading…" />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-yellow px-4" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.10) 2px, transparent 2px)", backgroundSize: "32px 32px" }}>
      <div className="w-full max-w-md rounded-xl border-2 border-black bg-white p-8 shadow-brutal-xl">
        <div className="mb-6 flex justify-center">
          <Logo className="scale-125" />
        </div>
        <h1 className="text-center font-heading text-3xl font-extrabold tracking-tight">
          Sign in to vote
        </h1>
        <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
          Authentication is Google-only and secured by Firebase. Your role is assigned automatically.
        </p>
        <Button onClick={handleLogin} className="mt-8 w-full bg-black text-white" size="lg">
          <span className="font-heading text-lg font-extrabold">G</span> Continue with Google
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to participate fairly under the election guidelines.
        </p>
      </div>
    </main>
  );
}
