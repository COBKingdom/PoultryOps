"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import { usePathname, useRouter } from "next/navigation";

import { useCurrentFarm } from "@/hooks/useCurrentFarm";

const DEMO_FARM_CODE = "DEMO-001";

const DEMO_BLOCKED_ROUTES = [
  "/settings",
  "/team",
  "/migration",
  "/admin",
  "/setup",
];

function isBlockedDemoRoute(
  pathname: string
): boolean {
  return DEMO_BLOCKED_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

const MUTATION_PATTERN =
  /\b(add|create|edit|update|delete|remove|archive|save|record|import|invite|upload)\b/i;

export default function DemoRouteGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    farm,
    loading: farmLoading,
  } = useCurrentFarm();

  const [blockedMessage, setBlockedMessage] =
    useState(false);

  const isDemo =
    !farmLoading &&
    farm?.farm_code === DEMO_FARM_CODE;

  useEffect(() => {
    if (farmLoading) {
      return;
    }

    if (isDemo) {
      document.documentElement.dataset.demoMode =
        "true";
    } else {
      delete document.documentElement
        .dataset.demoMode;
    }

    if (
      isDemo &&
      isBlockedDemoRoute(pathname)
    ) {
      router.replace("/dashboard");
    }
  }, [
    farmLoading,
    isDemo,
    pathname,
    router,
  ]);

  useEffect(() => {
    if (!isDemo) {
      return;
    }

    function handleClick(
      event: MouseEvent
    ) {
      const target =
        event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      const button =
        target.closest(
          "button, [role='button']"
        ) as HTMLElement | null;

      if (!button) {
        return;
      }

      const text =
        button.textContent ||
        button.getAttribute(
          "aria-label"
        ) ||
        "";

      if (
        !MUTATION_PATTERN.test(text)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setBlockedMessage(true);

      window.setTimeout(() => {
        setBlockedMessage(false);
      }, 3000);
    }

    function handleSubmit(
      event: SubmitEvent
    ) {
      event.preventDefault();
      event.stopPropagation();

      setBlockedMessage(true);

      window.setTimeout(() => {
        setBlockedMessage(false);
      }, 3000);
    }

    document.addEventListener(
      "click",
      handleClick,
      true
    );

    document.addEventListener(
      "submit",
      handleSubmit,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleClick,
        true
      );

      document.removeEventListener(
        "submit",
        handleSubmit,
        true
      );
    };
  }, [isDemo]);

  return (
    <>
      {children}

      {blockedMessage && (
        <div className="fixed bottom-6 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-blue-200 bg-white px-5 py-4 shadow-2xl">
          <p className="text-sm font-semibold text-slate-900">
            Demo Mode
          </p>

          <p className="mt-1 text-sm text-slate-600">
            This is a read-only demonstration.
            Start your own PoultryOps farm to
            create and manage real data.
          </p>
        </div>
      )}
    </>
  );
}