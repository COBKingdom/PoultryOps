"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

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
        bg-white
        border-b
        border-slate-200
        px-4
        md:px-6
        py-4
        flex
        items-center
        justify-between
        sticky
        top-0
        z-20
      "
    >
      <div>

        <p
          className="
            text-sm
            text-slate-500
          "
        >
          {greeting}
        </p>

        <h1
          className="
            text-2xl
            md:text-3xl
            font-bold
            text-slate-900
          "
        >
          {farmName ||
            "My Poultry Farm"}
        </h1>

        <p
          className="
            text-xs
            text-slate-400
            mt-1
          "
        >
          {today}
        </p>

      </div>

      <div
        ref={menuRef}
        className="
          flex
          items-center
          gap-4
          relative
        "
      >
        <div
          className="
            hidden
            lg:block
            text-right
          "
        >
          <p
            className="
              text-xs
              text-slate-500
            "
          >
            Signed in as
          </p>

          <p
            className="
              text-sm
              font-medium
              text-slate-900
            "
          >
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
            w-12
            h-12
            rounded-full
            bg-blue-600
            text-white
            flex
            items-center
            justify-center
            font-semibold
            text-lg
            hover:bg-blue-700
            transition
          "
        >
          {email
            ?.charAt(0)
            .toUpperCase()}
        </button>

        {menuOpen && (
          <div
            className="
              absolute
              right-0
              top-14
              w-64
              bg-white
              border
              border-slate-200
              rounded-2xl
              shadow-xl
              overflow-hidden
              z-50
            "
          >

            <div
              className="
                px-4
                py-3
                border-b
                border-slate-100
              "
            >
              <p
                className="
                  text-xs
                  text-slate-500
                "
              >
                Signed in as
              </p>

              <p
                className="
                  text-sm
                  font-medium
                "
              >
                {email}
              </p>
            </div>

            <Link
              href="/profile"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                block
                px-4
                py-3
                hover:bg-slate-50
              "
            >
              Profile
            </Link>

            <Link
              href="/settings"
              onClick={() =>
                setMenuOpen(false)
              }
              className="
                block
                px-4
                py-3
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
                block
                px-4
                py-3
                hover:bg-slate-50
              "
            >
              Subscription
            </Link>

            <div
              className="
                border-t
                border-slate-100
              "
            >
              <button
                onClick={
                  handleSignOut
                }
                className="
                  w-full
                  text-left
                  px-4
                  py-3
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