"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

import AppShell from "./app-shell";

type Props = {
  children: ReactNode;
};

export default function ProtectedPage({
  children,
}: Props) {
  const { user } = useAuth();

  return (
    <AppShell
      email={user?.email}
    >
      {children}
    </AppShell>
  );
}