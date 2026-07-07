"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { useDashboard } from "@/hooks/useDashboard";

import { getUserRole } from "@/lib/core/access";

export function useAccess() {
  const { user } =
    useAuth();

  const {
    data,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const [role, setRole] =
    useState<string | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (
          !farmId ||
          !user?.id
        ) {
          return;
        }

        const result =
          await getUserRole(
            farmId,
            user.id
          );

        setRole(result);

      } catch (error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    farmId,
    user?.id,
  ]);

  return {
    role,
    loading,
    farmId,
  };
}