export default function SettingsPage() {
  return (
    <div className="space-y-6">

      <div className="bg-white rounded-2xl border border-slate-200 p-6">

        <h1 className="text-3xl font-bold">
          Settings
        </h1>

        <p className="text-slate-500 mt-2">
          Manage your farm preferences and account settings.
        </p>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">

        <h2 className="text-xl font-semibold mb-4">
          Farm Preferences
        </h2>

        <label className="block text-sm font-medium mb-2">
          Currency
        </label>

        <select
          className="
            w-full
            border
            rounded-lg
            p-3
          "
          defaultValue="NGN"
        >
          <option value="NGN">
            Nigerian Naira (₦)
          </option>

          <option value="USD">
            US Dollar ($)
          </option>

          <option value="EUR">
            Euro (€)
          </option>

          <option value="GBP">
            British Pound (£)
          </option>

          <option value="CAD">
            Canadian Dollar (C$)
          </option>

          <option value="AUD">
            Australian Dollar (A$)
          </option>

          <option value="ZAR">
            South African Rand (R)
          </option>

          <option value="GHS">
            Ghanaian Cedi (GH₵)
          </option>

          <option value="KES">
            Kenyan Shilling (KSh)
          </option>
        </select>

      </div>

    </div>
  );
}