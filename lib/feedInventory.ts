import { supabase } from "@/lib/supabase";

/*
 * PoultryOps Feed Inventory
 *
 * Purchasing is recorded in BAGS.
 *
 * Standard bag weight:
 *   25 kg
 *
 * Operational calculations remain in KG.
 *
 * Example:
 *
 *   4 bags × 25 kg = 100 kg
 *   ₦12,500 per bag
 *   Total purchase = ₦50,000
 *
 * Database representation:
 *
 *   quantity_bags  = number of bags purchased
 *   bag_weight_kg  = weight of each bag
 *   bag_price      = price of one bag
 *   total_price    = total purchase cost
 *   quantity_kg    = operational KG equivalent
 *
 * Legacy fields are also maintained:
 *
 *   unit_price = price per KG
 *   cost       = total purchase cost
 *
 * This keeps existing PoultryOps calculations working
 * without disrupting existing subscribers or data.
 */

const DEFAULT_BAG_WEIGHT_KG = 25;

export type FeedStockInput = {
  farm_id: string;

  purchase_date: string;
  feed_type: string;

  quantity_bags: number;
  bag_weight_kg?: number;

  bag_price: number;
  total_price: number;

  /*
   * Operational quantity.
   *
   * Example:
   * 4 bags × 25 kg = 100 kg
   */
  quantity_kg: number;

  supplier: string;

  /*
   * The authenticated user who recorded
   * the purchase.
   *
   * Required because the feed_inventory
   * INSERT RLS policy requires:
   *
   * created_by = auth.uid()
   */
  created_by: string;
};

/*
 * Create a new feed inventory purchase.
 */
export async function createFeedStock(
  record: FeedStockInput
) {
  const bagWeight =
    record.bag_weight_kg ||
    DEFAULT_BAG_WEIGHT_KG;

  const { data, error } =
    await supabase
      .from("feed_inventory")
      .insert({
        /*
         * Farm ownership.
         */
        farm_id:
          record.farm_id,

        /*
         * Purchase information.
         */
        purchase_date:
          record.purchase_date,

        feed_type:
          record.feed_type,

        quantity_bags:
          record.quantity_bags,

        bag_weight_kg:
          bagWeight,

        bag_price:
          record.bag_price,

        total_price:
          record.total_price,

        /*
         * Operational KG quantity.
         */
        quantity_kg:
          record.quantity_kg,

        /*
         * Legacy compatibility.
         *
         * unit_price is price per KG.
         */
        unit_price:
          record.bag_price /
          bagWeight,

        /*
         * Existing code may still
         * reference cost.
         */
        cost:
          record.total_price,

        supplier:
          record.supplier || null,

        /*
         * Required by INSERT RLS.
         */
        created_by:
          record.created_by,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
 * Get all feed inventory purchases
 * belonging to a farm.
 *
 * The profiles relationship allows the UI
 * to display who recorded each purchase.
 */
export async function getFeedInventory(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("feed_inventory")
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .eq("farm_id", farmId)
      .order(
        "purchase_date",
        {
          ascending: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (error) {
    throw error;
  }

  return data || [];
}

/*
 * Get total feed purchased in KG.
 *
 * All operational calculations remain KG-based.
 *
 * New records:
 *   quantity_kg is used directly.
 *
 * Legacy records:
 *   quantity_kg may be missing/zero,
 *   so quantity_bags × bag_weight_kg
 *   is used as a fallback.
 */
export async function getTotalFeedPurchased(
  farmId: string
) {
  const { data, error } =
    await supabase
      .from("feed_inventory")
      .select(
        "quantity_kg, quantity_bags, bag_weight_kg"
      )
      .eq("farm_id", farmId);

  if (error) {
    throw error;
  }

  return (
    data?.reduce(
      (sum, row) => {
        const quantityKg =
          Number(
            row.quantity_kg || 0
          );

        /*
         * Prefer the stored operational
         * KG quantity.
         */
        if (quantityKg > 0) {
          return sum + quantityKg;
        }

        /*
         * Legacy/fallback calculation.
         */
        const bags =
          Number(
            row.quantity_bags || 0
          );

        const bagWeight =
          Number(
            row.bag_weight_kg ||
              DEFAULT_BAG_WEIGHT_KG
          );

        return (
          sum +
          bags * bagWeight
        );
      },
      0
    ) || 0
  );
}

/*
 * Convert a feed purchase record into
 * the standard PoultryOps purchasing model.
 *
 * This supports both:
 *
 *   New records using bags
 *   Older records using KG
 *
 * so existing subscriber data continues
 * to display correctly.
 */
export function getFeedPurchaseDetails(
  record: any
) {
  const bagWeight =
    Number(
      record?.bag_weight_kg ||
        DEFAULT_BAG_WEIGHT_KG
    );

  const quantityKg =
    Number(
      record?.quantity_kg || 0
    );

  let quantityBags =
    Number(
      record?.quantity_bags || 0
    );

  /*
   * If the record predates the bag model,
   * derive bags from KG.
   */
  if (
    quantityBags <= 0 &&
    quantityKg > 0 &&
    bagWeight > 0
  ) {
    quantityBags =
      quantityKg /
      bagWeight;
  }

  let totalPrice =
    Number(
      record?.total_price || 0
    );

  /*
   * Legacy records may only have cost.
   */
  if (
    totalPrice <= 0 &&
    Number(
      record?.cost || 0
    ) > 0
  ) {
    totalPrice =
      Number(record.cost);
  }

  let bagPrice =
    Number(
      record?.bag_price || 0
    );

  /*
   * Legacy records may not have bag_price.
   * Calculate it from total purchase cost.
   */
  if (
    bagPrice <= 0 &&
    quantityBags > 0 &&
    totalPrice > 0
  ) {
    bagPrice =
      totalPrice /
      quantityBags;
  }

  return {
    quantityBags,

    bagWeightKg:
      bagWeight,

    /*
     * Operational quantity is always KG.
     */
    quantityKg:
      quantityKg > 0
        ? quantityKg
        : quantityBags *
          bagWeight,

    /*
     * Price of one standard bag.
     */
    bagPrice,

    /*
     * Total purchase cost.
     */
    totalPrice,
  };
}

/*
 * Update an existing feed purchase.
 *
 * farm_id and created_by are deliberately
 * NOT changed here.
 *
 * The existing record remains associated
 * with its farm and original recorder.
 */
export async function updateFeedStock(
  id: string,
  updates: {
    purchase_date: string;
    feed_type: string;

    quantity_bags: number;
    bag_weight_kg: number;

    bag_price: number;
    total_price: number;

    quantity_kg: number;

    supplier: string;
  }
) {
  const bagWeight =
    updates.bag_weight_kg ||
    DEFAULT_BAG_WEIGHT_KG;

  const { error } =
    await supabase
      .from("feed_inventory")
      .update({
        purchase_date:
          updates.purchase_date,

        feed_type:
          updates.feed_type,

        quantity_bags:
          updates.quantity_bags,

        bag_weight_kg:
          bagWeight,

        bag_price:
          updates.bag_price,

        total_price:
          updates.total_price,

        /*
         * Operational KG quantity.
         */
        quantity_kg:
          updates.quantity_kg,

        /*
         * Legacy compatibility.
         *
         * Price per KG.
         */
        unit_price:
          updates.bag_price /
          bagWeight,

        /*
         * Legacy compatibility.
         */
        cost:
          updates.total_price,

        supplier:
          updates.supplier || null,
      })
      .eq("id", id);

  if (error) {
    throw error;
  }
}