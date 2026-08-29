"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  updateFeedStock,
  getFeedPurchaseDetails,
} from "@/lib/feedInventory";

import {
  canEdit,
} from "@/lib/permissions/governance";

import SaveButton from "@/components/ui/save-button";

import {
  Calculator,
  User,
  X,
} from "lucide-react";

type Props = {
  record: any;
  onClose: () => void;
  onSaved: () =>
    Promise<void> | void;
  user: any;
  profile?: any;
};

const DEFAULT_BAG_WEIGHT = 25;

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

export default function EditFeedStockForm({
  record,
  onClose,
  onSaved,
  user,
  profile,
}: Props) {
  const details =
    getFeedPurchaseDetails(
      record
    );

  const [
    flockId,
  ] = useState(
    record?.flock_id || ""
  );

  const [
    recordDate,
    setRecordDate,
  ] =
    useState(
      record?.purchase_date ||
        new Date()
          .toISOString()
          .split("T")[0]
    );

  const [
    feedType,
    setFeedType,
  ] =
    useState(
      record?.feed_type ||
        "Starter"
    );

  const [
    quantityBags,
    setQuantityBags,
  ] =
    useState(
      details.quantityBags
        ? String(
            details.quantityBags
          )
        : ""
    );

  const [
    bagWeightKg,
    setBagWeightKg,
  ] =
    useState(
      details.bagWeightKg
        ? String(
            details.bagWeightKg
          )
        : String(
            DEFAULT_BAG_WEIGHT
          )
    );

  const [
    bagPrice,
    setBagPrice,
  ] =
    useState(
      details.bagPrice
        ? String(
            details.bagPrice
          )
        : ""
    );

  const [
    supplier,
    setSupplier,
  ] =
    useState(
      record?.supplier || ""
    );

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

  const [
    governanceError,
    setGovernanceError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    const governanceResult =
      canEdit(
        {
          id:
            user?.id || "",
          role:
            profile?.role || "",
        },
        record
      );

    if (
      !governanceResult.allowed
    ) {
      setGovernanceError(
        governanceResult.reason ||
          "You cannot edit this record at this time."
      );
    }
  }, [
    user,
    profile,
    record,
  ]);

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
    if (
      governanceError
    ) {
      return;
    }

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
      !record?.id ||
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

      await updateFeedStock(
        record.id,
        {
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
        }
      );

      await onSaved?.();

      setSuccess(
        true
      );

      setTimeout(() => {
        setSuccess(
          false
        );

        onClose();
      }, 1500);

    } catch (error) {
      console.error(
        "Failed to update feed stock:",
        error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  if (
    governanceError
  ) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-2xl font-bold text-slate-900">
            Edit Feed Stock
          </h2>

          <button
            type="button"
            onClick={
              onClose
            }
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Close"
          >
            <X
              size={20}
            />
          </button>

        </div>

        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4">

          <p className="text-red-700 text-sm">
            {governanceError}
          </p>

        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          className="w-full rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
        >
          Close
        </button>

      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-bold text-slate-900">
          Edit Feed Stock
        </h2>

        <button
          type="button"
          onClick={
            onClose
          }
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Close"
        >
          <X
            size={20}
          />
        </button>

      </div>

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
            {record?.profiles?.full_name ||
              record?.profiles?.email ||
              record?.created_by ||
              user?.email ||
              "Signed-in user"}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Original recorder is retained for this purchase record.
          </p>

        </div>

        <SaveButton
          loading={
            loading
          }
          success={
            success
          }
          label="Update Feed Stock"
        />

      </form>

    </div>
  );
}