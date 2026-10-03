"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { usePermissions } from "@/lib/permissions";

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

const DEMO_RESTRICTED_ROUTES = [
  "/settings",
  "/team",
  "/migration",
  "/admin",
  "/setup",
];

/*
 * These routes must NEVER be affected by Demo Mode.
 *
 * This is especially important for /login because the application
 * layout may remain mounted while authentication is changing.
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

function isPublicRoute(
  pathname: string
) {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

function containsDemoActionText(
  element: HTMLElement
) {
  const values = [
    element.textContent || "",
    element.getAttribute("aria-label") || "",
    element.getAttribute("title") || "",
    element.getAttribute("name") || "",
    element.getAttribute("value") || "",
  ]
    .join(" ")
    .toLowerCase();

  return DEMO_ACTION_WORDS.some(
    (word) =>
      new RegExp(
        `\\b${word}\\b`,
        "i"
      ).test(values)
  );
}

function isWriteElement(
  element: HTMLElement
) {
  const button =
    element.closest(
      "button"
    ) as HTMLButtonElement | null;

  if (button) {
    return containsDemoActionText(
      button
    );
  }

  const input =
    element.closest(
      "input"
    ) as HTMLInputElement | null;

  if (input) {
    const type =
      (
        input.getAttribute("type") ||
        ""
      ).toLowerCase();

    if (
      type === "submit" ||
      type === "button"
    ) {
      return containsDemoActionText(
        input
      );
    }
  }

  return false;
}

export default function DemoRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    isDemoMode,
    loading: permissionsLoading,
  } = usePermissions();

  const [showModal, setShowModal] =
    useState(false);

  /*
   * ============================================================
   * PUBLIC / AUTHENTICATION ROUTES
   * ============================================================
   *
   * Demo Mode must NEVER interfere with these routes.
   *
   * This prevents the Demo Guard from appearing on the login
   * screen while authentication is being established or changed.
   */
  const onPublicRoute =
    isPublicRoute(pathname);

  /*
   * If navigation reaches a public route, immediately close any
   * Demo modal that may have been open.
   */
  useEffect(() => {
    if (onPublicRoute) {
      setShowModal(false);
    }
  }, [onPublicRoute]);

  /*
   * ============================================================
   * DEMO MODE
   * ============================================================
   *
   * We deliberately use the existing permissions system rather
   * than querying the current farm again.
   *
   * AppShell already uses this same source of truth.
   */
  const demoActive =
    !permissionsLoading &&
    isDemoMode &&
    !onPublicRoute;

  /*
   * ============================================================
   * DEMO RESTRICTED ROUTES
   * ============================================================
   */
  useEffect(() => {
    if (!demoActive) {
      return;
    }

    const isRestrictedRoute =
      DEMO_RESTRICTED_ROUTES.some(
        (route) =>
          pathname === route ||
          pathname.startsWith(
            `${route}/`
          )
      );

    if (isRestrictedRoute) {
      setShowModal(false);

      router.replace(
        "/dashboard"
      );
    }
  }, [
    demoActive,
    pathname,
    router,
  ]);

  /*
   * ============================================================
   * DEMO WRITE PROTECTION
   * ============================================================
   *
   * These listeners are installed ONLY when:
   *
   * 1. permissions have finished loading
   * 2. the current user is actually Demo
   * 3. the current route is not public/authentication
   *
   * Normal subscribers therefore have no Demo interception.
   */
  useEffect(() => {
    if (!demoActive) {
      return;
    }

    const handleClick = (
      event: MouseEvent
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      /*
       * Never intercept anything inside our own modal.
       */
      if (
        target.closest(
          "[data-demo-readonly-modal]"
        )
      ) {
        return;
      }

      if (
        isWriteElement(target)
      ) {
        event.preventDefault();
        event.stopPropagation();

        setShowModal(true);
      }
    };

    const handleSubmit = (
      event: SubmitEvent
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      /*
       * Never intercept our own Demo modal.
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

      setShowModal(true);
    };

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
  }, [demoActive]);

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
      {children}

      {demoActive &&
        showModal && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-[2px]"
            onClick={() =>
              setShowModal(false)
            }
            data-demo-readonly-modal
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) =>
                event.stopPropagation()
              }
              data-demo-readonly-modal
            >
              {/* DEMO MODAL HEADER */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-2xl">
                    👀
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em]">
                      PoultryOps
                    </div>

                    <div className="text-2xl font-bold">
                      Demo Mode
                    </div>
                  </div>
                </div>
              </div>

              {/* DEMO MODAL BODY */}
              <div className="px-6 py-6">
                <h2 className="text-base font-bold text-slate-900">
                  You're exploring sample PoultryOps data.
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Demo Mode is read-only, so changes cannot be saved.
                </p>

                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    Want your own PoultryOps farm?
                  </div>

                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    It's free to get started. Create your own account and start managing your real farm data.
                  </p>
                </div>

                <a
                  href="https://poultry.trueops.app/register"
                  className="mt-6 flex h-12 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30"
                  data-demo-readonly-modal
                >
                  Create Your Free Account
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="mt-4 w-full py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                  data-demo-readonly-modal
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