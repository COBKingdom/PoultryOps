"use client";

import { useState } from "react";

import { createSale } from "@/lib/sales";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  onSaved?: () => Promise<void> | void;
};

export default function AddSaleForm({
  farmId,
  onSaved,
}: Props) {
  const [itemType, setItemType] =
    useState("Egg Sales");

  const [quantity, setQuantity] =
    useState("");

  const [unitPrice, setUnitPrice] =
    useState("");

  const [notes, setNotes] =
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

      const totalAmount =
        Number(quantity) *
        Number(unitPrice);

      await createSale({
        farm_id: farmId,
        sale_date:
          recordDate,
        item_type: itemType,
        quantity:
          Number(quantity),
        unit_price:
          Number(unitPrice),
        total_amount:
          totalAmount,
        notes,
      });
      await onSaved?.();

      setQuantity("");
      setUnitPrice("");
      setNotes("");

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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold mb-6">
        Record Sale
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >

        <input
          type="date"
          value={recordDate}
          onChange={(e) =>
            setRecordDate(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
        />

        <select
          value={itemType}
          onChange={(e) =>
            setItemType(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        >
          <option>
            Egg Sales
          </option>

          <option>
            Live Bird Sales
          </option>

          <option>
            Spent Layer Sales
          </option>

          <option>
            Broiler Sales
          </option>

          <option>
            Cockerel Sales
          </option>

          <option>
            Manure Sales
          </option>

          <option>
            Feed Sales
          </option>

          <option>
            Equipment Sales
          </option>

          <option>
            Other Income
          </option>
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
          className="w-full border rounded-xl p-4"
          required
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
          className="w-full border rounded-xl p-4"
          required
        />

        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
        />

        <SaveButton
          loading={loading}
          success={success}
          label="Save Sale"
        />

      </form>

    </div>
  );
}