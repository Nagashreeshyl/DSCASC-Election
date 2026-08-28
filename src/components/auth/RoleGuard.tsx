"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { UserRole } from "@/lib/types";
import { LoadingScreen } from "@/components/ui/loading";

export function RoleGuard({
  allow,
  children
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const { fbUser, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!fbUser) {
      router.replace("/login");
      return;
    }
    if (!userDoc || !allow.includes(userDoc.role)) {
      router.replace("/dashboard");
    }
  }, [loading, fbUser, userDoc, allow, router]);

  if (loading || !fbUser || !userDoc || !allow.includes(userDoc.role)) {
    return <LoadingScreen label="Verifying access…" />;
  }
  return <>{children}</>;
}
