"use client";

import { useEffect, useState } from "react";

import { createSale } from "@/lib/sales";

import SaveButton from "@/components/ui/save-button";

type Props = {
  farmId: string;
  flocks: any[];
  onSaved?: () => Promise<void> | void;
};

type SaleCategory =
  | "Bird Sales"
  | "Egg Sales"
  | "Other Sales";

const BIRD_SALE_TYPES = [
  "Live Bird Sales",
  "Spent Layer Sales",
  "Broiler Sales",
  "Cockerel Sales",
];

const EGG_SALE_TYPES = [
  "Egg Sales",
];

const OTHER_SALE_TYPES = [
  "Manure Sales",
  "Feed Sales",
  "Equipment Sales",
  "Other Income",
];

export default function AddSaleForm({
  farmId,
  flocks,
  onSaved,
}: Props) {
  const [saleCategory, setSaleCategory] =
    useState<SaleCategory>("Egg Sales");

  const [itemType, setItemType] =
    useState("Egg Sales");

  const [flockId, setFlockId] =
    useState("");

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

  /*
   * Keep the item type aligned with the selected category.
   *
   * This prevents a situation where, for example,
   * "Egg Sales" is selected while the category says
   * "Bird Sales".
   */
  useEffect(() => {
    if (saleCategory === "Bird Sales") {
      setItemType(
        BIRD_SALE_TYPES[0]
      );
      return;
    }

    if (saleCategory === "Egg Sales") {
      setItemType(
        EGG_SALE_TYPES[0]
      );
      return;
    }

    setItemType(
      OTHER_SALE_TYPES[0]
    );
  }, [saleCategory]);

  /*
   * Bird and Egg sales must be associated with a flock.
   * Other sales do not require one.
   */
  const requiresFlock =
    saleCategory === "Bird Sales" ||
    saleCategory === "Egg Sales";

  function handleCategoryChange(
    category: SaleCategory
  ) {
    setSaleCategory(category);

    /*
     * If switching to Other Sales,
     * remove any previous flock selection.
     */
    if (category === "Other Sales") {
      setFlockId("");
    }
  }

  async function handleSave() {
    /*
     * A flock is required for Bird and Egg sales.
     */
    if (
      requiresFlock &&
      !flockId
    ) {
      alert(
        "Please select a flock for this sale."
      );
      return;
    }

    try {
      setLoading(true);

      const totalAmount =
        Number(quantity) *
        Number(unitPrice);

      await createSale({
        farm_id: farmId,

        /*
         * Store the flock relationship only
         * when the sale belongs to a flock.
         */
        flock_id:
          requiresFlock
            ? flockId
            : null,

        /*
         * Store the broad category separately
         * from the specific sale type.
         */
        sale_category:
          saleCategory,

        sale_date:
          recordDate,

        item_type:
          itemType,

        quantity:
          Number(quantity),

        unit_price:
          Number(unitPrice),

        total_amount:
          totalAmount,

        notes,
      });

      await onSaved?.();

      setFlockId("");
      setQuantity("");
      setUnitPrice("");
      setNotes("");

      /*
       * Keep the selected category after saving.
       * This makes repeated entry much faster.
       */
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(
        "Failed to save sale:",
        error
      );

      alert(
        "Unable to save the sale. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  /*
   * Determine which sale types should be displayed.
   */
  const saleTypes =
    saleCategory === "Bird Sales"
      ? BIRD_SALE_TYPES
      : saleCategory === "Egg Sales"
        ? EGG_SALE_TYPES
        : OTHER_SALE_TYPES;

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

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* DATE */}
        {/* ─────────────────────────────────────────────────────────────── */}

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

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* SALE CATEGORY */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <select
          value={saleCategory}
          onChange={(e) =>
            handleCategoryChange(
              e.target.value as SaleCategory
            )
          }
          className="w-full border rounded-xl p-4"
          required
        >
          <option value="Bird Sales">
            Bird Sales
          </option>

          <option value="Egg Sales">
            Egg Sales
          </option>

          <option value="Other Sales">
            Other Sales
          </option>
        </select>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* FLOCK */}
        {/* Only displayed for Bird and Egg Sales */}
        {/* ─────────────────────────────────────────────────────────────── */}

        {requiresFlock && (
          <select
            value={flockId}
            onChange={(e) =>
              setFlockId(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-4"
            required
          >
            <option value="">
              Select Flock
            </option>

            {flocks.map(
              (flock: any) => (
                <option
                  key={flock.id}
                  value={flock.id}
                >
                  {flock.flock_name}
                </option>
              )
            )}
          </select>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* SALE TYPE */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <select
          value={itemType}
          onChange={(e) =>
            setItemType(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-4"
          required
        >
          {saleTypes.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            )
          )}
        </select>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* QUANTITY */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <input
          type="number"
          min="0"
          step="any"
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

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* UNIT PRICE */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <input
          type="number"
          min="0"
          step="any"
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

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* NOTES */}
        {/* ─────────────────────────────────────────────────────────────── */}

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

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* SAVE */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <SaveButton
          loading={loading}
          success={success}
          label="Save Sale"
        />

      </form>

    </div>
  );
}