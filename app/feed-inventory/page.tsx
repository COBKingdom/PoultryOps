"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useFeedInventory } from "@/hooks/useFeedInventory";
import { useFeed } from "@/hooks/useFeed";

import AddFeedStockForm from "@/components/feed-inventory/add-feed-stock-form";
import FeedStockList from "@/components/feed-inventory/feed-stock-list";
import FeedStockSummary from "@/components/feed-inventory/feed-stock-summary";

export default function FeedInventoryPage() {
  const {
    data,
    loading,
  } = useDashboard();

  const farmId =
    data?.farm?.id;

  const {
    records:
      inventoryRecords,
  } = useFeedInventory(
    farmId
  );

  const {
    records:
      feedRecords,
  } = useFeed(
    farmId
  );

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
        Feed Inventory
      </h1>

      <FeedStockSummary
        inventoryRecords={
          inventoryRecords
        }
        feedRecords={
          feedRecords
        }
      />

      <FeedStockList
        records={
          inventoryRecords
        }
      />

      <AddFeedStockForm
        farmId={farmId}
      />

    </div>
  );
}