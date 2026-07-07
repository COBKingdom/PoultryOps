"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getFarmUsers,
} from "@/lib/core/users";

export function useUsers(
  farmId?: string
) {
  const [users, setUsers] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function refresh() {
    try {
      if (!farmId) {
        setLoading(false);
        return;
      }

      const result =
        await getFarmUsers(
          farmId
        );

      console.log(
        "Users Result:",
        result
      );

      setUsers(result ?? []);

    } catch (error: any) {
      console.error(
        "useUsers Error:",
        error
      );

      console.error(
        "Error Message:",
        error?.message
      );

      console.error(
        "Error Details:",
        error?.details
      );

      console.error(
        "Error Hint:",
        error?.hint
      );

      setUsers([]);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [farmId]);

  return {
    users,
    loading,
    refresh,
  };
}