"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CustomerBalance,
  createCustomer,
  getCustomers,
  CustomerInput,
} from "@/lib/customers";

export function useCustomers(farmId?: string) {
  const [records, setRecords] = useState<CustomerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!farmId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getCustomers(farmId);

      setRecords(result);
    } catch (err) {
      console.error("Failed to load customers:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    records,
    loading,
    error,
    refresh,
  };
}

export function useCreateCustomer() {
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (farmId: string, input: CustomerInput) => {
      try {
        setSaving(true);

        return await createCustomer(farmId, input);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    save,
    saving,
  };
}