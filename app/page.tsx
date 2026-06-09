import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            PoultryOps
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            Poultry farm management software built
            for modern poultry operations.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-6 py-3 text-white"
            >
              Start Free Trial
            </Link>

            <Link
              href="/login"
              className="rounded-lg border px-6 py-3"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}