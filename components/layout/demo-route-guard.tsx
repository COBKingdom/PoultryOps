"use client";

import { useEffect, useState } from "react";
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

export default function DemoRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useAuth();
  const { farm, loading } = useCurrentFarm();

  const [showReadOnlyModal, setShowReadOnlyModal] =
    useState(false);

  const isDemoMode =
    Boolean(user) &&
    !loading &&
    farm?.farm_code === "DEMO-001";

  /*
   * Demo route protection.
   *
   * This only activates after an authenticated user
   * has been identified as the Demo farm.
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
   * This only runs while DEMO-001 is active.
   * Login, registration and normal farms are untouched.
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

      /*
       * Allow interaction with our Demo Mode modal.
       * Otherwise the "Create Your Free Account"
       * button would itself be intercepted.
       */
      if (
        target.closest(
          "[data-demo-readonly-modal]"
        )
      ) {
        return;
      }

      if (looksLikeWriteAction(target)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        setShowReadOnlyModal(true);
      }
    };

    const handleDemoSubmit = (event: SubmitEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLFormElement)) {
        return;
      }

      /*
       * Never intercept forms inside the Demo modal.
       */
      if (
        target.closest(
          "[data-demo-readonly-modal]"
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setShowReadOnlyModal(true);
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

  return (
    <>
      {children}

      {isDemoMode && showReadOnlyModal && (
        <div
          data-demo-readonly-modal
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-readonly-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Demo header */}
            <div className="bg-amber-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
                  👀
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-950">
                    PoultryOps
                  </div>

                  <h2
                    id="demo-readonly-title"
                    className="text-xl font-extrabold text-white"
                  >
                    Demo Mode
                  </h2>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="px-6 py-6">
              <p className="text-base font-semibold leading-6 text-slate-900">
                You're exploring sample PoultryOps data.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Demo Mode is read-only, so changes
                cannot be saved.
              </p>

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-bold text-slate-900">
                  Want your own PoultryOps farm?
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-600">
                  It's free to get started. Create
                  your own account and start managing
                  your real farm data.
                </p>
              </div>

              {/* CTA */}
              <a
                href="https://poultry.trueops.app/register"
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
              >
                Create Your Free Account
              </a>

              {/* Continue */}
              <button
                type="button"
                onClick={() =>
                  setShowReadOnlyModal(false)
                }
                className="mt-3 w-full rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}