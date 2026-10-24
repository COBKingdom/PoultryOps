
"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, UserPlus, X } from "lucide-react";

import {
  CustomerBalance,
  CustomerInput,
  createCustomer,
  getCustomerRecord,
  updateCustomer,
} from "@/lib/customers";

type CustomerFormProps = {
  farmId: string;
  customer?: CustomerBalance | null;
  onSaved: () => Promise<void> | void;
  onClose?: () => void;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50";

type PhoneCountry = "NG" | "IE" | "INTL" | "KEEP";

function detectPhoneCountry(phone: string): PhoneCountry {
  const value = phone.trim();

  if (value.startsWith("+234")) return "NG";
  if (value.startsWith("+353")) return "IE";

  return value.startsWith("+") ? "INTL" : "KEEP";
}

function preparePhoneForStorage(
  phone: string,
  country: PhoneCountry
): string {
  const trimmed = phone.trim();

  if (country === "KEEP") {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (country === "INTL") {
    if (!trimmed.startsWith("+")) {
      throw new Error(
        "For international numbers, enter the full number starting with + and the country code."
      );
    }

    if (digits.length < 8 || digits.length > 15) {
      throw new Error("Enter a valid international phone number.");
    }

    return `+${digits}`;
  }

  const prefix = country === "NG" ? "+234" : "+353";
  const countryDigits = country === "NG" ? "234" : "353";

  let nationalNumber = digits;

  if (nationalNumber.startsWith(countryDigits)) {
    nationalNumber = nationalNumber.slice(countryDigits.length);
  } else if (nationalNumber.startsWith("0")) {
    nationalNumber = nationalNumber.slice(1);
  }

  const result = `${prefix}${nationalNumber}`;

  if (nationalNumber.length < 7 || nationalNumber.length > 12) {
    throw new Error(
      "Check the phone number and country code before saving."
    );
  }

  return result;
}

export default function CustomerForm({
  farmId,
  customer = null,
  onSaved,
  onClose,
}: CustomerFormProps) {
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(
    customer ? detectPhoneCountry(customer.phone ?? "") : "NG"
  );
  const [address, setAddress] = useState(customer?.address ?? "");
  const [location, setLocation] = useState(customer?.location ?? "");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(customer?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(Boolean(customer));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCustomerRecord() {
      if (!customer) {
        setLoadingRecord(false);
        return;
      }

      try {
        setLoadingRecord(true);
        setError("");

        const record = await getCustomerRecord(
          farmId,
          customer.customer_id
        );

        if (!record) {
          throw new Error("Customer record could not be found.");
        }

        if (cancelled) return;

        setName(record.name);
        setPhone(record.phone);
        setPhoneCountry(detectPhoneCountry(record.phone ?? ""));
        setAddress(record.address ?? "");
        setLocation(record.location ?? "");
        setNotes(record.notes ?? "");
        setActive(record.active);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customer details."
        );
      } finally {
        if (!cancelled) setLoadingRecord(false);
      }
    }

    void loadCustomerRecord();

    return () => {
      cancelled = true;
    };
  }, [farmId, customer]);

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

    let savedPhone: string;

    try {
      savedPhone = preparePhoneForStorage(phone, phoneCountry);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Please check the phone number."
      );
      return;
    }

    const input: CustomerInput = {
      name: name.trim(),
      phone: savedPhone,
      address: address.trim(),
      location: location.trim(),
      notes: notes.trim(),
      active,
    };

    try {
      setSaving(true);

      if (customer) {
        await updateCustomer(farmId, customer.customer_id, input);
      } else {
        const created = await createCustomer(farmId, input);
        await onSaved();

        alert(
          `Customer created successfully.\n\nCustomer Code: ${created.customer_code}`
        );

        onClose?.();
        return;
      }

      await onSaved();

      alert(
        `Customer details updated successfully.\n\nCustomer Code: ${customer.customer_code}`
      );

      onClose?.();
    } catch (err) {
      console.error("Failed to save customer:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save customer details."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {customer ? <Pencil size={20} /> : <UserPlus size={20} />}
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              {customer ? "Edit Customer" : "Add Customer"}
            </h2>

            <p className="text-xs text-slate-400">
              {customer
                ? `Update customer details · ${customer.customer_code}`
                : "Register a new customer"}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close customer form"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer full name"
            required
            disabled={loadingRecord || saving}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Phone Number <span className="text-red-500">*</span>
          </label>

          <select
            value={phoneCountry}
            onChange={(e) => {
              const nextCountry = e.target.value as PhoneCountry;
              setPhoneCountry(nextCountry);
            }}
            disabled={loadingRecord || saving}
            className={`${inputClass} mb-2`}
          >
            <option value="NG">Nigeria (+234)</option>
            <option value="IE">Ireland (+353)</option>
            <option value="INTL">Other country — full international number</option>
            <option value="KEEP">Keep existing number format</option>
          </select>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={
              phoneCountry === "NG"
                ? "e.g. 08012345678"
                : phoneCountry === "IE"
                  ? "e.g. 0871234567"
                  : phoneCountry === "INTL"
                    ? "+ country code and number"
                    : "Existing phone number"
            }
            type="tel"
            autoComplete="tel"
            required
            disabled={loadingRecord || saving}
            className={inputClass}
          />

          <p className="mt-1 text-xs text-slate-400">
            Choose the customer's country. Existing numbers without a
            recognised international prefix are preserved unless you
            explicitly select a country.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Customer address"
            rows={2}
            disabled={loadingRecord || saving}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            State / Region
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="State / Region"
            disabled={loadingRecord || saving}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={2}
            disabled={loadingRecord || saving}
            className={`${inputClass} resize-none`}
          />
        </div>

        {customer && (
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={loadingRecord || saving}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Customer account active
            </span>
          </label>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || loadingRecord}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingRecord
            ? "Loading Customer..."
            : saving
              ? customer
                ? "Saving Changes..."
                : "Creating Customer..."
              : customer
                ? "Save Changes"
                : "Create Customer"}
        </button>
      </form>
    </div>
  );
}
