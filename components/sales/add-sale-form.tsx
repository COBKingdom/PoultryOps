"use client";

import { useState } from "react";

import { createSale } from "@/lib/sales";

type Props = {
  farmId: string;
};

export default function AddSaleForm({
  farmId,
}: Props) {
  const [itemType, setItemType] =
    useState("Eggs");

  const [quantity, setQuantity] =
    useState("");

  const [unitPrice, setUnitPrice] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      const totalAmount =
        Number(quantity) *
        Number(unitPrice);

      await createSale({
        farm_id: farmId,
        sale_date:
          new Date()
            .toISOString()
            .split("T")[0],
        item_type: itemType,
        quantity:
          Number(quantity),
        unit_price:
          Number(unitPrice),
        total_amount:
          totalAmount,
        notes,
      });

      setQuantity("");
      setUnitPrice("");
      setNotes("");

      alert("Sale saved");

    } catch (error) {
      console.error(error);

      alert(
        "Failed to save sale"
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow">

      <h2 className="font-bold text-lg mb-4">
        Record Sale
      </h2>

      <div className="space-y-3">

        <select
          value={itemType}
          onChange={(e) =>
            setItemType(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        >
          <option>Eggs</option>
          <option>Birds</option>
          <option>Manure</option>
          <option>Other</option>
        </select>

        <input
          type="number"
          placeholder="Quantity"
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
          placeholder="Unit Price"
          value={unitPrice}
          onChange={(e) =>
            setUnitPrice(
              e.target.value
            )
          }
          className="w-full border p-3 rounded"
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(
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
            : "Save Sale"}
        </button>

      </div>
    </div>
  );
}