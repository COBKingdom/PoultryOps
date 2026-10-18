
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  RefreshCw,
  X,
  CheckCircle2,
  PauseCircle,
  ImagePlus,
  Trash2,
  Image as ImageIcon,
  Layers3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/app-shell";

type Product = {
  id: string;
  farm_id: string;
  name: string;
  category: string;
  unit: string;
  selling_price: number;
  description: string | null;
  active: boolean;
  created_at: string;
  flock_id: string | null;
  image_path: string | null;
};

type Flock = {
  id: string;
  flock_name: string;
  status?: string | null;
};

const CATEGORIES = [
  "Eggs",
  "Live Birds",
  "Spent Layers",
  "Poultry Manure",
  "Feed",
  "Other Products",
];

const UNITS = [
  "crate",
  "bird",
  "kg",
  "bag",
  "tonne",
  "tray",
  "piece",
  "litre",
  "unit",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const MAX_IMAGE_BYTES = 1024 * 1024;
const TARGET_IMAGE_BYTES = 500 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "This image could not be opened. Please choose a JPEG, PNG or WebP image."
        )
      );
    };

    image.src = objectUrl;
  });
}

async function compressProductImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  ) {
    throw new Error("Please use a JPEG, PNG or WebP image.");
  }

  const image = await loadImage(file);

  let scale = Math.min(
    1,
    800 / Math.max(image.naturalWidth, image.naturalHeight)
  );

  for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(
      1,
      Math.round(image.naturalWidth * scale)
    );

    canvas.height = Math.max(
      1,
      Math.round(image.naturalHeight * scale)
    );

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Your browser could not process this image. Please try another image."
      );
    }

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    for (const quality of [0.82, 0.74, 0.66, 0.58, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", quality);
      });

      if (!blob) continue;

      if (
        blob.size <= TARGET_IMAGE_BYTES ||
        (blob.size <= MAX_IMAGE_BYTES && resizeAttempt === 4)
      ) {
        return new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, "") || "product-image"}.webp`,
          {
            type: "image/webp",
            lastModified: Date.now(),
          }
        );
      }
    }

    scale *= 0.8;
  }

  throw new Error(
    "This image could not be compressed below 1 MB. Please choose a smaller image."
  );
}

export default function ProductsPage() {
  const { user, profile } = useAuth();

  const {
    data: dashboardData,
    loading: dashboardLoading,
  } = useDashboard();

  const farmId =
    profile?.farm_id ||
    (dashboardData as any)?.farm?.id ||
    (dashboardData as any)?.farmId ||
    "";

  const currency =
    (dashboardData as any)?.farm?.currency ||
    (dashboardData as any)?.currency ||
    "NGN";

  const [products, setProducts] = useState<Product[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("active");

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Eggs");
  const [customCategory, setCustomCategory] = useState("");
  const [unit, setUnit] = useState("crate");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const [flockId, setFlockId] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(
    null
  );
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const money = useCallback(
    (amount: number) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount || 0),
    [currency]
  );

  const loadProducts = useCallback(async () => {
    if (!farmId) {
      setProducts([]);
      setImageUrls({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("farm_products")
      .select(
        "id, farm_id, name, category, unit, selling_price, description, active, created_at, flock_id, image_path"
      )
      .eq("farm_id", farmId)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (queryError) {
      console.error("Unable to load products:", queryError);

      setError(
        "Unable to load products. Confirm that the Product Catalogue SQL and image columns have been applied."
      );

      setProducts([]);
      setImageUrls({});
      setLoading(false);
      return;
    }

    const rows = (data || []) as Product[];

    setProducts(rows);

    const entries = await Promise.all(
      rows
        .filter((product) => product.image_path)
        .map(async (product) => {
          const { data: signed, error: signedError } =
            await supabase.storage
              .from("product-images")
              .createSignedUrl(product.image_path as string, 60 * 60);

          if (signedError || !signed?.signedUrl) {
            return null;
          }

          return [product.id, signed.signedUrl] as const;
        })
    );

    const urls: Record<string, string> = {};

    entries.forEach((entry) => {
      if (entry) {
        urls[entry[0]] = entry[1];
      }
    });

    setImageUrls(urls);
    setLoading(false);
  }, [farmId]);

  const loadFlocks = useCallback(async () => {
    if (!farmId) {
      setFlocks([]);
      return;
    }

    const { data, error: flockError } = await supabase
      .from("flocks")
      .select("id, flock_name, status")
      .eq("farm_id", farmId)
      .order("flock_name", { ascending: true });

    if (flockError) {
      console.error(
        "Unable to load flocks for product association:",
        flockError
      );

      setFlocks([]);
      return;
    }

    setFlocks((data || []) as Flock[]);
  }, [farmId]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadFlocks();
  }, [loadFlocks]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(selectedImage);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category))].sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description || "").toLowerCase().includes(term);

      const matchesCategory =
        categoryFilter === "all" ||
        product.category === categoryFilter;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "active" && product.active) ||
        (availabilityFilter === "inactive" && !product.active);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    availabilityFilter,
  ]);

  const activeCount = products.filter(
    (product) => product.active
  ).length;

  const inactiveCount = products.length - activeCount;

  function resetForm() {
    setEditingProduct(null);
    setName("");
    setCategory("Eggs");
    setCustomCategory("");
    setUnit("crate");
    setPrice("");
    setDescription("");
    setActive(true);
    setFlockId("");
    setSelectedImage(null);
    setImagePreview("");
    setRemoveImage(false);
    setFormOpen(false);
    setImageProcessing(false);
  }

  function startCreate() {
    setError("");
    setSuccess("");
    resetForm();
    setFormOpen(true);
  }

  function startEdit(product: Product) {
    setError("");
    setSuccess("");

    setEditingProduct(product);
    setName(product.name);

    setCategory(
      CATEGORIES.includes(product.category)
        ? product.category
        : "Other Products"
    );

    setCustomCategory(
      CATEGORIES.includes(product.category)
        ? ""
        : product.category
    );

    setUnit(product.unit);
    setPrice(String(product.selling_price));
    setDescription(product.description || "");
    setActive(product.active);
    setFlockId(product.flock_id || "");
    setSelectedImage(null);
    setRemoveImage(false);
    setFormOpen(true);
  }

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError("");
    setImageProcessing(true);
    setSelectedImage(null);

    try {
      const compressed = await compressProductImage(file);

      if (compressed.size > MAX_IMAGE_BYTES) {
        throw new Error(
          "The compressed image exceeds the 1 MB storage limit. Please choose another image."
        );
      }

      setSelectedImage(compressed);
      setRemoveImage(false);

      setSuccess(
        `Image prepared (${Math.max(
          1,
          Math.round(compressed.size / 1024)
        )} KB). It will upload when you save the product.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process this image."
      );
    } finally {
      setImageProcessing(false);
    }
  }

  async function uploadProductImage(
    productId: string,
    file: File
  ): Promise<string> {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Image exceeds the 1 MB storage limit.");
    }

    const path = `${farmId}/${productId}/${crypto.randomUUID()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      throw new Error(
        `Product saved, but image upload failed: ${uploadError.message}`
      );
    }

    return path;
  }

  async function saveProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!farmId || !user?.id) {
      setError(
        "Your farm or signed-in account could not be identified."
      );
      return;
    }

    const finalCategory =
      category === "Other Products"
        ? customCategory.trim()
        : category.trim();

    if (!name.trim() || !finalCategory || !unit) {
      setError("Enter a product name, category and unit.");
      return;
    }

    const numericPrice = Number(price);

    if (
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError(
        "Enter a valid selling price of zero or greater."
      );
      return;
    }

    if (imageProcessing) {
      setError("Please wait for image compression to finish.");
      return;
    }

    setSaving(true);

    const values = {
      name: name.trim(),
      category: finalCategory,
      unit,
      selling_price: numericPrice,
      description: description.trim() || null,
      active,
      flock_id: flockId || null,
      updated_at: new Date().toISOString(),
    };

    let productId = editingProduct?.id || "";
    const oldImagePath = editingProduct?.image_path || null;
    let newImagePath = oldImagePath;

    if (editingProduct) {
      const { error: updateError } = await supabase
        .from("farm_products")
        .update(values)
        .eq("id", editingProduct.id)
        .eq("farm_id", farmId);

      if (updateError) {
        console.error("Unable to update product:", updateError);
        setSaving(false);
        setError(
          updateError.message || "Unable to update this product."
        );
        return;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("farm_products")
        .insert({
          ...values,
          farm_id: farmId,
          created_by: user.id,
        })
        .select("id, image_path")
        .single();

      if (insertError || !inserted) {
        console.error("Unable to create product:", insertError);
        setSaving(false);
        setError(
          insertError?.message || "Unable to add this product."
        );
        return;
      }

      productId = inserted.id;
      newImagePath = inserted.image_path || null;
    }

    try {
      if (selectedImage) {
        newImagePath = await uploadProductImage(
          productId,
          selectedImage
        );

        const { error: imageUpdateError } = await supabase
          .from("farm_products")
          .update({
            image_path: newImagePath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId)
          .eq("farm_id", farmId);

        if (imageUpdateError) {
          await supabase.storage
            .from("product-images")
            .remove([newImagePath]);

          throw new Error(
            `Product details were saved, but the image reference could not be saved: ${imageUpdateError.message}`
          );
        }
      } else if (removeImage && oldImagePath) {
        newImagePath = null;

        const { error: removeRefError } = await supabase
          .from("farm_products")
          .update({
            image_path: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId)
          .eq("farm_id", farmId);

        if (removeRefError) {
          throw new Error(
            `Product details were saved, but the image could not be removed from the product: ${removeRefError.message}`
          );
        }
      }

      if (oldImagePath && newImagePath !== oldImagePath) {
        const { error: oldImageError } = await supabase.storage
          .from("product-images")
          .remove([oldImagePath]);

        if (oldImageError) {
          console.warn(
            "Old product image could not be cleaned up:",
            oldImageError.message
          );
        }
      }

      setSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product added to the catalogue."
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      console.error("Product image operation failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Product saved, but the image operation failed. Please check and retry."
      );

      await loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("farm_products")
      .update({
        active: !product.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .eq("farm_id", farmId);

    if (updateError) {
      console.error(
        "Unable to change product availability:",
        updateError
      );

      setError("Unable to change product availability.");
      return;
    }

    setSuccess(
      product.active
        ? "Product marked unavailable."
        : "Product is available again."
    );

    await loadProducts();
  }

  if (dashboardLoading) {
    return (
      <AppShell email={user?.email}>
        <div className="p-6 text-sm text-slate-500">
          Loading Product Catalogue...
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
              <Package size={18} />
              POULTRYOPS OPERATIONS
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Product Catalogue
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage product images, flock associations, categories,
              selling prices and availability for your farm.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void loadProducts();
                void loadFlocks();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={startCreate}
              className={primaryButton}
            >
              <Plus size={18} />
              Add Product
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Products",
              value: products.length,
              detail: "Products in your catalogue",
              icon: <Package size={20} />,
            },
            {
              label: "Available",
              value: activeCount,
              detail: "Available to select for orders",
              icon: <CheckCircle2 size={20} />,
            },
            {
              label: "Unavailable",
              value: inactiveCount,
              detail: "Hidden from new order selection",
              icon: <PauseCircle size={20} />,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {item.label}
                </span>

                <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  {item.icon}
                </span>
              </div>

              <div className="mt-3 text-3xl font-bold text-slate-900">
                {item.value}
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {item.detail}
              </p>
            </div>
          ))}
        </section>

        {formOpen && (
          <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Product images are converted to WebP and compressed
                  before upload (target 500 KB; maximum 1 MB).
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={saveProduct}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Product name *
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Large eggs"
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Category *
                <select
                  required
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              {category === "Other Products" && (
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  Custom category *
                  <input
                    required
                    value={customCategory}
                    onChange={(event) =>
                      setCustomCategory(event.target.value)
                    }
                    placeholder="Enter category name"
                    className={inputClass}
                  />
                </label>
              )}

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Unit of measure *
                <select
                  required
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  className={inputClass}
                >
                  {UNITS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Selling price ({currency}) *
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Associated flock (optional)
                <select
                  value={flockId}
                  onChange={(event) => setFlockId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">No specific flock</option>

                  {flocks.map((flock) => (
                    <option key={flock.id} value={flock.id}>
                      {flock.flock_name}
                      {flock.status ? ` · ${flock.status}` : ""}
                    </option>
                  ))}
                </select>

                <span className="block text-xs font-normal text-slate-500">
                  Only flocks belonging to your farm are listed.
                </span>
              </label>

              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium text-slate-700">
                  Product image (optional)
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Selected product preview"
                        className="h-full w-full object-cover"
                      />
                    ) : editingProduct &&
                      !removeImage &&
                      imageUrls[editingProduct.id] ? (
                      <img
                        src={imageUrls[editingProduct.id]}
                        alt={`${editingProduct.name} product`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <ImageIcon size={30} />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Show customers what you sell
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Choose a JPEG, PNG or WebP image. PoultryOps
                      resizes it to fit within 800 × 800 pixels and
                      compresses it before upload.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <label
                        className={`${primaryButton} cursor-pointer ${
                          imageProcessing || saving
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      >
                        <ImagePlus size={16} />

                        {imageProcessing
                          ? "Compressing image…"
                          : selectedImage
                            ? "Choose another image"
                            : editingProduct &&
                                editingProduct.image_path &&
                                !removeImage
                              ? "Replace image"
                              : "Choose image"}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) =>
                            void handleImageChange(event)
                          }
                          disabled={imageProcessing || saving}
                          className="sr-only"
                        />
                      </label>

                      {(selectedImage ||
                        (editingProduct?.image_path && !removeImage)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setRemoveImage(true);
                            setSuccess("");
                          }}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Remove image
                        </button>
                      )}

                      {removeImage && (
                        <button
                          type="button"
                          onClick={() => setRemoveImage(false)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Keep existing image
                        </button>
                      )}
                    </div>

                    {selectedImage && (
                      <p className="mt-2 text-xs text-emerald-700">
                        Ready to upload ·{" "}
                        {Math.max(
                          1,
                          Math.round(selectedImage.size / 1024)
                        )}{" "}
                        KB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
                Description (optional)
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Product size, grade or other details"
                  className={inputClass}
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) =>
                    setActive(event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                Available for new orders
              </label>

              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving || imageProcessing}
                  className={primaryButton}
                >
                  {saving
                    ? "Saving product…"
                    : editingProduct
                      ? "Save Changes"
                      : "Save Product"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products or categories..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className={`${inputClass} lg:w-56`}
            >
              <option value="all">All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(event) =>
                setAvailabilityFilter(event.target.value)
              }
              className={`${inputClass} lg:w-48`}
            >
              <option value="active">Available</option>
              <option value="inactive">Unavailable</option>
              <option value="all">All products</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Products</h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredProducts.length} matching product
                {filteredProducts.length === 1 ? "" : "s"}
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-10 text-center">
                <Package
                  className="mx-auto mb-3 text-slate-300"
                  size={36}
                />

                <p className="font-semibold text-slate-700">
                  No products found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a product to begin building your farm catalogue.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const flockName = flocks.find(
                    (flock) => flock.id === product.flock_id
                  )?.flock_name;

                  return (
                    <article
                      key={product.id}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-600">
                          {imageUrls[product.id] ? (
                            <img
                              src={imageUrls[product.id]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package size={26} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {product.name}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            {product.category} · Per {product.unit}
                          </div>

                          {flockName && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-700">
                              <Layers3 size={13} />
                              {flockName}
                            </div>
                          )}

                          {product.description && (
                            <p className="mt-1 text-sm text-slate-500">
                              {product.description}
                            </p>
                          )}

                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              product.active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {product.active
                              ? "Available"
                              : "Unavailable"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <div className="mr-2">
                          <div className="text-lg font-bold text-slate-900">
                            {money(Number(product.selling_price))}
                          </div>

                          <div className="text-xs text-slate-500">
                            per {product.unit}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void toggleActive(product)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {product.active
                            ? "Mark unavailable"
                            : "Reactivate"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
