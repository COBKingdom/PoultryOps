"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

import OnboardingForm from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  const router =
    useRouter();

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    if (
      !loading &&
      !user
    ) {
      router.push(
        "/login"
      );
    }
  }, [
    user,
    loading,
    router,
  ]);

  if (
    loading ||
    !user
  ) {
    return (
      <main
        className="
          min-h-screen
          flex
          items-center
          justify-center
        "
      >
        Loading...
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-slate-100
        flex
        items-center
        justify-center
        p-6
      "
    >
      <OnboardingForm />
    </main>
  );
}