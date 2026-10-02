"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentFarm } from "@/hooks/useCurrentFarm";

const DEMO_BLOCKED_PREFIXES = [
  "/settings",
  "/team",
  "/migration",
  "/admin",
  "/setup",
];

const DEMO_ACTION_WORDS = [
  "add",
  "create",
  "edit",
  "update",
  "delete",
  "remove",
  "archive",
  "save",
  "record",
  "import",
  "invite",
  "upload",
  "submit",
  "confirm",
  "restore",
];

function isBlockedDemoRoute(pathname: string) {
  return DEMO_BLOCKED_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );
}

function looksLikeWriteAction(element: HTMLElement) {
  const button = element.closest(
    "button, input[type='submit'], input[type='button']"
  ) as HTMLElement | null;

  if (!button) {
    return false;
  }

  const text = [
    button.textContent || "",
    button.getAttribute("aria-label") || "",
    button.getAttribute("title") || "",
    button.getAttribute("name") || "",
    button.getAttribute("value") || "",
  ]
    .join(" ")
    .trim()
    .toLowerCase();

  return DEMO_ACTION_WORDS.some((word) =>
    text.includes(word)
  );
}

function showDemoReadOnlyMessage() {
  window.alert(
    "Demo Mode is read-only. You can explore the sample data, but changes cannot be saved.\n\nStart your own PoultryOps farm to create and manage real data."
  );
}

export default function DemoRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useAuth();
  const { farm, loading } = useCurrentFarm();

  const isDemoMode =
    Boolean(user) &&
    !loading &&
    farm?.farm_code === "DEMO-001";

  /*
   * Demo route protection.
   *
   * IMPORTANT:
   * This only runs after an authenticated user has
   * been identified as the DEMO-001 farm.
   *
   * Therefore login, registration and normal farms
   * are completely unaffected.
   */
  useEffect(() => {
    if (
      isDemoMode &&
      isBlockedDemoRoute(pathname)
    ) {
      router.replace("/dashboard");
    }
  }, [
    isDemoMode,
    pathname,
    router,
  ]);

  /*
   * Demo write protection.
   *
   * This is deliberately attached ONLY while Demo Mode
   * is active. It cannot interfere with login,
   * registration or normal farms.
   */
  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    const handleDemoClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (looksLikeWriteAction(target)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        showDemoReadOnlyMessage();
      }
    };

    const handleDemoSubmit = (event: SubmitEvent) => {
      const form = event.target;

      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      showDemoReadOnlyMessage();
    };

    document.addEventListener(
      "click",
      handleDemoClick,
      true
    );

    document.addEventListener(
      "submit",
      handleDemoSubmit,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDemoClick,
        true
      );

      document.removeEventListener(
        "submit",
        handleDemoSubmit,
        true
      );
    };
  }, [isDemoMode]);

  return <>{children}</>;
}