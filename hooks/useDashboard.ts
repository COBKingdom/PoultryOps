"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { getDashboardData } from "@/lib/dashboard";

export function useDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!user) return;

        const result =
          await getDashboardData(
            user.id
          );

        setData(result);

      } catch (error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  return {
    loading,
    data,
  };
}