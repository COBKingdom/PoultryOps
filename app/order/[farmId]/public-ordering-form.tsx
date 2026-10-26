
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  isValidInternationalPhone,
  normalizePhoneForWhatsApp,
} from "@/lib/phone";

type FarmProduct = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  selling_price: number | string;
  description: string | null;
  image_path?: string | null;
};

type CatalogResponse = {
  farm: {
    id: string;
    name: string;
    currency: string;
    logo_path?: string | null;
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
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50";

function ProductImage({
  src,
  name,
  compact = false,
}: {
  src?: string;
  name: string;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (!src || imageFailed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 text-emerald-800 ${
          compact ? "" : "min-h-44"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white bg-white/80 shadow-sm">
          <ImageIcon size={compact ? 19 : 27} strokeWidth={1.5} />
        </div>
        {!compact && (
          <span className="px-3 text-center text-xs font-medium text-slate-500">
            Product photo coming soon
          </span>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className={`h-full w-full object-cover transition duration-500 ${
        compact ? "" : "group-hover:scale-105"
      }`}
    />
  );
}

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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All products");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [farmLogoUrl, setFarmLogoUrl] = useState("");

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
        return;
      }

      const result = data as unknown as CatalogResponse;
      setCatalog(result);
      setFarmLogoUrl("");

if (result.farm.logo_path) {
  try {
    const response = await fetch(
      `/api/public/farm-logo?farmId=${encodeURIComponent(farmId)}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const logoResult = (await response.json()) as {
        signedUrl?: string;
      };

      setFarmLogoUrl(logoResult.signedUrl || "");
    } else {
      console.warn("Farm logo could not be loaded:", response.status);
    }
  } catch (logoError) {
    console.warn("Farm logo request failed:", logoError);
  }
}

      const productsWithImages = (result.products || []).filter(
        (product) => Boolean(product.image_path)
      );

      
if (productsWithImages.length > 0) {
  const signedUrlResults = await Promise.all(
    productsWithImages.map(async (product) => {
      try {
        const response = await fetch(
          `/api/public/product-image?farmId=${encodeURIComponent(farmId)}&productId=${encodeURIComponent(product.id)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          const result = await response.json().catch(() => null);

          console.warn(
            "Could not load product image:",
            product.id,
            result?.error ?? response.statusText
          );

          return null;
        }

        const result = (await response.json()) as {
          signedUrl?: string;
        };

        if (!result.signedUrl) {
          console.warn("Product image URL missing:", product.id);
          return null;
        }

        return [product.id, result.signedUrl] as const;
      } catch (imageError) {
        console.warn("Product image could not be loaded:", imageError);
        return null;
      }
    })
  );

  const validEntries = signedUrlResults.filter(
    (
      entry
    ): entry is readonly [string, string] => entry !== null
  );

  setImageUrls(Object.fromEntries(validEntries));
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
      setCustomerLookupMessage("Customer lookup failed. Please try again.");
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

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        (catalog?.products || [])
          .map((product) => product.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["All products", ...uniqueCategories];
  }, [catalog?.products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return (catalog?.products || []).filter((product) => {
      const matchesCategory =
        selectedCategory === "All products" ||
        product.category?.trim() === selectedCategory;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [catalog?.products, searchQuery, selectedCategory]);

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
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <LoaderCircle className="animate-spin" size={27} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              Preparing the farm shop
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Loading available products and prices...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!catalog) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={30} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Ordering link unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadCatalog()}
            className={`${primaryButtonClass} mt-6 w-full`}
          >
            Try again
          </button>
          <p className="mt-5 text-xs text-slate-400">
            Customer ordering powered by PoultryOps
          </p>
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
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white px-4 py-10 sm:py-16">
        <section className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500" />

          <div className="p-6 sm:p-9">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2 size={42} strokeWidth={1.7} />
            </div>

            <p className="mt-7 text-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Order received
            </p>
            <h1 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
              Thank you, {confirmation.customer_name}!
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-600">
              Your order has been recorded and is awaiting the farm&apos;s
              review. Keep your reference and customer code for future use.
            </p>

            <div className="mt-8 space-y-5 rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Order reference
                </p>
                <p className="mt-1 break-all text-lg font-bold text-slate-900">
                  {confirmation.order_reference}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Your permanent customer code
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-wide text-emerald-700">
                  {confirmation.customer_code}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Keep this code. Returning customers can use it with their
                  registered phone number to retrieve their details.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm text-slate-600">Order total</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {formatMoney(Number(confirmation.total_amount))}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Order status</span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                  Pending review
                </span>
              </div>
            </div>


<a
  href={`https://wa.me/${
    isValidInternationalPhone(phone)
      ? normalizePhoneForWhatsApp(phone)
      : ""
  }?text=${encodeURIComponent(message)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#1DA851]"
>
  <MessageCircle size={19} />
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
              className={`${secondaryButtonClass} mt-3 w-full`}
            >
              Place another order
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              This confirms submission only. The farm must still confirm
              availability and fulfilment.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  {farmLogoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={farmLogoUrl}
      alt={`${catalog.farm.name} logo`}
      className="h-full w-full object-contain p-1"
      onError={() => setFarmLogoUrl("")}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-emerald-600 text-white">
      <Store size={24} strokeWidth={1.8} />
    </div>
  )}
</div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700 sm:text-xs">
                PoultryOps Farm Shop
              </p>
              <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                {catalog.farm.name}
              </h1>
            </div>
          </div>

          <a
            href="#basket"
            className="relative inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 sm:px-4"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Your basket</span>
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white">
              {basketCount}
            </span>
          </a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900" />
        <div className="absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 -z-10 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_auto] lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Online farm ordering
            </span>

            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Quality farm products,
              <span className="block text-emerald-300">
                ordered with ease.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Explore available products from {catalog.farm.name}, add your
              selections to the basket and send your order directly to the
              farm.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-slate-300 sm:text-sm">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-300" />
                Secure customer verification
              </span>
              <span className="flex items-center gap-2">
                <ShoppingBasket size={17} className="text-emerald-300" />
                Simple online ordering
              </span>
            </div>
          </div>

          <div className="hidden w-64 rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:block lg:w-72">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              <Truck size={25} />
            </div>
            <p className="mt-5 text-lg font-bold text-white">
              From farm to customer
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Send your order details online. The farm will review your order
              and confirm availability and fulfilment.
            </p>
            <a
              href="#products"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              Browse products <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <section id="products" className="min-w-0 scroll-mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  The farm catalogue
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Browse our products
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose your products and quantities. Prices are displayed in{" "}
                  {currency}.
                </p>
              </div>

              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                {catalog.products.length} product
                {catalog.products.length === 1 ? "" : "s"} available
              </span>
            </div>

            {catalog.products.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products, descriptions or categories..."
                    aria-label="Search products"
                    className={`${inputClass} h-12 pl-11 pr-11`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear product search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {categories.map((category) => {
                    const active = selectedCategory === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {catalog.products.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShoppingBasket size={30} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No products currently available
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  This farm has not listed any active products for online
                  ordering yet. Please contact the farm for assistance.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <Search className="mx-auto text-slate-300" size={32} />
                <h3 className="mt-3 font-bold text-slate-800">
                  No matching products
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search term or category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All products");
                  }}
                  className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const basketItem = basket.find(
                    (item) => item.product.id === product.id
                  );

                  return (
                    <article
                      key={product.id}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/[0.04]"
                    >
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <ProductImage
                          src={imageUrls[product.id]}
                          name={product.name}
                        />
                        {product.category && (
                          <span className="absolute left-3 top-3 max-w-[calc(100%-24px)] truncate rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-emerald-800 shadow-sm backdrop-blur">
                            {product.category}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex-1">
                          <h3 className="text-base font-bold leading-6 text-slate-900">
                            {product.name}
                          </h3>

                          <p className="mt-1.5 min-h-10 text-sm leading-5 text-slate-500">
                            {product.description?.trim() ||
                              "Quality farm product, available to order directly from the farm."}
                          </p>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-xl font-extrabold tracking-tight text-slate-900">
                            {formatMoney(Number(product.selling_price))}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            per {product.unit || "unit"}
                          </p>

                          {basketItem && (
                            <p className="mt-2 text-xs font-semibold text-emerald-700">
                              {basketItem.quantity} in your basket
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => addProduct(product)}
                            className={`${primaryButtonClass} mt-4 w-full`}
                          >
                            <Plus size={17} />
                            {basketItem ? "Add another" : "Add to basket"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-emerald-700"
              />
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  Order with confidence
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-900/75">
                  Your order is submitted to the farm for review. Availability,
                  final fulfilment arrangements and payment are confirmed by
                  the farm.
                </p>
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-5 lg:sticky lg:top-5">
            <section
              id="basket"
              className="scroll-mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Your basket
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Review your selected products
                  </p>
                </div>
                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-emerald-50 px-2 text-sm font-extrabold text-emerald-800">
                  {basketCount}
                </span>
              </div>

              {basket.length === 0 ? (
                <div className="px-5 py-9 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    <ShoppingBasket size={28} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Your basket is empty
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Browse the catalogue and add products to get started.
                  </p>
                  <a
                    href="#products"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Browse products <ArrowRight size={15} />
                  </a>
                </div>
              ) : (
                <div className="p-5">
                  <div className="space-y-4">
                    {basket.map((item) => (
                      <div
                        key={item.product.id}
                        className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            <ProductImage
                              src={imageUrls[item.product.id]}
                              name={item.product.name}
                              compact
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-bold leading-5 text-slate-900">
                              {item.product.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatMoney(
                                Number(item.product.selling_price)
                              )}{" "}
                              / {item.product.unit || "unit"}
                            </p>
                            <p className="mt-1.5 text-sm font-bold text-slate-900">
                              {formatMoney(
                                item.quantity *
                                  Number(item.product.selling_price)
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeProduct(item.product.id)}
                            aria-label={`Remove ${item.product.name}`}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">
                            Quantity
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(item.product.id, -1)
                              }
                              aria-label={`Reduce ${item.product.name} quantity`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="min-w-5 text-center text-sm font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(item.product.id, 1)
                              }
                              aria-label={`Increase ${item.product.name} quantity`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-600">
                        Estimated total
                      </span>
                      <span className="text-xl font-extrabold tracking-tight text-slate-900">
                        {formatMoney(basketTotal)}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      The database recalculates the order total using current
                      catalogue prices when you submit.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <form
              onSubmit={submitOrder}
              className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Almost there
                </p>
                <h2 className="mt-1.5 text-xl font-extrabold text-slate-900">
                  Checkout
                </h2>
                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  Enter your customer details to submit your order.
                </p>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-1.5">
                <label
                  htmlFor="customer-code"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Customer code
                </label>
                <input
                  id="customer-code"
                  value={customerCode}
                  onChange={(event) => {
                    setCustomerCode(event.target.value);
                    setVerifiedCustomer(false);
                    setCustomerLookupMessage("");
                  }}
                  placeholder="Enter your existing code, if you have one"
                  className={inputClass}
                  autoComplete="off"
                />

                <button
                  type="button"
                  onClick={lookupCustomer}
                  disabled={
                    customerLookupLoading ||
                    submitting ||
                    !customerCode.trim() ||
                    !phone.trim()
                  }
                  className={`${secondaryButtonClass} mt-2 w-full disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {customerLookupLoading ? (
                    <>
                      <LoaderCircle className="animate-spin" size={17} />
                      Verifying customer...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={17} />
                      Find my customer details
                    </>
                  )}
                </button>

                {customerLookupMessage && (
                  <p
                    role="status"
                    className={`rounded-xl p-3 text-xs leading-5 ${
                      verifiedCustomer
                        ? "border border-emerald-100 bg-emerald-50 text-emerald-800"
                        : "border border-amber-100 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {customerLookupMessage}
                  </p>
                )}

                <p className="text-xs leading-5 text-slate-500">
                  Returning customer? Enter your customer code and phone
                  number, then verify your details. New customers can leave the
                  code blank.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="customer-name"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="customer-name"
                  required
                  maxLength={150}
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter your full name"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="customer-phone"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Phone number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <input
                    id="customer-phone"
                    required
                    type="tel"
                    maxLength={40}
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setVerifiedCustomer(false);
                      setCustomerLookupMessage("");
                    }}
                    placeholder="Phone or WhatsApp number"
                    className={`${inputClass} pl-10`}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="delivery-address"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Delivery address / location{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3.5 top-3.5 text-slate-400"
                    size={17}
                  />
                  <textarea
                    id="delivery-address"
                    required
                    maxLength={1000}
                    rows={3}
                    value={deliveryAddress}
                    onChange={(event) =>
                      setDeliveryAddress(event.target.value)
                    }
                    placeholder="Enter your address or delivery location"
                    className={`${inputClass} resize-y pl-10`}
                    autoComplete="street-address"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="state-region"
                  className="block text-sm font-semibold text-slate-700"
                >
                  State / Region
                </label>
                <input
                  id="state-region"
                  maxLength={150}
                  value={stateRegion}
                  onChange={(event) => setStateRegion(event.target.value)}
                  placeholder="State or region"
                  className={inputClass}
                  autoComplete="address-level1"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="order-notes"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Notes or delivery instructions
                </label>
                <textarea
                  id="order-notes"
                  rows={2}
                  maxLength={1000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional instructions for the farm"
                  className={`${inputClass} resize-y`}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || basket.length === 0}
                className={`${primaryButtonClass} w-full py-3.5`}
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="animate-spin" size={18} />
                    Submitting your order...
                  </>
                ) : (
                  <>
                    <ShoppingBasket size={18} />
                    Submit order · {formatMoney(basketTotal)}
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                Submitting an order does not confirm stock availability or
                payment. The farm will review your order before fulfilment.
              </p>
            </form>
          </aside>
        </div>
      </div>



      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Online ordering, made simple.
              </p>
              <p className="text-xs leading-5 text-slate-500">
                A better way for farms and customers to connect.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 sm:items-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Powered by</span>
                <span className="font-bold tracking-tight text-slate-900">
                  PoultryOps
                </span>
              </div>
              <a
                href="https://poultryops.trueops.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Discover PoultryOps
                <ArrowRight size={16} />
              </a>

              <p className="text-[11px] text-slate-400">
                Farm management and online ordering software
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Secure, convenient online ordering for farm customers.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
