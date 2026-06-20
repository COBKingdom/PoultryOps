"use client";

import { useState } from "react";

import {
  createFeedStock,
} from "@/lib/feedInventory";

import SaveButton from "@/components/ui/save-button";

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

  const [recordDate, setRecordDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      await createFeedStock({
        farm_id: farmId,
        purchase_date:
          recordDate,
        feed_type:
          feedType,
        quantity_kg:
          Number(quantity),
        cost:
          Number(cost || 0),
        supplier,
      });

      setQuantity("");
      setCost("");
      setSupplier("");

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-2">
        Add Feed Stock
      </h2>

      <p className="text-sm text-slate-500 mb-4">
        Feed purchases should be recorded here rather than under Expenses.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-3"
      >

        <input
          type="date"
          value={recordDate}
          onChange={(e) =>
            setRecordDate(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
          required
        />

        <select
          value={feedType}
          onChange={(e) =>
            setFeedType(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        >
          <option>
            Starter
          </option>

          <option>
            Grower
          </option>

          <option>
            Finisher
          </option>

          <option>
            Layer Mash
          </option>
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
          required
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

        <SaveButton
          loading={loading}
          success={success}
          label="Add Feed Stock"
        />

      </form>

    </div>
  );
}