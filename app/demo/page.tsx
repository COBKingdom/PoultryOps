import { Suspense } from "react";
import Link from "next/link";

import LoginForm from "@/components/auth/login-form";

export default function DemoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-5">

      <div className="w-full max-w-md">

        {/* BRANDING */}

        <div className="text-center mb-7">

          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white text-3xl font-bold shadow-lg mb-4">
            P
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            PoultryOps
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Smarter Poultry Farm Management
          </p>

        </div>

        {/* DEMO LOGIN CARD */}

        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-slate-100">

          <div className="mb-6">

            <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-3">
              PoultryOps Live Demo
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              Experience PoultryOps
            </h2>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Explore how PoultryOps helps poultry
              farmers manage their flocks, feed,
              egg production, sales, expenses and
              overall farm performance.
            </p>

          </div>

          <Suspense
            fallback={
              <div className="py-6 text-center text-sm text-slate-500">
                Preparing your demo access...
              </div>
            }
          >
            <LoginForm demoMode />
          </Suspense>

          <div className="mt-6 border-t border-slate-100 pt-5">

            <p className="text-xs text-center text-slate-500 leading-relaxed">
              Your details help us understand who is
              exploring PoultryOps. Your demo access
              uses our shared demonstration farm.
            </p>

          </div>

        </div>

        {/* FOOTER */}

        <div className="mt-6 text-center space-y-2">

          <p className="text-sm text-slate-500">
            Already have a PoultryOps account?
          </p>

          <Link
            href="/login"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Go to normal customer login
          </Link>

          <p className="text-xs text-slate-400 pt-3">
            © {new Date().getFullYear()} PoultryOps · Powered by TrueOps
          </p>

        </div>

      </div>

    </main>
  );
}