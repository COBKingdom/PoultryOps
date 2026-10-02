"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Eye } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/lib/permissions";

type Props = {
  email?: string;
  farmName?: string;
};

export default function Topbar({
  email,
  farmName,
}: Props) {
  const router =
    useRouter();

  const {
    isDemoMode,
  } = usePermissions();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const hour =
    new Date().getHours();

  let greeting =
    "Good Morning";

  if (hour >= 12) {
    greeting =
      "Good Afternoon";
  }

  if (hour >= 17) {
    greeting =
      "Good Evening";
  }

  const today =
    new Date().toLocaleDateString(
      undefined,
      {
        weekday: "long",
        month: "short",
        day: "numeric",
      }
    );

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();

    router.push("/login");
  }

  return (
    <div
      className="
        sticky top-0 z-20
        flex items-center justify-between
        border-b border-slate-200
        bg-white px-4 py-4
        md:px-6
      "
    >

      <div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">
            {greeting}
          </p>

          {isDemoMode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold tracking-wide text-blue-700">
              <Eye size={11} />
              DEMO
            </span>
          )}
        </div>

        <h1
          className="
            text-2xl font-bold
            text-slate-900
            md:text-3xl
          "
        >
          {farmName ||
            "My Poultry Farm"}
        </h1>

        <p
          className="
            mt-1 text-xs
            text-slate-400
          "
        >
          {today}
        </p>

      </div>

      <div
        ref={menuRef}
        className="
          relative flex items-center
          gap-4
        "
      >

        <div
          className="
            hidden text-right
            lg:block
          "
        >
          <p className="text-xs text-slate-500">
            Signed in as
          </p>

          <p className="text-sm font-medium text-slate-900">
            {email}
          </p>
        </div>

        <button
          onClick={() =>
            setMenuOpen(
              !menuOpen
            )
          }
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-full bg-blue-600
            text-lg font-semibold
            text-white transition
            hover:bg-blue-700
          "
        >
          {email
            ?.charAt(0)
            .toUpperCase()}
        </button>

        {menuOpen && (
          <div
            className="
              absolute right-0 top-14
              z-50 w-64
              overflow-hidden
              rounded-2xl border
              border-slate-200
              bg-white
              shadow-xl
            "
          >

            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                Signed in as
              </p>

              <p className="text-sm font-medium">
                {email}
              </p>
            </div>

            {isDemoMode && (
              <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Eye
                    size={15}
                    className="text-blue-600"
                  />

                  <span className="text-xs font-bold text-blue-700">
                    DEMO MODE
                  </span>
                </div>

                <p className="mt-1 text-xs text-blue-600">
                  Settings and account
                  management are disabled.
                </p>
              </div>
            )}

            <Link
              href="/profile"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                block px-4 py-3
                hover:bg-slate-50
              "
            >
              Profile
            </Link>

            {!isDemoMode && (
              <>
                <Link
                  href="/settings"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="
                    block px-4 py-3
                    hover:bg-slate-50
                  "
                >
                  Settings
                </Link>

                <Link
                  href="/settings/subscription"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="
                    block px-4 py-3
                    hover:bg-slate-50
                  "
                >
                  Subscription
                </Link>
              </>
            )}

            <div className="border-t border-slate-100">
              <button
                onClick={
                  handleSignOut
                }
                className="
                  w-full px-4 py-3
                  text-left
                  text-red-600
                  hover:bg-red-50
                "
              >
                Sign Out
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}