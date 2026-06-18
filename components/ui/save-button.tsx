"use client";

type Props = {
  loading: boolean;
  success: boolean;
  label?: string;
};

export default function SaveButton({
  loading,
  success,
  label = "Save",
}: Props) {
  let buttonText = label;

  let buttonClass =
    "bg-slate-900 hover:bg-slate-800";

  if (loading) {
    buttonText = "Saving...";

    buttonClass =
      "bg-slate-500 cursor-not-allowed";
  }

  if (success) {
    buttonText = "Saved ✓";

    buttonClass =
      "bg-green-600";
  }

  return (
    <button
      type="submit"
      disabled={loading}
      className={`
        w-full
        rounded-xl
        px-4
        py-3
        text-white
        font-semibold
        transition-all
        duration-300
        ${buttonClass}
      `}
    >
      {buttonText}
    </button>
  );
}