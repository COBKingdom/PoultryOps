"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Farm {
  id: string;
  name: string;
  [key: string]: any;
}

interface UseCurrentFarmResult {
  farm: Farm | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useCurrentFarm(): UseCurrentFarmResult {
  const { user, profile } = useAuth();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function loadFarm() {
    if (!user || !profile?.farm_id) {
      setFarm(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { data: farm, error } = await supabase
        .from("farms")
        .select("*")
        .eq("id", profile.farm_id)
        .single();

      if (error) {
        throw error;
      }

      setFarm(farm);
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to load farm");

      setError(error);
      console.error("Error loading farm:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFarm();
  }, [user, profile]);

  return {
    farm,
    loading,
    error,
    retry: loadFarm,
  };
}