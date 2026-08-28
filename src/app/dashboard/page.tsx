"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  candidate: "/candidate",
  student: "/student"
};

export default function DashboardRedirect() {
  const { fbUser, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!fbUser) {
      router.replace("/login");
      return;
    }
    if (userDoc) {
      router.replace(ROLE_HOME[userDoc.role] || "/login");
    }
  }, [loading, fbUser, userDoc, router]);

  return <LoadingScreen label="Routing to your dashboard…" />;
}
