"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";

const DEMO_BLOCKED_PREFIXES = [
  "/settings",
  "/team",
  "/migration",
  "/admin",
  "/setup",
];

function isBlockedDemoRoute(pathname: string) {
  return DEMO_BLOCKED_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );
}

export default function DemoRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useAuth();
  const { farm, loading } = useCurrentFarm();

  const isDemoMode =
    Boolean(user) &&
    !loading &&
    farm?.farm_code === "DEMO-001";

  useEffect(() => {
    if (
      isDemoMode &&
      isBlockedDemoRoute(pathname)
    ) {
      router.replace("/dashboard");
    }
  }, [
    isDemoMode,
    pathname,
    router,
  ]);

  return <>{children}</>;
}