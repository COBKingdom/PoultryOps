"use client";

import React from "react";

import { ROLES } from "@/lib/permissions";

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
  disabled?: boolean;
}

export default function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Role
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(ROLES.MANAGER)}
          disabled={disabled}
          className={`
            rounded-xl border-2 p-4 text-left transition-all
            ${value === ROLES.MANAGER
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${value === ROLES.MANAGER ? "border-blue-500" : "border-slate-300"}
            `}>
              {value === ROLES.MANAGER && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
            <span className="font-semibold text-slate-900">Manager</span>
          </div>
          <p className="text-xs text-slate-500 ml-6">
            Full operational access
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange(ROLES.STAFF)}
          disabled={disabled}
          className={`
            rounded-xl border-2 p-4 text-left transition-all
            ${value === ROLES.STAFF
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${value === ROLES.STAFF ? "border-blue-500" : "border-slate-300"}
            `}>
              {value === ROLES.STAFF && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
            <span className="font-semibold text-slate-900">Staff</span>
          </div>
          <p className="text-xs text-slate-500 ml-6">
            Basic operational access
          </p>
        </button>
      </div>
    </div>
  );
}