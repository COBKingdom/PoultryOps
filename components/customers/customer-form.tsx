"use client";

import { FormEvent, useState } from "react";
import { UserPlus, X } from "lucide-react";

import {
  CustomerInput,
  createCustomer,
} from "@/lib/customers";

type CustomerFormProps = {
  farmId: string;
  onSaved: () => Promise<void> | void;
  onClose?: () => void;
};

export default function CustomerForm({
  farmId,
  onSaved,
  onClose,
}: CustomerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    const input: CustomerInput = {
      name,
      phone,
      address,
      location,
      notes,
      active: true,
    };

    try {
      setSaving(true);

      const customer = await createCustomer(farmId, input);

      await onSaved();

      setName("");
      setPhone("");
      setAddress("");
      setLocation("");
      setNotes("");

      alert(
        `Customer created successfully.\n\nCustomer Code: ${customer.customer_code}`
      );

      onClose?.();
    } catch (err) {
      console.error("Failed to create customer:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create customer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserPlus size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Add Customer
            </h2>
            <p className="text-xs text-slate-400">
              Register a new customer
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer full name"
            className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            type="tel"
            className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Address
          </label>

          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Customer address"
            rows={2}
            className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            State / Region
          </label>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="State / Region"
            className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={2}
            className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Creating Customer..." : "Create Customer"}
        </button>
      </form>
    </div>
  );
}