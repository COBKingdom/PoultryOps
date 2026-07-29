"use client";

import { useEffect, useState } from "react";

import { X, Calendar, Package, Truck, FileText } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: any) => Promise<void>;
  flock?: any | null;
};

type FormData = {
  flock_name: string;
  bird_type: string;
  quantity: string;
  batch_number: string;
  breed: string;
  age_weeks: string;
  supplier: string;
  arrival_date: string;
  house: string;
  pen: string;
  notes: string;
};

export default function FlockModal({
  isOpen,
  onClose,
  onSave,
  flock,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    flock_name: "",
    bird_type: "Layers",
    quantity: "",
    batch_number: "",
    breed: "",
    age_weeks: "",
    supplier: "",
    arrival_date: "",
    house: "",
    pen: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (flock) {
        setFormData({
          flock_name: flock.flock_name || "",
          bird_type: flock.bird_type || "Layers",
          quantity: String(flock.quantity || ""),
          batch_number: flock.batch_number || "",
          breed: flock.breed || "",
          age_weeks: flock.age_weeks ? String(flock.age_weeks) : "",
          supplier: flock.supplier || "",
          arrival_date: flock.arrival_date || "",
          house: flock.house || "",
          pen: flock.pen || "",
          notes: flock.notes || "",
        });
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [isOpen, flock]);

  function resetForm() {
    setFormData({
      flock_name: "",
      bird_type: "Layers",
      quantity: "",
      batch_number: "",
      breed: "",
      age_weeks: "",
      supplier: "",
      arrival_date: "",
      house: "",
      pen: "",
      notes: "",
    });
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.flock_name.trim()) {
      newErrors.flock_name = "Flock name is required";
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Number of birds must be greater than zero";
    }

    if (formData.arrival_date && new Date(formData.arrival_date) > new Date()) {
      newErrors.arrival_date = "Arrival date cannot be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      await onSave({
        flock_name: formData.flock_name,
        bird_type: formData.bird_type,
        quantity: Number(formData.quantity),
        batch_number: formData.batch_number || null,
        breed: formData.breed || null,
        age_weeks: formData.age_weeks ? Number(formData.age_weeks) : null,
        supplier: formData.supplier || null,
        arrival_date: formData.arrival_date || null,
        house: formData.house || null,
        pen: formData.pen || null,
        notes: formData.notes || null,
      });

      onClose();
    } catch (error) {
      console.error("Failed to save flock:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    onClose();
    resetForm();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {flock ? "Edit Flock" : "Register New Flock"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {flock
                ? "Update your flock information below."
                : "Fill in the details to register a new poultry flock."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Package className="text-blue-600" size={22} />
                General Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Flock Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.flock_name}
                    onChange={(e) =>
                      setFormData({ ...formData, flock_name: e.target.value })
                    }
                    placeholder="e.g. Layer House A"
                    className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                      errors.flock_name ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  {errors.flock_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.flock_name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Bird Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bird_type}
                    onChange={(e) =>
                      setFormData({ ...formData, bird_type: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Layers">Layers</option>
                    <option value="Broilers">Broilers</option>
                    <option value="Growers">Growers</option>
                    <option value="Cockerels">Cockerels</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) =>
                      setFormData({ ...formData, batch_number: e.target.value })
                    }
                    placeholder="e.g. BTH-2024-001"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) =>
                      setFormData({ ...formData, breed: e.target.value })
                    }
                    placeholder="e.g. Hy-Line Brown"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Package className="text-green-600" size={22} />
                Bird Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Number of Birds <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="Enter bird quantity"
                    className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                      errors.quantity ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Age (Weeks)
                  </label>
                  <input
                    type="number"
                    value={formData.age_weeks}
                    onChange={(e) =>
                      setFormData({ ...formData, age_weeks: e.target.value })
                    }
                    placeholder="e.g. 24"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Truck className="text-purple-600" size={22} />
                Source Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    placeholder="e.g. ABC Hatchery"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={formData.arrival_date}
                    onChange={(e) =>
                      setFormData({ ...formData, arrival_date: e.target.value })
                    }
                    className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                      errors.arrival_date ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  {errors.arrival_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.arrival_date}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    House
                  </label>
                  <input
                    type="text"
                    value={formData.house}
                    onChange={(e) =>
                      setFormData({ ...formData, house: e.target.value })
                    }
                    placeholder="e.g. House A"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Pen
                  </label>
                  <input
                    type="text"
                    value={formData.pen}
                    onChange={(e) =>
                      setFormData({ ...formData, pen: e.target.value })
                    }
                    placeholder="e.g. Pen 1"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <FileText className="text-slate-600" size={22} />
                Notes
              </h3>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes about this flock..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? "Saving..." : flock ? "Update Flock" : "Create Flock"}
          </button>
        </div>
      </div>
    </div>
  );
}