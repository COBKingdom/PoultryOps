"use client";

import { useState } from "react";
import { createFeedStock } from "@/lib/feedInventory";

type Props = {
  farmId: string;
};

export default function AddFeedStockForm({
  farmId,
}: Props) {
  const [feedType, setFeedType] =
    useState("Starter");

  const [quantity, setQuantity] =
    useState("");

  const [cost, setCost] =
    useState("");

  const [supplier, setSupplier] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      await createFeedStock({
        farm_id: farmId,
        purchase_date:
          new Date()
            .toISOString()
            .split("T")[0],
        feed_type: feedType,
        quantity_kg:
          Number(quantity),
        cost:
          Number(cost || 0),
        supplier,
      });

      setQuantity("");
      setCost("");
      setSupplier("");

      alert(
        "Feed stock added"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save feed stock"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Add Feed Stock
      </h2>

      <div className="space-y-3">

        <select
          value={feedType}
          onChange={(e) =>
            setFeedType(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        >
          <option>Starter</option>
          <option>Grower</option>
          <option>Finisher</option>
          <option>Layer Mash</option>
        </select>

        <input
          type="number"
          placeholder="Quantity (kg)"
          value={quantity}
          onChange={(e) =>
            setQuantity(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) =>
            setCost(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Supplier"
          value={supplier}
          onChange={(e) =>
            setSupplier(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-slate-900 text-white p-3 rounded"
        >
          {loading
            ? "Saving..."
            : "Add Feed Stock"}
        </button>

      </div>
    </div>
  );
}