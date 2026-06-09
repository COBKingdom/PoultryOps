import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">
          Login
        </h1>

        <p className="text-sm text-gray-500 mt-2 mb-6">
          Access your PoultryOps account
        </p>

        <LoginForm />
      </div>
    </main>
  );
}