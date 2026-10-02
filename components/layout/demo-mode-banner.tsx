"use client";

import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";

export default function DemoModeBanner() {
  return (
    <div className="border-b border-blue-200 bg-blue-50">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Eye size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-blue-700">
                DEMO MODE
              </span>

              <span className="hidden text-xs text-blue-600 sm:inline">
                Explore PoultryOps
              </span>
            </div>

            <p className="truncate text-xs text-slate-600">
              You&apos;re viewing sample PoultryOps data.
              Changes are disabled.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 sm:inline-flex"
        >
          Want your own farm?
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}