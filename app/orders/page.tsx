
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isValidInternationalPhone, normalizePhoneForWhatsApp } from "@/lib/phone";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useCustomers } from "@/hooks/useCustomers";
import AppShell from "@/components/layout/app-shell";
import OperationsKpiCard from "@/components/operations/operations-kpi-card";
import VerifyOrderPaymentForm from "@/components/orders/verify-order-payment-form";
import OrderFulfilmentPanel from "@/components/orders/order-fulfilment-panel";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "dispatched"
  | "completed"
  | "cancelled";

type PaymentStatus =
  | "unpaid"
  | "awaiting_verification"
  | "part_paid"
  | "paid";

type BatchInfo = {
  order_reference: string;
  total_amount: number | string;
  item_count: number;
  delivery_address: string;
  state_region: string | null;
  proposed_delivery_date: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
} | null;

type OrderRecord = {
  id: string;
  farm_id: string;
  order_batch_id: string | null;
  customer_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_date: string;
  proposed_delivery_date: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  dispatch_notes: string | null;
  created_at: string;
  customers?: { name: string; phone: string | null } | null;
  public_order_batches?: BatchInfo | BatchInfo[];
};

type FarmProduct = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  selling_price: number | string | null;
  description: string | null;
  active: boolean;
};

type OrderGroup = {
  key: string;
  batchId: string | null;
  reference: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerCode: string | null;
  lines: OrderRecord[];
  total: number;
  orderDate: string;
  proposedDeliveryDate: string | null;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  deliveryAddress: string | null;
  stateRegion: string | null;
};

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready for collection" },
  { value: "dispatched", label: "Dispatched" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "awaiting_verification", label: "Awaiting verification" },
  { value: "part_paid", label: "Part paid" },
  { value: "paid", label: "Paid" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

function statusStyle(status: string) {
  if (["completed", "paid"].includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (["dispatched", "ready", "part_paid"].includes(status)) {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "awaiting_verification") {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-blue-50 text-blue-700";
}

function getBatchInfo(order: OrderRecord): NonNullable<BatchInfo> | null {
  const value = order.public_order_batches;

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function getBookingReference(
  order: OrderRecord,
  batch: NonNullable<BatchInfo> | null
): string {
  const reference = batch?.order_reference?.trim();

  // Never expose a UUID or malformed value as a customer booking reference.
  if (reference && /^PO-ORD-\d+$/i.test(reference)) {
    return reference;
  }

  return order.order_batch_id ? "Reference unavailable" : "Internal order";
}

export default function OrdersPage() {
  const { user, profile } = useAuth();
  const { data: dashboardData, loading: dashboardLoading } = useDashboard();

  const farmId =
    profile?.farm_id ||
    (dashboardData as any)?.farm?.id ||
    (dashboardData as any)?.farmId ||
    "";

  const currency =
    (dashboardData as any)?.farm?.currency ||
    (dashboardData as any)?.currency ||
    "NGN";

  const { records: customers, loading: customersLoading } =
    useCustomers(farmId);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productLoadError, setProductLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [fulfilledByOrder, setFulfilledByOrder] = useState<Record<string, number>>({});
  const [orderReservations, setOrderReservations] = useState<Array<{ order_id: string | null; order_batch_id: string | null; amount: number | string; amount_applied_to_sales: number | string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, boolean>
  >({});

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [productUnit, setProductUnit] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  const formatMoney = useCallback(
    (amount: number) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount || 0),
    [currency]
  );

function shareBookingConfirmation(group: OrderGroup) {
  const customerPhone = group.customerPhone?.trim() ?? "";

  if (!customerPhone) {
    setError(
      "This customer has no phone number recorded. Update the customer record before sharing a private WhatsApp confirmation."
    );
    return;
  }

  if (!isValidInternationalPhone(customerPhone)) {
    setError(
      "The customer's phone number must include a valid international country calling code, such as +234 or +353."
    );
    return;
  }

  let phone: string;

  try {
    phone = normalizePhoneForWhatsApp(customerPhone);
  } catch {
    setError("The customer's phone number is invalid.");
    return;
  }

  const farmName =
    (dashboardData as any)?.farm?.name || "Our Farm";

  const message = [
    `Hello ${group.customerName},`,
    "",
    `Your booking with ${farmName} has been recorded.`,
    ...(group.batchId ? [`Booking reference: ${group.reference}`] : []),
    ...(group.customerCode
      ? [`Customer code: ${group.customerCode}`]
      : []),
    ...(group.proposedDeliveryDate
      ? [
          `Proposed collection/delivery date: ${new Date(
            `${group.proposedDeliveryDate.slice(0, 10)}T00:00:00`
          ).toLocaleDateString("en-GB")}`,
        ]
      : []),
    "",
    "Items booked:",
    ...group.lines.map(
      (line) =>
        `- ${line.product_name}: ${line.quantity} × ${formatMoney(Number(line.unit_price))}`
    ),
    "",
    `Booking total: ${formatMoney(group.total)}`,
    `Booking status: ${
      ORDER_STATUSES.find((item) => item.value === group.status)?.label ??
      group.status
    }`,
    "",
    "This confirms your booking only. It is not a payment receipt or confirmation that goods have been collected.",
    "",
    "Please contact the farm directly if you need to amend your booking.",
  ].join("\n");

  setError("");

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
}


  const loadOrders = useCallback(async () => {
    if (!farmId) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("orders")
      .select(
        "id, farm_id, order_batch_id, customer_id, product_name, quantity, unit_price, total_amount, order_date, proposed_delivery_date, status, payment_status, notes, dispatch_notes, created_at, customers(name, phone), public_order_batches(order_reference, total_amount, item_count, delivery_address, state_region, proposed_delivery_date, status, payment_status)"
      )
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Failed to load orders:", queryError);
      setError(
        "Unable to load orders. Check your Orders table access and database relationships."
      );
      setOrders([]);
    } else {
      const loadedOrders = (data || []) as unknown as OrderRecord[];
      setOrders(loadedOrders);

      // Read fulfilment totals and payment reservations for the dashboard KPIs.
      // These are read-only queries; all transaction recording remains in the existing RPCs.
      const orderIds = loadedOrders.map((order) => order.id);
      const [{ data: fulfilments, error: fulfilmentError }, { data: reservations, error: reservationsError }] = await Promise.all([
        orderIds.length
          ? supabase.from("order_fulfilments").select("order_id, quantity").in("order_id", orderIds)
          : Promise.resolve({ data: [], error: null } as any),
        supabase.from("order_payment_allocations").select("order_id, order_batch_id, amount, amount_applied_to_sales").eq("farm_id", farmId),
      ]);

      if (fulfilmentError) {
        console.error("Failed to load order fulfilment totals:", fulfilmentError);
        setFulfilledByOrder({});
      } else {
        const totals: Record<string, number> = {};
        for (const row of fulfilments || []) {
          const key = String((row as any).order_id);
          totals[key] = (totals[key] || 0) + Number((row as any).quantity || 0);
        }
        setFulfilledByOrder(totals);
      }

      if (reservationsError) {
        console.error("Failed to load order payment reservations:", reservationsError);
        setOrderReservations([]);
      } else {
        setOrderReservations((reservations || []) as any);
      }
    }

    setLoadingOrders(false);
  }, [farmId]);

  const loadProducts = useCallback(async () => {
    if (!farmId) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    setProductLoadError("");

    const { data, error: queryError } = await supabase
      .from("farm_products")
      .select(
        "id, name, category, unit, selling_price, description, active"
      )
      .eq("farm_id", farmId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (queryError) {
      console.error("Failed to load catalogue products:", queryError);
      setProducts([]);
      setProductLoadError(
        "Unable to load catalogue products. Check Product Catalogue permissions."
      );
    } else {
      setProducts((data || []) as FarmProduct[]);
    }

    setLoadingProducts(false);
  }, [farmId]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) || null,
    [products, productId]
  );

  const calculatedTotal =
    Math.max(0, Number(quantity) || 0) *
    Math.max(0, Number(unitPrice) || 0);

  function handleProductChange(nextId: string) {
    setProductId(nextId);

    const selected = products.find((product) => product.id === nextId);

    if (!selected) {
      setProductUnit("");
      setUnitPrice("");
      return;
    }

    setProductUnit(selected.unit || "unit");
    setUnitPrice(String(Number(selected.selling_price) || 0));
  }

  const groups = useMemo<OrderGroup[]>(() => {
    const byKey = new Map<string, OrderGroup>();

    for (const order of orders) {
      const batch = getBatchInfo(order);
      const key = order.order_batch_id || order.id;
      const existing = byKey.get(key);

      if (existing) {
        existing.lines.push(order);
        continue;
      }

 
      byKey.set(key, {
        key,
        batchId: order.order_batch_id,
        
reference: getBookingReference(order, batch),

        customerId: order.customer_id,
        customerName: order.customers?.name || "Customer",
        customerPhone: order.customers?.phone || null,
        customerCode:
          customers.find(
            (customer) => customer.customer_id === order.customer_id
          )?.customer_code ?? null,
        lines: [order],
        total:
          order.order_batch_id && batch
            ? Number(batch.total_amount)
            : Number(order.total_amount || 0),
        orderDate: order.order_date,
        proposedDeliveryDate:
        batch?.proposed_delivery_date || order.proposed_delivery_date || null,
        createdAt: order.created_at,
        status: batch?.status || order.status,
        paymentStatus: batch?.payment_status || order.payment_status,
        notes: order.notes,
        deliveryAddress: batch?.delivery_address || null,
        stateRegion: batch?.state_region || null,
      });
    }


    return Array.from(byKey.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }, [orders, customers]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesSearch =
        !term ||
        group.customerName.toLowerCase().includes(term) ||
        (group.customerPhone || "").toLowerCase().includes(term) ||
        group.reference.toLowerCase().includes(term) ||
        group.lines.some(
          (line) =>
            line.product_name.toLowerCase().includes(term) ||
            line.id.toLowerCase().includes(term)
        );

      const isPublic = Boolean(group.batchId);
      const matchesSource = sourceFilter === "all" ||
        (sourceFilter === "public" && isPublic) ||
        (sourceFilter === "internal" && !isPublic);

      return (
        matchesSearch &&
        matchesSource &&
        (statusFilter === "all" || group.status === statusFilter)
      );
    });
  }, [groups, search, statusFilter, sourceFilter]);

  // Value of unfulfilled goods: remaining quantity multiplied by each line's unit price.
  const pendingOrderValue = useMemo(() => groups
    .filter((group) => group.status !== "cancelled")
    .reduce((sum, group) => sum + group.lines.reduce((lineSum, line) => {
      const remaining = Math.max(0, Number(line.quantity || 0) - (fulfilledByOrder[line.id] || 0));
      return lineSum + remaining * Number(line.unit_price || 0);
    }, 0), 0), [groups, fulfilledByOrder]);

  // Customer advances are reserved payments not yet applied to sales, capped at the
  // value of the still-unfulfilled goods for the related order/checkout.
const customerAdvances = useMemo((): number => {
  const toNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
      const cleaned = value.trim().replace(/,/g, "");
      if (!cleaned) return 0;

      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  const pendingByTarget = new Map<string, number>();

  for (const group of groups) {
    if (group.status === "cancelled") continue;

    let pendingValue = 0;

    for (const line of group.lines) {
      const ordered = Math.max(0, toNumber(line.quantity));
      const fulfilled = Math.max(
        0,
        toNumber(fulfilledByOrder[line.id])
      );
      const unitPrice = Math.max(0, toNumber(line.unit_price));

      pendingValue += Math.max(0, ordered - fulfilled) * unitPrice;
    }

    const targetKey = group.batchId
      ? `batch:${group.batchId}`
      : group.lines[0]?.id
        ? `order:${group.lines[0].id}`
        : null;

    if (targetKey) {
      pendingByTarget.set(
        targetKey,
        (pendingByTarget.get(targetKey) || 0) + pendingValue
      );
    }
  }

  const reservationsByTarget = new Map<string, number>();

  for (const reservation of orderReservations) {
    const amount = Math.max(0, toNumber(reservation.amount));
    const applied = Math.max(
      0,
      toNumber(reservation.amount_applied_to_sales)
    );

    const remaining = Math.max(0, amount - applied);

    const targetKey = reservation.order_batch_id
      ? `batch:${reservation.order_batch_id}`
      : reservation.order_id
        ? `order:${reservation.order_id}`
        : null;

    if (!targetKey || remaining <= 0) continue;

    reservationsByTarget.set(
      targetKey,
      (reservationsByTarget.get(targetKey) || 0) + remaining
    );
  }

  let total = 0;

  for (const [targetKey, reserved] of reservationsByTarget) {
    const pending = pendingByTarget.get(targetKey) || 0;
    total += Math.min(reserved, pending);
  }

  return Number.isFinite(total) ? total : 0;
}, [groups, fulfilledByOrder, orderReservations]);

  const pendingCount = groups.filter(
    (group) => !["completed", "cancelled"].includes(group.status)
  ).length;

  const completedCount = groups.filter(
    (group) => group.status === "completed"
  ).length;

  function resetForm() {
    setCustomerId("");
    setProductId("");
    setProductUnit("");
    setQuantity("1");
    setUnitPrice("");
    setNotes("");
    setOrderDate(new Date().toISOString().slice(0, 10));
  }

 
  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!farmId || !user?.id) {
      setError(
        "Your signed-in farm could not be identified. Please refresh and try again."
      );
      return;
    }

    if (!customerId || !productId || !selectedProduct) {
      setError("Select a customer and a product from your catalogue.");
      return;
    }

    const orderQuantity = Number(quantity);
    const orderUnitPrice = Number(unitPrice);

    if (
      !Number.isFinite(orderQuantity) ||
      orderQuantity <= 0 ||
      !Number.isFinite(orderUnitPrice) ||
      orderUnitPrice < 0
    ) {
      setError("Enter a valid quantity and a non-negative unit price.");
      return;
    }

    const currentProduct = products.find(
      (product) => product.id === productId && product.active
    );

    if (!currentProduct) {
      setError(
        "The selected product is no longer available. Refresh the product list and select another product."
      );
      return;
    }

    setSaving(true);

    try {

const { error: insertError } = await supabase.from("orders").insert({
  farm_id: farmId,
  customer_id: customerId,
  product_id: currentProduct.id,
  product_name: currentProduct.name,
  quantity: orderQuantity,
  unit_price: orderUnitPrice,
  order_date: orderDate,
  notes: notes.trim() || null,
  status: "pending",
  payment_status: "unpaid",
  created_by: user.id,
});


      if (insertError) throw insertError;

      setSuccess("Order created successfully.");
      setShowForm(false);
      resetForm();
      await loadOrders();
    } catch (insertError) {
      console.error("Failed to create order:", insertError);
      setError(
        insertError instanceof Error
          ? insertError.message
          : "Unable to save the order. Please check the form and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateGroup(
    group: OrderGroup,
changes: Partial<Pick<OrderRecord, "status" | "dispatch_notes">>
  ) {
    setError("");
    setSuccess("");

    if (group.batchId) {
      // Keep the shared checkout and all its product lines aligned.
      const batchChanges: Record<string, string> = {};

      if (changes.status) {
        batchChanges.status = changes.status;
      }

      const { error: batchError } = await supabase
        .from("public_order_batches")
        .update(batchChanges)
        .eq("id", group.batchId)
        .eq("farm_id", farmId);

      if (batchError) {
        console.error("Failed to update checkout batch:", batchError);
        setError(
          "Could not update this checkout. Check the farm-member update policy for public order batches."
        );
        return;
      }

      const { error: lineError } = await supabase
        .from("orders")
        .update(changes)
        .eq("order_batch_id", group.batchId)
        .eq("farm_id", farmId);

      if (lineError) {
        console.error("Failed to update checkout lines:", lineError);
        setError(
          "The checkout status was updated, but one or more order lines could not be updated. Refresh and check the order."
        );
        return;
      }
    } else {
      const line = group.lines[0];

      const { error: updateError } = await supabase
        .from("orders")
        .update(changes)
        .eq("id", line.id)
        .eq("farm_id", farmId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        setError("Unable to update this order. Please try again.");
        return;
      }
    }

    setSuccess("Order updated.");
    await loadOrders();
  }

  if (dashboardLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="p-6 text-sm text-slate-500">
          Loading Orders...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell email={user?.email}>
      <div className="space-y-6 p-4 sm:p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <ClipboardList size={18} />
              POULTRYOPS OPERATIONS
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Orders
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer orders, order progress and payment status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void loadOrders();
                void loadProducts();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowForm((value) => !value);

                if (!showForm) {
                  void loadProducts();
                }
              }}
              className={buttonClass}
            >
              <Plus size={18} />
              New Order
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OperationsKpiCard
            label="Total Orders"
            value={groups.length}
            sublabel="Customer checkouts and existing orders"
            icon={<ClipboardList size={20} />}
          />

          <OperationsKpiCard
            label="Pending Orders"
            value={pendingCount}
            sublabel="Not yet completed or cancelled"
            icon={<Clock size={20} />}
          />

          <OperationsKpiCard
            label="Completed Orders"
            value={completedCount}
            sublabel="Orders marked completed"
            icon={<CheckCircle2 size={20} />}
          />

          <OperationsKpiCard
            label="Customer Advances"
            value={formatMoney(customerAdvances)}
            sublabel="Payments received for goods not yet supplied"
            icon={<Package size={20} />}
          />
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-1 text-sm font-medium text-slate-500">
            Order Value
          </div>

          <div className="text-2xl font-bold text-slate-900">
            {formatMoney(pendingOrderValue)}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Value of goods ordered but not yet supplied; fulfilled quantities are excluded.
          </p>
        </section>

        {showForm && (
          <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Create Order
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a customer and product from your catalogue. The current
                catalogue price is filled in automatically.
              </p>
            </div>

            <form
              onSubmit={createOrder}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Customer *
                <select
                  required
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className={inputClass}
                  disabled={customersLoading}
                >
                  <option value="">
                    {customersLoading
                      ? "Loading customers..."
                      : "Select customer"}
                  </option>

                  {customers
                    .filter((customer: any) => customer.active !== false)
                    .map((customer: any) => (
                      <option
                        key={customer.customer_id}
                        value={customer.customer_id}
                      >
                        {customer.name}
                        {customer.customer_code
                          ? ` (${customer.customer_code})`
                          : ""}
                      </option>
                    ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Product from Catalogue *
                <select
                  required
                  value={productId}
                  onChange={(event) =>
                    handleProductChange(event.target.value)
                  }
                  className={inputClass}
                  disabled={loadingProducts || products.length === 0}
                >
                  <option value="">
                    {loadingProducts
                      ? "Loading products..."
                      : products.length === 0
                        ? "No active catalogue products"
                        : "Select a product"}
                  </option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.unit ? ` — per ${product.unit}` : ""}
                    </option>
                  ))}
                </select>

                {productLoadError ? (
                  <span className="block text-xs font-normal text-red-600">
                    {productLoadError}
                  </span>
                ) : products.length === 0 && !loadingProducts ? (
                  <span className="block text-xs font-normal text-amber-700">
                    Add and activate products in Product Catalogue before
                    creating an order.
                  </span>
                ) : (
                  <span className="block text-xs font-normal text-slate-500">
                    Only active products belonging to your farm are listed.
                  </span>
                )}
              </label>

              {selectedProduct && (
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 md:col-span-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                    <ShoppingBag size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">
                      {selectedProduct.name}
                    </div>

                    {selectedProduct.category && (
                      <div className="mt-0.5 text-xs text-slate-500">
                        Category: {selectedProduct.category}
                      </div>
                    )}

                    {selectedProduct.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {selectedProduct.description}
                      </p>
                    )}

                    <div className="mt-2 text-sm font-semibold text-blue-800">
                      Catalogue price:{" "}
                      {formatMoney(Number(selectedProduct.selling_price) || 0)}
                      {selectedProduct.unit
                        ? ` per ${selectedProduct.unit}`
                        : ""}
                    </div>
                  </div>
                </div>
              )}

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Quantity *
                {productUnit && (
                  <span className="ml-1 font-normal text-slate-500">
                    (in {productUnit})
                  </span>
                )}

                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Unit price ({currency}) *
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  className={inputClass}
                  disabled={!selectedProduct}
                />

                <span className="block text-xs font-normal text-slate-500">
                  Can be adjusted for this order without changing the catalogue
                  price.
                </span>
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Order date *
                <input
                  required
                  type="date"
                  value={orderDate}
                  onChange={(event) => setOrderDate(event.target.value)}
                  className={inputClass}
                />
              </label>

              <div className="rounded-xl bg-blue-50 p-4">
                <div className="text-xs font-medium text-blue-700">
                  Calculated order total
                </div>

                <div className="mt-1 text-xl font-bold text-blue-900">
                  {formatMoney(calculatedTotal)}
                </div>

                <p className="mt-1 text-xs text-blue-700">
                  {Number(quantity) || 0} ×{" "}
                  {formatMoney(Number(unitPrice) || 0)}
                </p>
              </div>

              <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
                Notes (optional)
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Special requirements or customer instructions"
                  className={inputClass}
                />
              </label>

              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingProducts ||
                    products.length === 0 ||
                    !selectedProduct
                  }
                  className={buttonClass}
                >
                  {saving ? "Saving..." : "Save Order"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by customer, phone, product or order reference..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              aria-label="Filter by order source"
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className={`${inputClass} sm:w-48`}
            >
              <option value="all">All order sources</option>
              <option value="public">Public orders</option>
              <option value="internal">Internal orders</option>
            </select>

            <select
              aria-label="Filter by order status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} sm:w-56`}
            >
              <option value="all">All statuses</option>

              {ORDER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Order Register</h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredGroups.length} matching checkout
                {filteredGroups.length === 1 ? "" : "s"}
              </p>
            </div>

            {loadingOrders ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading orders...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList
                  className="mx-auto mb-3 text-slate-300"
                  size={36}
                />

                <p className="font-semibold text-slate-700">
                  No orders found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first order or change your search filters.
                </p>
              </div>
            ) : (
      <div className="divide-y divide-slate-100">
  {filteredGroups.map((group) => {
    const expanded = !!expandedGroups[group.key];

    const orderStatusLabel =
      ORDER_STATUSES.find((item) => item.value === group.status)?.label ??
      group.status;

    const paymentStatusLabel =
      PAYMENT_STATUSES.find(
        (item) => item.value === group.paymentStatus
      )?.label ?? group.paymentStatus;

    return (
      <article key={group.key} className="px-4 py-3 sm:px-5">
        {/* Compact summary — always visible */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(110px,0.7fr)_minmax(190px,1.2fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                {group.batchId
                  ? `Customer checkout · ${group.lines.length} product${group.lines.length === 1 ? "" : "s"}`
                  : group.lines[0].product_name}
              </h3>

              {group.batchId && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  Public order
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-600">
              {group.customerName}
              {group.customerPhone ? ` · ${group.customerPhone}` : ""}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {new Date(`${group.orderDate}T00:00:00`).toLocaleDateString(
                "en-GB"
              )}
              {" · "}
              {group.lines.length === 1
                ? `${Number(group.lines[0].quantity).toLocaleString()} units`
                : `${group.lines.length} order lines`}
            </p>
          </div>

          <div className="flex items-center lg:justify-center">
            <div className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 lg:text-center">
              <p className="font-bold text-blue-900">{formatMoney(group.total)}</p>
              <p className="text-xs text-blue-700">Order total</p>
            </div>
          </div>

         <div className="flex flex-wrap items-center gap-1.5 lg:flex-col lg:items-stretch">
  <span className="inline-flex min-h-7 w-fit max-w-full items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-center text-[11px] font-semibold leading-tight text-blue-700 lg:w-full lg:text-xs">
    {orderStatusLabel}
  </span>

  <span
    className={`inline-flex min-h-7 w-fit max-w-full items-center justify-center rounded-lg border px-2 py-1 text-center text-[11px] font-semibold leading-tight lg:w-full lg:text-xs ${statusStyle(group.paymentStatus)} border-current/10`}
  >
    {paymentStatusLabel}
  </span>
</div>
          <div className="flex lg:justify-end">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() =>
                setExpandedGroups(
                  expanded ? {} : { [group.key]: true }
                )
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              {expanded ? "Hide details" : "View details"}
              {expanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Operational workspace — visible for the selected order only */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            
 
            {/* Customer Booking Confirmation */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Customer Booking Confirmation
                  </h4>

                  <p className="mt-1 text-sm text-slate-600">
                    Share this booking privately with the customer.
                    This does not verify payment or confirm collection.
                  </p>

                  {group.batchId ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Booking reference: {group.reference}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Internal order — no public booking reference
                    </p>
                  )}

                  {group.customerCode && (
                    <p className="mt-1 text-xs text-slate-500">
                      Customer code: {group.customerCode}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => shareBookingConfirmation(group)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#1DA851]"
                >
                  <ShoppingBag size={16} />
                  Share on WhatsApp
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100">
              <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {group.batchId ? "Products in this checkout" : "Order item"}
              </div>

              <div className="divide-y divide-slate-100">
                {group.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {line.product_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Number(line.quantity).toLocaleString()} ×{" "}
                        {formatMoney(Number(line.unit_price))}
                      </p>
                      <p className="break-all text-xs text-slate-400">
                        Order line ID: {line.id}
                      </p>
                    </div>

                    <p className="font-semibold text-slate-900">
                      {formatMoney(Number(line.total_amount || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

{(group.proposedDeliveryDate || group.deliveryAddress) && (
  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 space-y-1">
    {group.proposedDeliveryDate && (
      <p>
        <span className="font-semibold">
          Proposed collection/delivery date:
        </span>{" "}
        {new Date(
          `${group.proposedDeliveryDate.slice(0, 10)}T00:00:00`
        ).toLocaleDateString("en-GB")}
      </p>
    )}

    {group.deliveryAddress && (
      <p>
        <span className="font-semibold">Delivery address:</span>{" "}
        {group.deliveryAddress}
        {group.stateRegion ? `, ${group.stateRegion}` : ""}
      </p>
    )}
  </div>
)}

            {group.notes && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Notes:</span> {group.notes}
              </p>
            )}

            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-800">
                Order progress
              </h4>

              <label className="block max-w-md space-y-1.5 text-xs font-medium text-slate-500">
                Fulfilment status
                <select
                  value={group.status}
                  onChange={(event) =>
                    void updateGroup(group, {
                      status: event.target.value as OrderStatus,
                    })
                  }
                  className={inputClass}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="mt-2 text-xs text-slate-500">
                Fulfilment status describes the goods. Payment status above
                separately describes the money received.
              </p>
            </div>

            {group.status !== "cancelled" && (
              <VerifyOrderPaymentForm
                orderId={group.batchId ? undefined : group.lines[0].id}
                orderBatchId={group.batchId ?? undefined}
                currency={currency}
                onSuccess={loadOrders}
              />
            )}

            {group.lines.map((line) => {
              const isWholeNumberQuantity =
                Number.isSafeInteger(Number(line.quantity)) &&
                Number(line.quantity) > 0;

              return (
                <div
                  key={`fulfilment-${line.id}`}
                  className="space-y-2"
                >
                  <h4 className="text-sm font-semibold text-slate-800">
                    Collections & fulfilment: {line.product_name}
                  </h4>

                  {isWholeNumberQuantity ? (
                    <OrderFulfilmentPanel
                      orderId={line.id}
                      orderedQuantity={Number(line.quantity)}
                      currency={currency}
                      disabled={group.status === "cancelled"}
                      onSuccess={async () => {
                        await loadOrders();
                      }}
                    />
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Fulfilment recording is unavailable because this order
                      quantity is not a positive whole number. Review the
                      order and product unit before recording a delivery.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </article>
    );
  })}
</div>
            )}
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <XCircle size={18} className="mt-0.5 shrink-0" />

          <p>
            <strong>Financial control:</strong> Payment status is an internal
            tracking field. Do not mark a payment as verified solely because a
            customer supplies a transfer receipt. Verified payment recording
            and automatic conversion to Sales remain separate workflows.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
