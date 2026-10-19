"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShoppingBasket,
  Store,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type FarmProduct = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  selling_price: number | string;
  description: string | null;
};

type CatalogResponse = {
  farm: {
    id: string;
    name: string;
    currency: string;
  };
  products: FarmProduct[];
};

type BasketItem = {
  product: FarmProduct;
  quantity: number;
};

type OrderConfirmation = {
  order_id: string;
  order_reference: string;
  customer_code: string;
  customer_name: string;
  farm_name: string;
  item_count: number;
  total_amount: number;
  status: string;
};

type CustomerLookupResult = {
  found?: boolean;
  message?: string;
  customer_code?: string;
  name?: string;
  phone?: string;
  address?: string;
  location?: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export default function PublicOrderingForm({
  farmId,
}: {
  farmId: string;
}) {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [confirmation, setConfirmation] =
    useState<OrderConfirmation | null>(null);

  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerLookupMessage, setCustomerLookupMessage] = useState("");
  const [verifiedCustomer, setVerifiedCustomer] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [notes, setNotes] = useState("");

  const currency = catalog?.farm.currency || "NGN";

  const formatMoney = useCallback(
    (amount: number) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount || 0),
    [currency]
  );

  const loadCatalog = useCallback(async () => {
    if (!farmId) {
      setError("This ordering link is invalid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase.rpc(
        "get_public_ordering_catalog",
        { p_farm_id: farmId }
      );

      if (queryError || !data) {
        console.error("Public catalogue load failed:", queryError);
        setError(
          "This farm's ordering page is unavailable. Please check the link or contact the farm."
        );
        setCatalog(null);
      } else {
        setCatalog(data as unknown as CatalogResponse);
      }
    } catch (catalogError) {
      console.error("Public catalogue error:", catalogError);
      setError("Unable to load the farm catalogue. Please try again.");
      setCatalog(null);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  async function lookupCustomer() {
    setCustomerLookupMessage("");
    setVerifiedCustomer(false);

    if (!catalog) {
      setCustomerLookupMessage("The farm catalogue is not ready yet.");
      return;
    }

    if (!customerCode.trim() || !phone.trim()) {
      setCustomerLookupMessage(
        "Enter your customer code and phone number first."
      );
      return;
    }

    setCustomerLookupLoading(true);

    try {
      const { data, error: lookupError } = await supabase.rpc(
        "lookup_public_order_customer",
        {
          p_farm_id: catalog.farm.id,
          p_customer_code: customerCode.trim(),
          p_phone: phone.trim(),
        }
      );

      if (lookupError) {
        console.error("Customer lookup failed:", lookupError);
        setCustomerLookupMessage(
          "We could not verify your details. Please try again."
        );
        return;
      }

      const result = data as CustomerLookupResult | null;

      if (!result?.found) {
        setCustomerName("");
        setDeliveryAddress("");
        setStateRegion("");
        setVerifiedCustomer(false);
        setCustomerLookupMessage(
          result?.message ||
            "Customer not found. Check your code and phone number."
        );
        return;
      }

      setCustomerCode(result.customer_code || customerCode.trim());
      setCustomerName(result.name || "");
      setPhone(result.phone || phone.trim());
      setDeliveryAddress(result.address || "");
      setStateRegion(result.location || "");
      setVerifiedCustomer(true);

      setCustomerLookupMessage(
        "Customer verified. Your details have been filled in. Please confirm your delivery address."
      );
    } catch (lookupError) {
      console.error("Customer lookup error:", lookupError);
      setCustomerLookupMessage(
        "Customer lookup failed. Please try again."
      );
    } finally {
      setCustomerLookupLoading(false);
    }
  }

  const basketTotal = useMemo(
    () =>
      basket.reduce(
        (sum, item) =>
          sum + item.quantity * Number(item.product.selling_price || 0),
        0
      ),
    [basket]
  );

  const basketCount = basket.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function addProduct(product: FarmProduct) {
    setBasket((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });

    setError("");
  }

  function changeQuantity(productId: string, change: number) {
    setBasket((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeProduct(productId: string) {
    setBasket((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!catalog) {
      setError("The product catalogue is unavailable.");
      return;
    }

    if (basket.length === 0) {
      setError("Add at least one product to your basket.");
      return;
    }

    if (!customerName.trim() || !phone.trim()) {
      setError("Enter your full name and phone number.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setError("Your delivery address or location is required.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: submitError } = await supabase.rpc(
        "submit_public_customer_order",
        {
          p_farm_id: catalog.farm.id,
          p_customer_code: customerCode.trim() || null,
          p_customer_name: customerName.trim(),
          p_phone: phone.trim(),
          p_delivery_address: deliveryAddress.trim(),
          p_state_region: stateRegion.trim() || null,
          p_items: basket.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
          p_notes: notes.trim() || null,
        }
      );

      if (submitError || !data) {
        console.error("Public order submission failed:", submitError);
        throw new Error(
          submitError?.message ||
            "Your order could not be submitted. Please try again."
        );
      }

      setConfirmation(data as unknown as OrderConfirmation);
      setBasket([]);
      setNotes("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <LoaderCircle className="animate-spin" size={20} />
          Loading farm catalogue...
        </div>
      </main>
    );
  }

  if (!catalog) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
          <h1 className="text-xl font-bold text-slate-900">
            Ordering link unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </main>
    );
  }

  if (confirmation) {
    const message = [
      `Hello ${confirmation.farm_name},`,
      "I have submitted an order through PoultryOps.",
      `Order reference: ${confirmation.order_reference}`,
      `Customer code: ${confirmation.customer_code}`,
      `Customer: ${confirmation.customer_name}`,
      `Products: ${confirmation.item_count}`,
      `Total: ${formatMoney(Number(confirmation.total_amount))}`,
      "Please confirm receipt of my order.",
    ].join("\n");

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>

          <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">
            Order submitted!
          </h1>

          <p className="mt-2 text-center text-sm text-slate-600">
            Thank you, {confirmation.customer_name}. Your order has been
            recorded and is awaiting the farm&apos;s review.
          </p>

          <div className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Order reference
              </p>
              <p className="mt-1 break-all font-semibold text-slate-900">
                {confirmation.order_reference}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Your permanent customer code
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {confirmation.customer_code}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Keep this code. Returning customers can use it with their
                registered phone number to retrieve their details.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-600">Order total</span>
              <span className="text-xl font-bold text-slate-900">
                {formatMoney(Number(confirmation.total_amount))}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Status</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Pending farm review
              </span>
            </div>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            className={`${buttonClass} mt-6 w-full`}
          >
            <MessageCircle size={18} />
            Share confirmation on WhatsApp
          </a>

          <button
            type="button"
            onClick={() => {
              setConfirmation(null);
              setCustomerCode(confirmation.customer_code);
              setCustomerLookupMessage("");
              setVerifiedCustomer(false);
              setError("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Place another order
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            This confirms submission only. The farm must still confirm
            availability and fulfilment.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Store size={24} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              PoultryOps customer ordering
            </p>
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {catalog.farm.name}
            </h1>
            <p className="text-sm text-slate-500">
              Browse products and place your order online.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Available products
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Prices are shown in {currency}. The farm reviews orders before
              fulfilment.
            </p>
          </div>

          {catalog.products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <ShoppingBasket
                className="mx-auto mb-3 text-slate-300"
                size={36}
              />
              <p className="font-semibold text-slate-800">
                No products currently available
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please contact the farm for assistance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {catalog.products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex-1">
                    {product.category && (
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {product.category}
                      </span>
                    )}

                    <h3 className="mt-3 font-bold text-slate-900">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {product.description}
                      </p>
                    )}

                    <p className="mt-3 text-lg font-bold text-slate-900">
                      {formatMoney(Number(product.selling_price))}
                      <span className="ml-1 text-xs font-normal text-slate-500">
                        / {product.unit || "unit"}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    className={`${buttonClass} mt-4 w-full`}
                  >
                    <Plus size={17} />
                    Add to basket
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Your basket
              </h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {basketCount} item{basketCount === 1 ? "" : "s"}
              </span>
            </div>

            {basket.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Your basket is empty. Add products to begin.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {basket.map((item) => (
                  <div
                    key={item.product.id}
                    className="border-b border-slate-100 pb-4 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {item.product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatMoney(Number(item.product.selling_price))} /{" "}
                          {item.product.unit || "unit"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeProduct(item.product.id)}
                        aria-label={`Remove ${item.product.name}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, -1)}
                          aria-label={`Reduce ${item.product.name} quantity`}
                          className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="min-w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => changeQuantity(item.product.id, 1)}
                          aria-label={`Increase ${item.product.name} quantity`}
                          className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {formatMoney(
                          item.quantity * Number(item.product.selling_price)
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="font-semibold text-slate-700">
                    Estimated total
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatMoney(basketTotal)}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  The database recalculates the total using current catalogue
                  prices at submission.
                </p>
              </div>
            )}
          </section>

          <form
            onSubmit={submitOrder}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Customer details
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Fields marked * are required.
              </p>
            </div>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Customer code

              <input
                value={customerCode}
                onChange={(event) => {
                  setCustomerCode(event.target.value);
                  setVerifiedCustomer(false);
                  setCustomerLookupMessage("");
                }}
                placeholder="New customer? Leave blank"
                className={inputClass}
                autoComplete="off"
              />

              <button
                type="button"
                onClick={lookupCustomer}
                disabled={customerLookupLoading || submitting}
                className={`${buttonClass} mt-2 w-full`}
              >
                {customerLookupLoading ? (
                  <>
                    <LoaderCircle className="animate-spin" size={17} />
                    Verifying customer...
                  </>
                ) : (
                  "Find my customer details"
                )}
              </button>

              {customerLookupMessage && (
                <p
                  role="status"
                  className={`mt-2 text-xs ${
                    verifiedCustomer ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {customerLookupMessage}
                </p>
              )}

              <span className="block text-xs font-normal text-slate-500">
                Returning customer? Enter your customer code and phone number,
                then select Find my customer details. New customers can leave
                the code blank.
              </span>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Full name *
              <input
                required
                maxLength={150}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer full name"
                className={inputClass}
                autoComplete="name"
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Phone number *
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  required
                  type="tel"
                  maxLength={40}
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setVerifiedCustomer(false);
                    setCustomerLookupMessage("");
                  }}
                  placeholder="WhatsApp phone number"
                  className={`${inputClass} pl-10`}
                  autoComplete="tel"
                />
              </div>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Address / Delivery location *
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-3 text-slate-400"
                  size={17}
                />
                <textarea
                  required
                  maxLength={1000}
                  rows={3}
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Customer address or delivery location"
                  className={`${inputClass} pl-10`}
                  autoComplete="street-address"
                />
              </div>
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              State / Region
              <input
                maxLength={150}
                value={stateRegion}
                onChange={(event) => setStateRegion(event.target.value)}
                placeholder="State / Region"
                className={inputClass}
                autoComplete="address-level1"
              />
            </label>

            <label className="block space-y-1.5 text-sm font-medium text-slate-700">
              Notes
              <textarea
                rows={2}
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes or delivery instructions"
                className={inputClass}
              />
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || basket.length === 0}
              className={`${buttonClass} w-full`}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  Submitting order...
                </>
              ) : (
                <>
                  <ShoppingBasket size={18} />
                  Submit order · {formatMoney(basketTotal)}
                </>
              )}
            </button>

            <p className="text-xs leading-5 text-slate-500">
              Submitting an order does not confirm stock availability or
              payment. The farm will review your order before fulfilment.
            </p>
          </form>
        </aside>
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-500">
        Customer ordering powered by PoultryOps
      </footer>
    </main>
  );
}