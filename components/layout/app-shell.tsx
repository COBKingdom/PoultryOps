"use client";

import { ReactNode, useState } from "react";

import { Menu } from "lucide-react";

import Sidebar from "./sidebar";
import Topbar from "./topbar";
import MobileSidebar from "./mobile-sidebar";

type Props = {
  email?: string;
  children: ReactNode;
};

export default function AppShell({
  email,
  children,
}: Props) {
  const [open, setOpen] =
    useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <MobileSidebar
        open={open}
        onClose={() =>
          setOpen(false)
        }
      />

      <main className="flex-1 min-w-0">

        <div className="lg:hidden bg-white border-b px-4 py-3">

          <button
            onClick={() =>
              setOpen(true)
            }
          >
            <Menu />
          </button>

        </div>

        <Topbar
          email={email}
        />

        <div className="p-4 md:p-6">
          {children}
        </div>

      </main>

    </div>
  );
}