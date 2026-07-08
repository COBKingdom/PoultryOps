"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

type Props = {
  children: ReactNode;
};

export default function OwnerOnly({
  children,
}: Props) {
  const router = useRouter();

  const {
    loading,
    profile,
  } = useAuth();

  useEffect(() => {
    if (
      !loading &&
      profile &&
      profile.role !== "owner"
    ) {
      router.replace("/flocks");
    }
  }, [
    loading,
    profile,
    router,
  ]);

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (
    profile &&
    profile.role !== "owner"
  ) {
    return null;
  }

  return <>{children}</>;
}