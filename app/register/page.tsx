import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
            <div className="text-center text-sm text-slate-500">
              Loading registration...
            </div>
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}