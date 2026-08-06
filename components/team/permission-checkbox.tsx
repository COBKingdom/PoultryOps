"use client";

import React from "react";

interface PermissionCheckboxProps {
  permission: string;
  label: string;
  checked: boolean;
  onChange: (permission: string, checked: boolean) => void;
  disabled?: boolean;
}

export default function PermissionCheckbox({
  permission,
  label,
  checked,
  onChange,
  disabled = false,
}: PermissionCheckboxProps) {
  return (
    <label
      className={`
        flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer transition-colors
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"}
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(permission, e.target.checked)}
        disabled={disabled}
        className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
      />
      <span className="text-xs text-slate-700 truncate">{label}</span>
    </label>
  );
}