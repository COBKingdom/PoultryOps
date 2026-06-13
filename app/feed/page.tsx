"use client";

import {
  useEffect,
  useState,
} from "react";

import { useDashboard } from "@/hooks/useDashboard";
import { useFeed } from "@/hooks/useFeed";

import { getFarmFlocks } from "@/lib/flocks";

import AddFeedForm from "@/components/feed/add-feed-form";
import FeedList from "@/components/feed/feed-list";
import FeedSummary from "@/components/feed/feed-summary";

export default function FeedPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const [flocks, setFlocks] =
    useState<any[]>([]);

  const {
    records,
  } = useFeed(
    farmId
  );

  useEffect(() => {
    async function load() {
      if (!farmId) return;

      const result =
        await getFarmFlocks(
          farmId
        );

      setFlocks(result);
    }

    load();
  }, [farmId]);

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Feed Management
      </h1>

      <FeedSummary
        records={records}
      />

      <FeedList
        records={records}
      />

      <AddFeedForm
        farmId={farmId}
        flocks={flocks}
      />

    </div>
  );
}