"use client";

import Link from "next/link";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileSidebar({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  const links = [
    "/dashboard",
    "/flocks",
    "/eggs",
    "/feed",
    "/feed-inventory",
    "/mortality",
    "/medication",
    "/expenses",
    "/sales",
    "/reports",
    "/analytics",
    "/settings",
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <aside className="fixed left-0 top-0 h-full w-72 bg-slate-950 text-white z-50 p-6">

        <div className="flex justify-between items-center mb-8">

          <h2 className="text-xl font-bold">
            PoultryOps
          </h2>

          <button onClick={onClose}>
            <X />
          </button>

        </div>

        <nav className="space-y-3">

          {links.map((link) => (
            <Link
              key={link}
              href={link}
              onClick={onClose}
              className="block rounded-lg px-3 py-2 hover:bg-slate-800"
            >
              {link.replace("/", "")}
            </Link>
          ))}

        </nav>

      </aside>
    </>
  );
}