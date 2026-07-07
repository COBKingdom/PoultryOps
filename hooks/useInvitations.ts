"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getPendingInvitations,
} from "@/lib/core/users";

export function useInvitations(
  farmId?: string
) {
  const [
    invitations,
    setInvitations,
  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  async function refresh() {
    try {
      if (!farmId) {
        setInvitations([]);
        return;
      }

      const result =
        await getPendingInvitations(
          farmId
        );

      setInvitations(
        result ?? []
      );

    } catch (error) {
      console.error(
        "Invitations Error:",
        error
      );

      setInvitations([]);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [farmId]);

  return {
    invitations,
    loading,
    refresh,
  };
}