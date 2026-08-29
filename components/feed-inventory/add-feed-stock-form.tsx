"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  createFeedStock,
} from "@/lib/feedInventory";

import SaveButton from "@/components/ui/save-button";

import {
  Calculator,
  User,
} from "lucide-react";

type Props = {
  farmId?: string;
  user?: any;
  onSaved?: () =>
    Promise<void> | void;
};

const DEFAULT_BAG_WEIGHT =
  25;

const FEED_TYPES = [
  "Starter",
  "Grower",
  "Finisher",
  "Layer Mash",
  "Broiler Starter",
  "Broiler Finisher",
  "Concentrate",
  "Supplement",
  "Other",
];

export default function AddFeedStockForm({
  farmId,
  user,
  onSaved,
}: Props) {
  const [
    recordDate,
    setRecordDate,
  ] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [
    feedType,
    setFeedType,
  ] =
    useState(
      "Starter"
    );

  const [
    quantityBags,
    setQuantityBags,
  ] =
    useState("");

  const [
    bagWeightKg,
    setBagWeightKg,
  ] =
    useState(
      String(
        DEFAULT_BAG_WEIGHT
      )
    );

  const [
    bagPrice,
    setBagPrice,
  ] =
    useState("");

  const [
    supplier,
    setSupplier,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  const calculatedValues =
    useMemo(() => {
      const bags =
        Number(
          quantityBags
        ) || 0;

      const weight =
        Number(
          bagWeightKg
        ) || 0;

      const price =
        Number(
          bagPrice
        ) || 0;

      return {
        quantityKg:
          bags * weight,

        totalPrice:
          bags * price,
      };
    }, [
      quantityBags,
      bagWeightKg,
      bagPrice,
    ]);

  async function handleSave() {
    const bags =
      Number(
        quantityBags
      );

    const weight =
      Number(
        bagWeightKg
      );

    const price =
      Number(
        bagPrice
      );

    if (
      !farmId ||
      !user?.id
    ) {
      return;
    }

    if (
      !feedType ||
      bags <= 0 ||
      weight <= 0 ||
      price < 0
    ) {
      return;
    }

    try {
      setLoading(
        true
      );

await createFeedStock({
  farm_id:
    farmId,

  purchase_date:
    recordDate,

  feed_type:
    feedType,

        quantity_bags:
          bags,

        bag_weight_kg:
          weight,

        bag_price:
          price,

        total_price:
          calculatedValues.totalPrice,

        quantity_kg:
          calculatedValues.quantityKg,

        supplier:
          supplier.trim(),

        created_by:
          user.id,
      });

      await onSaved?.();

      setQuantityBags(
        ""
      );

      setBagPrice(
        ""
      );

      setSupplier(
        ""
      );

      setSuccess(
        true
      );

      setTimeout(() => {
        setSuccess(
          false
        );
      }, 2000);

    } catch (error) {
      console.error(
        "Failed to create feed stock:",
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Add Feed Stock
      </h2>

      <p className="text-sm text-slate-500 mb-6">
        Record a new feed purchase.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Purchase Date
          </label>

          <input
            type="date"
            value={
              recordDate
            }
            onChange={(e) =>
              setRecordDate(
                e.target.value
              )
            }
            className="w-full border border-slate-300 rounded-xl p-4"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Feed Type
          </label>

          <select
            value={
              feedType
            }
            onChange={(e) =>
              setFeedType(
                e.target.value
              )
            }
            className="w-full border border-slate-300 rounded-xl p-4"
            required
          >
            {FEED_TYPES.map(
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
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Number of Bags
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 4"
            value={
              quantityBags
            }
            onChange={(e) =>
              setQuantityBags(
                e.target.value
              )
            }
            className="w-full border border-slate-300 rounded-xl p-4"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Bag Weight
          </label>

          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                bagWeightKg
              }
              onChange={(e) =>
                setBagWeightKg(
                  e.target.value
                )
              }
              className="w-full border border-slate-300 rounded-xl p-4 pr-16"
              required
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              kg
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Standard PoultryOps bag size is 25 kg.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Price per Bag (₦)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 12500"
            value={
              bagPrice
            }
            onChange={(e) =>
              setBagPrice(
                e.target.value
              )
            }
            className="w-full border border-slate-300 rounded-xl p-4"
            required
          />
        </div>

        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">

          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <Calculator
              size={18}
            />

            Purchase Calculation
          </div>

          <div className="mt-3 space-y-2">

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                Total Feed
              </span>

              <span className="font-bold text-slate-900">
                {calculatedValues.quantityKg.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}{" "}
                kg
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                Total Purchase Price
              </span>

              <span className="font-bold text-blue-700">
                ₦
                {calculatedValues.totalPrice.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

          </div>

          <p className="text-xs text-blue-600 mt-3">
            Bags × bag weight = total kg
            <br />
            Bags × price per bag = total purchase price
          </p>

        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Supplier
          </label>

          <input
            type="text"
            placeholder="Supplier name"
            value={
              supplier
            }
            onChange={(e) =>
              setSupplier(
                e.target.value
              )
            }
            className="w-full border border-slate-300 rounded-xl p-4"
          />
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">

          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
            <User
              size={16}
            />

            Recorded By
          </div>

          <p className="font-semibold text-slate-900 mt-2">
            {user?.email ||
              "Signed-in user"}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Automatically recorded from the signed-in account.
          </p>

        </div>

        <SaveButton
          loading={
            loading
          }
          success={
            success
          }
          label="Add Feed Stock"
        />

      </form>

    </div>
  );
}